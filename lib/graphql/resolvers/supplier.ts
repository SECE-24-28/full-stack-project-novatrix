import { GraphQLError } from "graphql";
import { createSupplierSchema, updateSupplierSchema } from "@/lib/validators/supplier";
import { supplierService } from "@/lib/services/supplier.service";
import { requirePermission } from "@/lib/auth/guards";
import type { GraphQLContext } from "@/types/auth";
import type { SupplierStatus } from "@prisma/client";

interface SuppliersArgs {
  filter?:     { search?: string; status?: SupplierStatus };
  pagination?: { page: number; limit: number };
}

async function audit(
  ctx: GraphQLContext,
  action: "CREATE" | "UPDATE" | "DELETE",
  resourceId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  await ctx.prisma.auditLog.create({
    data: {
      userId:     ctx.auth?.userId ?? null,
      action,
      resource:   "Supplier",
      resourceId,
      oldValues:  oldValues as import("@prisma/client").Prisma.InputJsonValue | undefined,
      newValues:  newValues as import("@prisma/client").Prisma.InputJsonValue | undefined,
      ipAddress:  ctx.ipAddress,
      userAgent:  ctx.userAgent,
    },
  });
}

export const supplierResolvers = {
  Query: {
    supplier: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:suppliers");
      const s = await supplierService.findById(ctx.prisma, id);
      if (!s) throw new GraphQLError("Supplier not found.", { extensions: { code: "NOT_FOUND" } });
      return s;
    },

    suppliers: async (_: unknown, args: SuppliersArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:suppliers");
      return supplierService.findMany(ctx.prisma, args.filter, args.pagination);
    },
  },

  Mutation: {
    createSupplier: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:suppliers");

      const parsed = createSupplierSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const existing = await ctx.prisma.supplier.findFirst({
        where: { code: parsed.data.code.toUpperCase() },
      });
      if (existing) {
        throw new GraphQLError(`Supplier code "${parsed.data.code}" is already in use.`, {
          extensions: { code: "CONFLICT" },
        });
      }

      const supplier = await supplierService.create(ctx.prisma, parsed.data);
      await audit(ctx, "CREATE", supplier.id, undefined, { name: supplier.name, code: supplier.code });
      return supplier;
    },

    updateSupplier: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:suppliers");

      const parsed = updateSupplierSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const before = await supplierService.findById(ctx.prisma, parsed.data.id);
      if (!before) throw new GraphQLError("Supplier not found.", { extensions: { code: "NOT_FOUND" } });

      if (parsed.data.code && parsed.data.code.toUpperCase() !== before.code) {
        const conflict = await ctx.prisma.supplier.findFirst({
          where: { code: parsed.data.code.toUpperCase() },
        });
        if (conflict) {
          throw new GraphQLError(`Supplier code "${parsed.data.code}" is already in use.`, {
            extensions: { code: "CONFLICT" },
          });
        }
      }

      const { id, ...rest } = parsed.data;
      const updated = await supplierService.update(ctx.prisma, id, rest);
      await audit(ctx, "UPDATE", id,
        { name: before.name, status: before.status },
        { name: updated.name, status: updated.status }
      );
      return updated;
    },

    deleteSupplier: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "delete:suppliers");

      const supplier = await supplierService.findById(ctx.prisma, id);
      if (!supplier) throw new GraphQLError("Supplier not found.", { extensions: { code: "NOT_FOUND" } });

      try {
        await supplierService.delete(ctx.prisma, id);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }

      await audit(ctx, "DELETE", id, { name: supplier.name, code: supplier.code });
      return true;
    },
  },
};
