import type { PrismaClient, AlertType, AlertStatus, Prisma } from "@prisma/client";

// ─── Shared include ───────────────────────────────────────────────────────────

const alertInclude = {
  product: { select: { id: true, sku: true, name: true, reorderPoint: true } },
} satisfies Prisma.StockAlertInclude;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertsFilter {
  type?:        AlertType;
  status?:      AlertStatus;
  warehouseId?: string;
  search?:      string;
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

// ─── Core alert check ─────────────────────────────────────────────────────────
//
// Called after every stock mutation (PO receive, SO ship, SO cancel, adjustStock).
// For each affected (productId, warehouseId) pair:
//   1. Compute total quantity across all stock rows for that product+warehouse.
//   2. Determine alert type: OUT_OF_STOCK (qty === 0) or LOW_STOCK (0 < qty <= reorderPoint).
//   3. If a condition is met and no OPEN alert of that type exists → create one.
//   4. If a condition is no longer met and an OPEN alert exists → auto-resolve it.

export async function checkAndCreateAlerts(
  prisma: PrismaClient,
  items: Array<{ productId: string; warehouseId: string }>
): Promise<void> {
  await Promise.all(
    items.map(async ({ productId, warehouseId }) => {
      const [product, stocks] = await Promise.all([
        prisma.product.findUnique({
          where:  { id: productId },
          select: { reorderPoint: true, name: true, sku: true },
        }),
        prisma.inventoryStock.findMany({
          where:  { productId, warehouseId },
          select: { quantity: true },
        }),
      ]);

      if (!product) return;

      const totalQty     = stocks.reduce((s, r) => s + r.quantity, 0);
      const isOutOfStock = totalQty === 0;
      const isLowStock   = totalQty > 0 && totalQty <= product.reorderPoint;

      // ── Handle OUT_OF_STOCK ────────────────────────────────────────────────
      await upsertAlert(prisma, {
        productId,
        warehouseId,
        type:            "OUT_OF_STOCK",
        triggered:       isOutOfStock,
        currentQuantity: totalQty,
        threshold:       0,
        message:         `${product.name} (${product.sku}) is out of stock in warehouse.`,
      });

      // ── Handle LOW_STOCK ──────────────────────────────────────────────────
      await upsertAlert(prisma, {
        productId,
        warehouseId,
        type:            "LOW_STOCK",
        triggered:       isLowStock,
        currentQuantity: totalQty,
        threshold:       product.reorderPoint,
        message:         `${product.name} (${product.sku}) is low on stock (${totalQty} remaining, reorder at ${product.reorderPoint}).`,
      });
    })
  );
}

async function upsertAlert(
  prisma: PrismaClient,
  opts: {
    productId:       string;
    warehouseId:     string;
    type:            AlertType;
    triggered:       boolean;
    currentQuantity: number;
    threshold:       number;
    message:         string;
  }
) {
  const existing = await prisma.stockAlert.findFirst({
    where: {
      productId:   opts.productId,
      warehouseId: opts.warehouseId,
      type:        opts.type,
      status:      { in: ["OPEN", "ACKNOWLEDGED"] },
    },
  });

  if (opts.triggered && !existing) {
    // Open a new alert
    await prisma.stockAlert.create({
      data: {
        productId:       opts.productId,
        warehouseId:     opts.warehouseId,
        type:            opts.type,
        status:          "OPEN",
        currentQuantity: opts.currentQuantity,
        threshold:       opts.threshold,
        message:         opts.message,
      },
    });
  } else if (!opts.triggered && existing) {
    // Auto-resolve when condition clears
    await prisma.stockAlert.update({
      where: { id: existing.id },
      data:  { status: "RESOLVED", resolvedAt: new Date(), currentQuantity: opts.currentQuantity },
    });
  } else if (opts.triggered && existing) {
    // Keep quantity current
    await prisma.stockAlert.update({
      where: { id: existing.id },
      data:  { currentQuantity: opts.currentQuantity },
    });
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const alertService = {

  async countOpen(prisma: PrismaClient): Promise<number> {
    return prisma.stockAlert.count({ where: { status: "OPEN" } });
  },

  async findMany(prisma: PrismaClient, filter?: AlertsFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.StockAlertWhereInput = {
      ...(filter?.type        && { type:        filter.type   }),
      ...(filter?.status      && { status:      filter.status }),
      ...(filter?.warehouseId && { warehouseId: filter.warehouseId }),
      ...(filter?.search && {
        product: {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { sku:  { contains: filter.search, mode: "insensitive" } },
          ],
        },
      }),
    };

    const [records, totalCount] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        skip,
        take:    limit,
        include: alertInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      prisma.stockAlert.count({ where }),
    ]);

    return { nodes: records, pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async acknowledge(prisma: PrismaClient, id: string, userId: string) {
    const alert = await prisma.stockAlert.findUnique({ where: { id } });
    if (!alert) throw new Error("Alert not found.");
    if (alert.status !== "OPEN") throw new Error(`Alert is already ${alert.status.toLowerCase()}.`);

    return prisma.stockAlert.update({
      where: { id },
      data:  { status: "ACKNOWLEDGED", acknowledgedById: userId, acknowledgedAt: new Date() },
      include: alertInclude,
    });
  },

  async resolve(prisma: PrismaClient, id: string) {
    const alert = await prisma.stockAlert.findUnique({ where: { id } });
    if (!alert) throw new Error("Alert not found.");
    if (alert.status === "RESOLVED") throw new Error("Alert is already resolved.");

    return prisma.stockAlert.update({
      where: { id },
      data:  { status: "RESOLVED", resolvedAt: new Date() },
      include: alertInclude,
    });
  },

  async bulkResolve(prisma: PrismaClient, ids: string[]) {
    const { count } = await prisma.stockAlert.updateMany({
      where: { id: { in: ids }, status: { not: "RESOLVED" } },
      data:  { status: "RESOLVED", resolvedAt: new Date() },
    });
    return count;
  },
};
