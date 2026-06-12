import type { PrismaClient, TransactionType, Prisma } from "@prisma/client";

// ─── Shared include ───────────────────────────────────────────────────────────

const txnInclude = {
  product:         { select: { id: true, sku: true, name: true } },
  sourceWarehouse: { select: { id: true, name: true, code: true } },
  destWarehouse:   { select: { id: true, name: true, code: true } },
  performedBy:     { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.InventoryTransactionInclude;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TxnFilter {
  productId?:   string;
  warehouseId?: string;
  type?:        TransactionType;
  dateFrom?:    string;
  dateTo?:      string;
  search?:      string;
}

export interface StockFilter {
  search?:      string;
  warehouseId?: string;
  lowStock?:    boolean;
  outOfStock?:  boolean;
}

export interface PaginationArgs { page: number; limit: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPageInfo(totalCount: number, page: number, limit: number) {
  return {
    totalCount,
    totalPages:      Math.ceil(totalCount / limit),
    currentPage:     page,
    hasNextPage:     page * limit < totalCount,
    hasPreviousPage: page > 1,
  };
}

type TxnRecord = Prisma.InventoryTransactionGetPayload<{ include: typeof txnInclude }>;

function serializeTxn(t: TxnRecord) {
  return {
    ...t,
    unitCost: t.unitCost?.toString() ?? null,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const inventoryService = {

  // ── Global overview stats ─────────────────────────────────────────────────

  async getOverview(prisma: PrismaClient) {
    const [stocks, activeWarehouses] = await Promise.all([
      prisma.inventoryStock.findMany({
        select: {
          quantity:    true,
          reservedQty: true,
          product: { select: { reorderPoint: true } },
        },
      }),
      prisma.warehouse.count({ where: { status: "ACTIVE" } }),
    ]);

    const totalUnits      = stocks.reduce((s, r) => s + r.quantity, 0);
    const lowStockCount   = stocks.filter(
      (r) => r.quantity > 0 && r.quantity <= r.product.reorderPoint
    ).length;
    const outOfStockCount = stocks.filter((r) => r.quantity === 0).length;

    // Last-24h totals
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [incoming, outgoing, totalProducts] = await Promise.all([
      prisma.inventoryTransaction.aggregate({
        where: {
          type:      { in: ["PURCHASE_RECEIPT", "TRANSFER_IN", "ADJUSTMENT_IN", "RETURN_IN"] },
          createdAt: { gte: since },
        },
        _sum: { quantity: true },
      }),
      prisma.inventoryTransaction.aggregate({
        where: {
          type:      { in: ["SALES_ISSUE", "TRANSFER_OUT", "ADJUSTMENT_OUT", "RETURN_OUT", "DAMAGE_WRITE_OFF"] },
          createdAt: { gte: since },
        },
        _sum: { quantity: true },
      }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      totalProducts,
      totalUnits,
      totalWarehouses:  activeWarehouses,
      lowStockCount,
      outOfStockCount,
      incomingUnits:    incoming._sum.quantity ?? 0,
      outgoingUnits:    outgoing._sum.quantity ?? 0,
    };
  },

  // ── Transaction history ───────────────────────────────────────────────────

  async findTransactions(prisma: PrismaClient, filter?: TxnFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip  = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
      ...(filter?.type        && { type:      filter.type      }),
      ...(filter?.productId   && { productId: filter.productId }),
      ...(filter?.warehouseId && {
        OR: [
          { sourceWarehouseId: filter.warehouseId },
          { destWarehouseId:   filter.warehouseId },
        ],
      }),
      ...((filter?.dateFrom || filter?.dateTo) && {
        createdAt: {
          ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
          ...(filter.dateTo   && { lte: new Date(filter.dateTo)   }),
        },
      }),
      ...(filter?.search && {
        OR: [
          { product:   { name: { contains: filter.search, mode: "insensitive" } } },
          { product:   { sku:  { contains: filter.search, mode: "insensitive" } } },
          { reference: { contains: filter.search, mode: "insensitive" } },
        ],
      }),
    };

    const [records, totalCount] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip,
        take:    limit,
        include: txnInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { nodes: records.map(serializeTxn), pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  // ── Product stock overview across all warehouses ──────────────────────────

  async getProductStockOverview(prisma: PrismaClient, filter?: StockFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const productWhere: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      ...(filter?.search && {
        OR: [
          { name: { contains: filter.search, mode: "insensitive" } },
          { sku:  { contains: filter.search, mode: "insensitive" } },
        ],
      }),
    };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where:   productWhere,
        skip,
        take:    limit,
        orderBy: { name: "asc" },
        select: {
          id: true, sku: true, name: true,
          unitOfMeasure: true, reorderPoint: true, status: true,
          inventoryStock: {
            select: {
              quantity:    true,
              reservedQty: true,
              warehouse: { select: { id: true, name: true, code: true } },
            },
            ...(filter?.warehouseId && { where: { warehouseId: filter.warehouseId } }),
          },
        },
      }),
      prisma.product.count({ where: productWhere }),
    ]);

    let nodes = products.map((p) => {
      const totalQuantity  = p.inventoryStock.reduce((s, r) => s + r.quantity,    0);
      const totalReserved  = p.inventoryStock.reduce((s, r) => s + r.reservedQty, 0);
      const totalAvailable = totalQuantity - totalReserved;

      return {
        productId:      p.id,
        sku:            p.sku,
        name:           p.name,
        unitOfMeasure:  p.unitOfMeasure,
        reorderPoint:   p.reorderPoint,
        status:         p.status,
        totalQuantity,
        totalReserved,
        totalAvailable,
        stockByWarehouse: p.inventoryStock.map((s) => ({
          warehouseId:   s.warehouse.id,
          warehouseName: s.warehouse.name,
          warehouseCode: s.warehouse.code,
          quantity:      s.quantity,
          reservedQty:   s.reservedQty,
          availableQty:  s.quantity - s.reservedQty,
        })),
      };
    });

    // Post-filter stock levels
    if (filter?.outOfStock) nodes = nodes.filter((n) => n.totalQuantity === 0);
    else if (filter?.lowStock) nodes = nodes.filter(
      (n) => n.totalQuantity > 0 && n.totalQuantity <= n.reorderPoint
    );

    return { nodes, pageInfo: buildPageInfo(totalCount, page, limit) };
  },
};
