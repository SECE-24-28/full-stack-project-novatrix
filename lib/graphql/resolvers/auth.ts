import { GraphQLError } from "graphql";
import type { Role } from "@prisma/client";
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from "@/lib/validators/auth";
import { signAccessToken, signRefreshToken, REFRESH_TOKEN_MS } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import type { GraphQLContext } from "@/types/auth";

// ─── Input types ──────────────────────────────────────────────────────────────

interface LoginInput          { email: string; password: string; }
interface RegisterInput       { email: string; password: string; firstName: string; lastName: string; role?: Role; }
interface UpdateProfileInput  { firstName?: string; lastName?: string; email?: string; }
interface ChangePasswordInput { currentPassword: string; newPassword: string; }
interface UpdateUserRoleInput { userId: string; role: Role; }
interface PaginationInput     { page: number; limit: number; }
interface UsersFilterInput    { role?: Role; isActive?: boolean; search?: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createTokenPair(
  userId: string,
  email: string,
  role: Role,
  ctx: GraphQLContext
) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: userId, email, role }),
    signRefreshToken(userId),
  ]);
  await ctx.prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS) },
  });
  return { accessToken, refreshToken };
}

async function writeAudit(
  ctx: GraphQLContext,
  params: {
    action:      "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    resource:    string;
    resourceId?: string;
    userId?:     string;
    oldValues?:  Record<string, unknown>;
    newValues?:  Record<string, unknown>;
  }
) {
  await ctx.prisma.auditLog.create({
    data: {
      userId:     params.userId ?? ctx.auth?.userId ?? null,
      action:     params.action,
      resource:   params.resource,
      resourceId: params.resourceId,
      oldValues:  params.oldValues ? (params.oldValues as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      newValues:  params.newValues ? (params.newValues as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      ipAddress:  ctx.ipAddress,
      userAgent:  ctx.userAgent,
    },
  });
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const authResolvers = {
  User: {
    fullName: (user: { firstName: string; lastName: string }) =>
      `${user.firstName} ${user.lastName}`,
  },

  Query: {
    _healthcheck: () => "OK",

    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx.auth);
      return ctx.prisma.user.findUnique({ where: { id: ctx.auth.userId } });
    },

    user: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:users");
      const user = await ctx.prisma.user.findUnique({ where: { id } });
      if (!user) throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });
      return user;
    },

    users: async (
      _: unknown,
      { filter, pagination }: { filter?: UsersFilterInput; pagination?: PaginationInput },
      ctx: GraphQLContext
    ) => {
      requirePermission(ctx.auth, "read:users");

      const page  = pagination?.page  ?? 1;
      const limit = pagination?.limit ?? 20;
      const skip  = (page - 1) * limit;

      const where = {
        ...(filter?.role     !== undefined && { role: filter.role }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter?.search && {
          OR: [
            { firstName: { contains: filter.search, mode: "insensitive" as const } },
            { lastName:  { contains: filter.search, mode: "insensitive" as const } },
            { email:     { contains: filter.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [nodes, totalCount] = await Promise.all([
        ctx.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        nodes,
        pageInfo: {
          totalCount,
          totalPages:      Math.ceil(totalCount / limit),
          currentPage:     page,
          hasNextPage:     page * limit < totalCount,
          hasPreviousPage: page > 1,
        },
      };
    },
  },

  Mutation: {
    // ── register ──────────────────────────────────────────────────────────────
    register: async (_: unknown, { input }: { input: RegisterInput }, ctx: GraphQLContext) => {
      const parsed = registerSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const exists = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (exists) {
        throw new GraphQLError("An account with this email already exists.", {
          extensions: { code: "CONFLICT" },
        });
      }

      // Only ADMIN+ can assign roles above VIEWER on registration
      const requestedRole: Role =
        input.role && ctx.auth?.role && ["SUPER_ADMIN", "ADMIN"].includes(ctx.auth.role)
          ? input.role
          : "VIEWER";

      const user = await ctx.prisma.user.create({
        data: {
          email:        input.email,
          passwordHash: await hashPassword(input.password),
          firstName:    input.firstName,
          lastName:     input.lastName,
          role:         requestedRole,
        },
      });

      await writeAudit(ctx, {
        action: "CREATE", resource: "User", resourceId: user.id, userId: user.id,
        newValues: { email: user.email, role: user.role },
      });

      return { user, tokens: await createTokenPair(user.id, user.email, user.role, ctx) };
    },

    // ── login ─────────────────────────────────────────────────────────────────
    login: async (_: unknown, { input }: { input: LoginInput }, ctx: GraphQLContext) => {
      const parsed = loginSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError("Invalid email or password format.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      const passwordMatch = user ? await verifyPassword(input.password, user.passwordHash) : false;

      if (!user || !passwordMatch || !user.isActive) {
        throw new GraphQLError("Invalid email or password.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      await writeAudit(ctx, {
        action: "LOGIN", resource: "User", resourceId: user.id, userId: user.id,
      });

      return { user, tokens: await createTokenPair(user.id, user.email, user.role, ctx) };
    },

    // ── logout ────────────────────────────────────────────────────────────────
    logout: async (_: unknown, { refreshToken }: { refreshToken: string }, ctx: GraphQLContext) => {
      await ctx.prisma.refreshToken.updateMany({
        where: { token: refreshToken, revokedAt: null },
        data:  { revokedAt: new Date() },
      });
      if (ctx.auth) {
        await writeAudit(ctx, { action: "LOGOUT", resource: "User", resourceId: ctx.auth.userId });
      }
      return true;
    },

    // ── refreshToken ──────────────────────────────────────────────────────────
    refreshToken: async (_: unknown, { token }: { token: string }, ctx: GraphQLContext) => {
      const stored = await ctx.prisma.refreshToken.findUnique({
        where:   { token },
        include: { user: true },
      });

      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw new GraphQLError("Invalid or expired refresh token.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Token rotation — revoke current, issue fresh pair
      await ctx.prisma.refreshToken.update({
        where: { id: stored.id },
        data:  { revokedAt: new Date() },
      });

      return createTokenPair(stored.user.id, stored.user.email, stored.user.role, ctx);
    },

    // ── updateProfile ─────────────────────────────────────────────────────────
    updateProfile: async (_: unknown, { input }: { input: UpdateProfileInput }, ctx: GraphQLContext) => {
      requireAuth(ctx.auth);

      const parsed = updateProfileSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (input.email) {
        const conflict = await ctx.prisma.user.findFirst({
          where: { email: input.email, NOT: { id: ctx.auth.userId } },
        });
        if (conflict) {
          throw new GraphQLError("Email is already in use.", { extensions: { code: "CONFLICT" } });
        }
      }

      const before  = await ctx.prisma.user.findUnique({ where: { id: ctx.auth.userId } });
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.auth.userId },
        data:  {
          ...(input.firstName && { firstName: input.firstName }),
          ...(input.lastName  && { lastName:  input.lastName  }),
          ...(input.email     && { email:     input.email     }),
        },
      });

      await writeAudit(ctx, {
        action:     "UPDATE",
        resource:   "User",
        resourceId: updated.id,
        oldValues:  { firstName: before?.firstName, lastName: before?.lastName, email: before?.email },
        newValues:  { firstName: updated.firstName, lastName: updated.lastName, email: updated.email },
      });

      return updated;
    },

    // ── changePassword ────────────────────────────────────────────────────────
    changePassword: async (_: unknown, { input }: { input: ChangePasswordInput }, ctx: GraphQLContext) => {
      requireAuth(ctx.auth);

      const parsed = changePasswordSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.auth.userId } });
      if (!user) throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });

      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new GraphQLError("Current password is incorrect.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      await ctx.prisma.user.update({
        where: { id: ctx.auth.userId },
        data:  { passwordHash: await hashPassword(input.newPassword) },
      });

      // Invalidate all existing refresh tokens on password change
      await ctx.prisma.refreshToken.updateMany({
        where: { userId: ctx.auth.userId, revokedAt: null },
        data:  { revokedAt: new Date() },
      });

      await writeAudit(ctx, {
        action: "UPDATE", resource: "User", resourceId: ctx.auth.userId,
        newValues: { passwordChanged: true },
      });

      return true;
    },

    // ── revokeAllSessions ─────────────────────────────────────────────────────
    revokeAllSessions: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx.auth);
      await ctx.prisma.refreshToken.updateMany({
        where: { userId: ctx.auth.userId, revokedAt: null },
        data:  { revokedAt: new Date() },
      });
      return true;
    },

    // ── updateUserRole ────────────────────────────────────────────────────────
    updateUserRole: async (_: unknown, { input }: { input: UpdateUserRoleInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:users");

      const target = await ctx.prisma.user.findUnique({ where: { id: input.userId } });
      if (!target) throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });

      const roleHierarchy: Role[] = ["VIEWER", "INVENTORY_CLERK", "WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"];
      const actorLevel  = roleHierarchy.indexOf(ctx.auth!.role);
      const targetLevel = roleHierarchy.indexOf(input.role);

      if (targetLevel >= actorLevel) {
        throw new GraphQLError("Cannot assign a role at or above your own.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data:  { role: input.role },
      });

      await writeAudit(ctx, {
        action:     "UPDATE",
        resource:   "User",
        resourceId: updated.id,
        oldValues:  { role: target.role },
        newValues:  { role: updated.role },
      });

      return updated;
    },

    // ── deactivateUser ────────────────────────────────────────────────────────
    deactivateUser: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:users");

      if (userId === ctx.auth!.userId) {
        throw new GraphQLError("You cannot deactivate your own account.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data:  { isActive: false },
      });

      await writeAudit(ctx, {
        action: "UPDATE", resource: "User", resourceId: userId,
        newValues: { isActive: false },
      });

      return user;
    },

    // ── activateUser ──────────────────────────────────────────────────────────
    activateUser: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:users");

      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data:  { isActive: true },
      });

      await writeAudit(ctx, {
        action: "UPDATE", resource: "User", resourceId: userId,
        newValues: { isActive: true },
      });

      return user;
    },
  },
};
