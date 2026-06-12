import type { GraphQLContext } from "@/types/auth";
import type { TransactionType } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { inventoryService } from "@/lib/services/inventory.service";

interface TxnArgs {
  filter?: {
    productId?:   string;
    warehouseId?: string;
    type?:        TransactionType;
    dateFrom?:    string;
    dateTo?:      string;
    search?:      string;
  };
  pagination?: { page: number; limit: number };
}

interface StockArgs {
  filter?: {
    search?:      string;
    warehouseId?: string;
    lowStock?:    boolean;
    outOfStock?:  boolean;
  };
  pagination?: { page: number; limit: number };
}

export const inventoryResolvers = {
  Query: {
    inventoryOverview: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:inventory");
      return inventoryService.getOverview(ctx.prisma);
    },

    inventoryTransactions: (_: unknown, args: TxnArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:inventory");
      return inventoryService.findTransactions(ctx.prisma, args.filter, args.pagination);
    },

    productStockOverview: (_: unknown, args: StockArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:inventory");
      return inventoryService.getProductStockOverview(ctx.prisma, args.filter, args.pagination);
    },
  },
};
