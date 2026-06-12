import { requirePermission }  from "@/lib/auth/guards";
import { reportService }      from "@/lib/services/report.service";
import type { GraphQLContext } from "@/types/auth";

interface ReportFilterArgs {
  filter?: {
    search?:      string | null;
    dateFrom?:    Date   | null;
    dateTo?:      Date   | null;
    status?:      string | null;
    warehouseId?: string | null;
    supplierId?:  string | null;
    categoryId?:  string | null;
  };
}

export const reportResolvers = {
  Query: {
    inventoryReport: (_: unknown, { filter }: ReportFilterArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:reports");
      return reportService.getInventoryReport(ctx.prisma, filter ?? {});
    },
    salesReport: (_: unknown, { filter }: ReportFilterArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:reports");
      return reportService.getSalesReport(ctx.prisma, filter ?? {});
    },
    supplierReport: (_: unknown, { filter }: ReportFilterArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:reports");
      return reportService.getSupplierReport(ctx.prisma, filter ?? {});
    },
    warehouseReport: (_: unknown, { filter }: ReportFilterArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:reports");
      return reportService.getWarehouseReport(ctx.prisma, filter ?? {});
    },
  },
};
