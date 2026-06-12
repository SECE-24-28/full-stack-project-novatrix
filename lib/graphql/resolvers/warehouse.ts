import { GraphQLError } from "graphql";
import type { WarehouseStatus } from "@prisma/client";
import {
  createWarehouseSchema, updateWarehouseSchema,
  createZoneSchema, updateZoneSchema,
  assignStockSchema, adjustStockSchema,
} from "@/lib/validators/warehouse";
import { warehouseService, zoneService, stockService } from "@/lib/services/warehouse.service";
import { requirePermission } from "@/lib/auth/guards";
import type { GraphQLContext } from "@/types/auth";
import { checkAndCreateAlerts } from "@/lib/services/alert.service";

// ─── Input interfaces ─────────────────────────────────────────────────────────

interface CreateWarehouseInput {
  name: string; code: string; address?: string; city?: string; country?: string;
  phone?: string; email?: string; managerId?: string; capacity?: number; status?: WarehouseStatus;
}

interface UpdateWarehouseInput {
  id: string; name?: string; code?: string; address?: string; city?: string; country?: string;
  phone?: string; email?: string; managerId?: string; capacity?: number; status?: WarehouseStatus;
}

interface CreateZoneInput   { warehouseId: string; name: string; code: string; description?: string; }
interface UpdateZoneInput   { id: string; name?: string; code?: string; description?: string; }
interface AssignStockInput  { productId: string; warehouseId: string; zoneId?: string; quantity: number; }
interface AdjustStockInput  { stockId: string; quantity: number; notes?: string; }

