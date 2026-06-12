import { GraphQLError } from "graphql";
import type { Role } from "@prisma/client";
import { type AuthContext, type Permission, hasPermission } from "@/types/auth";

// ─── Resolver guards (server-side) ───────────────────────────────────────────

export function requireAuth(
  auth: AuthContext | null
): asserts auth is AuthContext {
  if (!auth) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export function requirePermission(
  auth: AuthContext | null,
  permission: Permission
): asserts auth is AuthContext {
  requireAuth(auth);
  if (!hasPermission(auth.role, permission)) {
    throw new GraphQLError(
      `You do not have permission to perform this action.`,
      { extensions: { code: "FORBIDDEN", requiredPermission: permission } }
    );
  }
}

export function requireRole(
  auth: AuthContext | null,
  ...roles: Role[]
): asserts auth is AuthContext {
  requireAuth(auth);
  if (!roles.includes(auth.role)) {
    throw new GraphQLError("Access denied for your role.", {
      extensions: { code: "FORBIDDEN", allowedRoles: roles },
    });
  }
}

/** Returns true when auth is present AND has the given permission — no throw. */
export function canPerform(
  auth: AuthContext | null,
  permission: Permission
): boolean {
  return !!auth && hasPermission(auth.role, permission);
}
