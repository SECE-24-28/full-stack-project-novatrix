import { GraphQLError } from "graphql";
import { createPurchaseOrderSchema } from "@/lib/validators/purchaseOrder";
import { purchaseOrderService } from "@/lib/services/purchaseOrder.service";
import { requirePermission } from "@/lib/auth/guards";
import type { GraphQLContext } from "@/types/auth";
import type { PurchaseOrderStatus } from "@prisma/client";

interface POsArgs {
  filter?:     { search?: string; status?: PurchaseOrderStatus; supplierId?: string; warehouseId?: string };
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
      userId:     ctx.auth?.userId ?? null,
      action,
      resource:   "PurchaseOrder",
      resourceId,
      oldValues:  oldValues as import("@prisma/client").Prisma.InputJsonValue | undefined,
      newValues:  newValues as import("@prisma/client").Prisma.InputJsonValue | undefined,
      ipAddress:  ctx.ipAddress,
      userAgent:  ctx.userAgent,
    },
  });
}

export const purchaseOrderResolvers = {
  Query: {
    purchaseOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:orders");
      const po = await purchaseOrderService.findById(ctx.prisma, id);
      if (!po) throw new GraphQLError("Purchase order not found.", { extensions: { code: "NOT_FOUND" } });
      return po;
    },

    purchaseOrders: async (_: unknown, args: POsArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:orders");
      return purchaseOrderService.findMany(ctx.prisma, args.filter, args.pagination);
    },
  },

  Mutation: {
    createPurchaseOrder: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:orders");

      const parsed = createPurchaseOrderSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      // Verify supplier and warehouse exist
      const [supplier, warehouse] = await Promise.all([
        ctx.prisma.supplier.findUnique({ where: { id: parsed.data.supplierId } }),
        ctx.prisma.warehouse.findUnique({ where: { id: parsed.data.warehouseId } }),
      ]);
      if (!supplier)  throw new GraphQLError("Supplier not found.",  { extensions: { code: "NOT_FOUND" } });
      if (!warehouse) throw new GraphQLError("Warehouse not found.", { extensions: { code: "NOT_FOUND" } });

      // Verify all products exist
      const productIds = parsed.data.items.map((i) => i.productId);
      const products = await ctx.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
      if (products.length !== productIds.length) {
        throw new GraphQLError("One or more products not found.", { extensions: { code: "NOT_FOUND" } });
      }

      const po = await purchaseOrderService.create(ctx.prisma, {
        ...parsed.data,
        createdById: ctx.auth!.userId,
        expectedDate: parsed.data.expectedDate,
      });
      await audit(ctx, "CREATE", po.id, undefined, { poNumber: po.poNumber, status: po.status });
      return po;
    },

    approvePurchaseOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const po = await purchaseOrderService.approve(ctx.prisma, id);
        await audit(ctx, "UPDATE", id, { status: "SUBMITTED" }, { status: "APPROVED" });
        return po;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    cancelPurchaseOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const po = await purchaseOrderService.cancel(ctx.prisma, id);
        await audit(ctx, "UPDATE", id, undefined, { status: "CANCELLED" });
        return po;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    receivePurchaseOrder: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:orders");
      try {
        const po = await purchaseOrderService.receive(ctx.prisma, id, ctx.auth!.userId);
        await audit(ctx, "UPDATE", id, { status: "APPROVED" }, { status: "RECEIVED" });
        return po;
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },
  },
};