interface WarehousesArgs {
  filter?:     { search?: string; status?: WarehouseStatus; city?: string; country?: string };
  pagination?: { page: number; limit: number };
}
interface WarehouseStockArgs {
  warehouseId: string;
  filter?:     { search?: string; zoneId?: string; lowStock?: boolean };
  pagination?: { page: number; limit: number };
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

async function audit(
  ctx: GraphQLContext,
  action: "CREATE" | "UPDATE" | "DELETE",
  resource: string,
  resourceId: string,
  oldValues?: Record<string, unknown>,
  newValues?:  Record<string, unknown>
) {
  await ctx.prisma.auditLog.create({
    data: {
      userId:     ctx.auth?.userId ?? null,
      action,
      resource,
      resourceId,
      oldValues:  oldValues ? (oldValues as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      newValues:  newValues ? (newValues as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      ipAddress:  ctx.ipAddress,
      userAgent:  ctx.userAgent,
    },
  });
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const warehouseResolvers = {
  WarehouseZone: {
    stockCount: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) =>
      ctx.prisma.inventoryStock.count({ where: { zoneId: parent.id } }),
  },

  Query: {
    warehouse: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:warehouses");
      const wh = await warehouseService.findById(ctx.prisma, id);
      if (!wh) throw new GraphQLError("Warehouse not found.", { extensions: { code: "NOT_FOUND" } });
      return wh;
    },

    warehouseByCode: async (_: unknown, { code }: { code: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:warehouses");
      const wh = await warehouseService.findByCode(ctx.prisma, code);
      if (!wh) throw new GraphQLError("Warehouse not found.", { extensions: { code: "NOT_FOUND" } });
      return wh;
    },

    warehouses: async (_: unknown, args: WarehousesArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:warehouses");
      return warehouseService.findMany(ctx.prisma, args.filter, args.pagination);
    },

    warehouseZone: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:warehouses");
      const zone = await zoneService.findById(ctx.prisma, id);
      if (!zone) throw new GraphQLError("Zone not found.", { extensions: { code: "NOT_FOUND" } });
      return zone;
    },

    warehouseZones: async (_: unknown, { warehouseId }: { warehouseId: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:warehouses");
      return zoneService.findByWarehouse(ctx.prisma, warehouseId);
    },

    warehouseStock: async (_: unknown, args: WarehouseStockArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:inventory");
      return stockService.findByWarehouse(ctx.prisma, args.warehouseId, args.filter, args.pagination);
    },
  },

  Mutation: {
    // ── createWarehouse ────────────────────────────────────────────────────
    createWarehouse: async (_: unknown, { input }: { input: CreateWarehouseInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:warehouses");

      const parsed = createWarehouseSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const existing = await ctx.prisma.warehouse.findUnique({ where: { code: input.code.toUpperCase() } });
      if (existing) {
        throw new GraphQLError(`Warehouse code "${input.code.toUpperCase()}" is already in use.`, {
          extensions: { code: "CONFLICT" },
        });
      }

      const wh = await warehouseService.create(ctx.prisma, parsed.data);
      await audit(ctx, "CREATE", "Warehouse", wh.id, undefined, { name: wh.name, code: wh.code });
      return wh;
    },

    // ── updateWarehouse ────────────────────────────────────────────────────
    updateWarehouse: async (_: unknown, { input }: { input: UpdateWarehouseInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:warehouses");

      const parsed = updateWarehouseSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT", fields: parsed.error.flatten().fieldErrors },
        });
      }

      const before = await ctx.prisma.warehouse.findUnique({ where: { id: input.id } });
      if (!before) throw new GraphQLError("Warehouse not found.", { extensions: { code: "NOT_FOUND" } });

      if (input.code && input.code.toUpperCase() !== before.code) {
        const conflict = await ctx.prisma.warehouse.findUnique({ where: { code: input.code.toUpperCase() } });
        if (conflict) {
          throw new GraphQLError(`Warehouse code "${input.code.toUpperCase()}" is already in use.`, {
            extensions: { code: "CONFLICT" },
          });
        }
      }

      const { id, ...rest } = parsed.data;
      const wh = await warehouseService.update(ctx.prisma, id, rest);
      await audit(ctx, "UPDATE", "Warehouse", id,
        { name: before.name, code: before.code, status: before.status },
        { name: wh.name,     code: wh.code,     status: wh.status     }
      );
      return wh;
    },

    // ── deleteWarehouse ────────────────────────────────────────────────────
    deleteWarehouse: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "delete:warehouses");

      const wh = await ctx.prisma.warehouse.findUnique({ where: { id } });
      if (!wh) throw new GraphQLError("Warehouse not found.", { extensions: { code: "NOT_FOUND" } });

      try {
        await warehouseService.delete(ctx.prisma, id);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }

      await audit(ctx, "DELETE", "Warehouse", id, { name: wh.name, code: wh.code });
      return true;
    },

    // ── createZone ─────────────────────────────────────────────────────────
    createZone: async (_: unknown, { input }: { input: CreateZoneInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:warehouses");

      const parsed = createZoneSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const conflict = await ctx.prisma.warehouseZone.findUnique({
        where: { warehouseId_code: { warehouseId: input.warehouseId, code: input.code.toUpperCase() } },
      });
      if (conflict) {
        throw new GraphQLError(`Zone code "${input.code.toUpperCase()}" already exists in this warehouse.`, {
          extensions: { code: "CONFLICT" },
        });
      }

      const zone = await zoneService.create(ctx.prisma, parsed.data);
      await audit(ctx, "CREATE", "WarehouseZone", zone.id, undefined, { warehouseId: input.warehouseId, code: zone.code });
      return zone;
    },

    // ── updateZone ─────────────────────────────────────────────────────────
    updateZone: async (_: unknown, { input }: { input: UpdateZoneInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:warehouses");

      const parsed = updateZoneSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const { id, ...rest } = parsed.data;
      const zone = await zoneService.update(ctx.prisma, id, rest);
      await audit(ctx, "UPDATE", "WarehouseZone", id, undefined, { code: zone.code, name: zone.name });
      return zone;
    },

    // ── deleteZone ─────────────────────────────────────────────────────────
    deleteZone: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:warehouses");
      try {
        await zoneService.delete(ctx.prisma, id);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
      await audit(ctx, "DELETE", "WarehouseZone", id);
      return true;
    },

    // ── assignStock ────────────────────────────────────────────────────────
    assignStock: async (_: unknown, { input }: { input: AssignStockInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "create:inventory");

      const parsed = assignStockSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const product = await ctx.prisma.product.findUnique({ where: { id: input.productId } });
      if (!product) throw new GraphQLError("Product not found.", { extensions: { code: "NOT_FOUND" } });

      const stockItem = await stockService.upsert(ctx.prisma, parsed.data);

      await ctx.prisma.inventoryTransaction.create({
        data: {
          productId:       input.productId,
          destWarehouseId: input.warehouseId,
          performedById:   ctx.auth!.userId,
          type:            "ADJUSTMENT_IN",
          quantity:        input.quantity,
          quantityBefore:  0,
          quantityAfter:   input.quantity,
          notes:           "Stock assignment via warehouse management",
        },
      });

      await audit(ctx, "CREATE", "InventoryStock", stockItem.id, undefined, {
        productId: input.productId, warehouseId: input.warehouseId, quantity: input.quantity,
      });

      await checkAndCreateAlerts(ctx.prisma, [{ productId: input.productId, warehouseId: input.warehouseId }]);

      return stockItem;
    },

    // ── adjustStock ────────────────────────────────────────────────────────
    adjustStock: async (_: unknown, { input }: { input: AdjustStockInput }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:inventory");

      const parsed = adjustStockSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError(parsed.error.issues[0]?.message ?? "Validation error.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existing = await ctx.prisma.inventoryStock.findUnique({ where: { id: input.stockId } });
      if (!existing) throw new GraphQLError("Stock record not found.", { extensions: { code: "NOT_FOUND" } });

      const delta    = input.quantity - existing.quantity;
      const txnType  = delta >= 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
      const stockItem = await stockService.adjust(ctx.prisma, input.stockId, input.quantity);

      await ctx.prisma.inventoryTransaction.create({
        data: {
          productId:         existing.productId,
          sourceWarehouseId: existing.warehouseId,
          performedById:     ctx.auth!.userId,
          type:              txnType,
          quantity:          Math.abs(delta),
          quantityBefore:    existing.quantity,
          quantityAfter:     input.quantity,
          notes:             input.notes ?? null,
        },
      });

      await audit(ctx, "UPDATE", "InventoryStock", input.stockId,
        { quantity: existing.quantity },
        { quantity: input.quantity }
      );

      await checkAndCreateAlerts(ctx.prisma, [{ productId: existing.productId, warehouseId: existing.warehouseId }]);

      return stockItem;
    },

    // ── removeStock ────────────────────────────────────────────────────────
    removeStock: async (_: unknown, { stockId }: { stockId: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "delete:inventory");
      try {
        await stockService.remove(ctx.prisma, stockId);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
      await audit(ctx, "DELETE", "InventoryStock", stockId);
      return true;
    },
  },
};
