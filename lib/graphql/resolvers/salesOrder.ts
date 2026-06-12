import { GraphQLError } from "graphql";
import { createSalesOrderSchema } from "@/lib/validators/salesOrder";
import { salesOrderService } from "@/lib/services/salesOrder.service";
import { requirePermission } from "@/lib/auth/guards";
import type { GraphQLContext } from "@/types/auth";
import type { SalesOrderStatus } from "@prisma/client";

interface SOsArgs {
  filter?:     { search?: string; status?: SalesOrderStatus; warehouseId?: string };
  pagination?: { page: number; limit: number };
}

async function audit(
  ctx: GraphQLContext,
  action: "CREATE" | "UPDATE",
  resourceId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  await ctx.prisma.auditLog.create({
    data: {
      userId:    ctx.auth?.userId ?? null,
      action,
      resource:  "SalesOrder",
      resourceId,
      oldValues: oldValues as import("@prisma/client").Prisma.InputJsonValue | undefined,
      newValues: newValues as import("@prisma/client").Prisma.InputJsonValue | undefined,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });
}

export const salesOrderResolvers = {
  Query: {
    salesOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:orders");
      const so = await salesOrderService.findById(ctx.prisma, id);
      if (!so) throw new GraphQLError("Sales order not found.", { extensions: { code: "NOT_FOUND" } });
      return so;
    },

    salesOrders: async (_: unknown, args: SOsArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:orders");
      return salesOrderService.findMany(ctx.prisma, args.filter, args.pagination);
    },
  },

  Mutation: {
    createSalesOrder: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:orders");

      const parsed = createSalesOrderSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const [warehouse, products] = await Promise.all([
        ctx.prisma.warehouse.findUnique({ where: { id: parsed.data.warehouseId } }),
        ctx.prisma.product.findMany({
          where: { id: { in: parsed.data.items.map((i) => i.productId) } },
          select: { id: true },
        }),
      ]);

      if (!warehouse) throw new GraphQLError("Warehouse not found.", { extensions: { code: "NOT_FOUND" } });
      if (products.length !== parsed.data.items.length) {
        throw new GraphQLError("One or more products not found.", { extensions: { code: "NOT_FOUND" } });
      }

      const so = await salesOrderService.create(ctx.prisma, {
        ...parsed.data,
        createdById: ctx.auth!.userId,
      });
      await audit(ctx, "CREATE", so.id, undefined, { soNumber: so.soNumber, status: so.status });
      return so;
    },

    processSalesOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const so = await salesOrderService.process(ctx.prisma, id);
        await audit(ctx, "UPDATE", id, { status: "CONFIRMED" }, { status: "PROCESSING" });
        return so;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    shipSalesOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const so = await salesOrderService.ship(ctx.prisma, id, ctx.auth!.userId);
        await audit(ctx, "UPDATE", id, { status: "PROCESSING" }, { status: "SHIPPED" });
        return so;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    deliverSalesOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const so = await salesOrderService.deliver(ctx.prisma, id);
        await audit(ctx, "UPDATE", id, { status: "SHIPPED" }, { status: "DELIVERED" });
        return so;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    cancelSalesOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const so = await salesOrderService.cancel(ctx.prisma, id, ctx.auth!.userId);
        await audit(ctx, "UPDATE", id, undefined, { status: "CANCELLED" });
        return so;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },
  },
};
