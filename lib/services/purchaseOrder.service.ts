import type { PrismaClient, PurchaseOrderStatus, Prisma } from "@prisma/client";
import { checkAndCreateAlerts } from "@/lib/services/alert.service";

// ─── Shared include ───────────────────────────────────────────────────────────

const poInclude = {
  supplier:  { select: { id: true, name: true, code: true } },
  warehouse: { select: { id: true, name: true, code: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.PurchaseOrderInclude;

// ─── Types ────────────────────────────────────────────────────────────────────

type PORecord = Prisma.PurchaseOrderGetPayload<{ include: typeof poInclude }>;

export interface POItemInput {
  productId:  string;
  orderedQty: number;
  unitCost:   number;
}

export interface CreatePOData {
  supplierId:    string;
  warehouseId:   string;
  createdById:   string;
  expectedDate?: string;
  notes?:        string;
  items:         POItemInput[];
}

export interface POsFilter {
  search?:     string;
  status?:     PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
}

export interface PaginationArgs { page: number; limit: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializePO(po: PORecord) {
  return {
    ...po,
    subtotal:    po.subtotal.toString(),
    taxAmount:   po.taxAmount.toString(),
    totalAmount: po.totalAmount.toString(),
    items: po.items.map((item) => ({
      ...item,
      unitCost:  item.unitCost.toString(),
      totalCost: item.totalCost.toString(),
    })),
  };
}

function buildPageInfo(totalCount: number, page: number, limit: number) {
  return {
    totalCount,
    totalPages:      Math.ceil(totalCount / limit),
    currentPage:     page,
    hasNextPage:     page * limit < totalCount,
    hasPreviousPage: page > 1,
  };
}

async function generatePONumber(prisma: PrismaClient): Promise<string> {
  const count = await prisma.purchaseOrder.count();
  return `PO-${String(count + 1).padStart(5, "0")}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const purchaseOrderService = {
  async findById(prisma: PrismaClient, id: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: poInclude });
    return po ? serializePO(po) : null;
  },

  async findMany(prisma: PrismaClient, filter?: POsFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      ...(filter?.status      && { status:      filter.status      }),
      ...(filter?.supplierId  && { supplierId:  filter.supplierId  }),
      ...(filter?.warehouseId && { warehouseId: filter.warehouseId }),
      ...(filter?.search && {
        OR: [
          { poNumber:          { contains: filter.search, mode: "insensitive" } },
          { supplier:  { name: { contains: filter.search, mode: "insensitive" } } },
          { warehouse: { name: { contains: filter.search, mode: "insensitive" } } },
        ],
      }),
    };

    const [records, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, skip, take: limit, include: poInclude, orderBy: { createdAt: "desc" } }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { nodes: records.map(serializePO), pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async create(prisma: PrismaClient, data: CreatePOData) {
    const subtotal = data.items.reduce((sum, i) => sum + i.orderedQty * i.unitCost, 0);
    const poNumber = await generatePONumber(prisma);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId:   data.supplierId,
        warehouseId:  data.warehouseId,
        createdById:  data.createdById,
        status:       "SUBMITTED",
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes:        data.notes ?? null,
        subtotal,
        taxAmount:    0,
        totalAmount:  subtotal,
        items: {
          create: data.items.map((item) => ({
            productId:  item.productId,
            orderedQty: item.orderedQty,
            receivedQty: 0,
            unitCost:   item.unitCost,
            totalCost:  item.orderedQty * item.unitCost,
          })),
        },
      },
      include: poInclude,
    });

    return serializePO(po);
  },

  async approve(prisma: PrismaClient, id: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error("Purchase order not found.");
    if (po.status !== "SUBMITTED") throw new Error(`Cannot approve a PO with status "${po.status}".`);

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data:  { status: "APPROVED" },
      include: poInclude,
    });
    return serializePO(updated);
  },

  async cancel(prisma: PrismaClient, id: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error("Purchase order not found.");
    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      throw new Error(`Cannot cancel a PO with status "${po.status}".`);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data:  { status: "CANCELLED" },
      include: poInclude,
    });
    return serializePO(updated);
  },

  // Receive: mark as RECEIVED, set receivedQty = orderedQty, upsert inventory stock, log transactions
  async receive(prisma: PrismaClient, id: string, performedById: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: poInclude });
    if (!po) throw new Error("Purchase order not found.");
    if (po.status !== "APPROVED") throw new Error(`Cannot receive a PO with status "${po.status}". It must be approved first.`);

    const updated = await prisma.$transaction(async (tx) => {
      // Update each item's receivedQty
      await Promise.all(
        po.items.map((item) =>
          tx.purchaseOrderItem.update({
            where: { id: item.id },
            data:  { receivedQty: item.orderedQty },
          })
        )
      );

      // Upsert inventory stock & create inventory transactions for each item
      await Promise.all(
        po.items.map(async (item) => {
          const existing = await tx.inventoryStock.findFirst({
            where: { productId: item.productId, warehouseId: po.warehouseId, zoneId: null },
          });

          const quantityBefore = existing?.quantity ?? 0;
          const quantityAfter  = quantityBefore + item.orderedQty;

          if (existing) {
            await tx.inventoryStock.update({
              where: { id: existing.id },
              data:  { quantity: quantityAfter },
            });
          } else {
            await tx.inventoryStock.create({
              data: {
                productId:   item.productId,
                warehouseId: po.warehouseId,
                zoneId:      null,
                quantity:    item.orderedQty,
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              productId:       item.productId,
              destWarehouseId: po.warehouseId,
              purchaseOrderId: po.id,
              performedById,
              type:            "PURCHASE_RECEIPT",
              quantity:        item.orderedQty,
              quantityBefore,
              quantityAfter,
              unitCost:        item.unitCost,
              reference:       po.poNumber,
            },
          });
        })
      );

      // Mark PO as received
      return tx.purchaseOrder.update({
        where: { id },
        data:  { status: "RECEIVED", receivedDate: new Date() },
        include: poInclude,
      });
    });

    // Check alerts after stock increase (outside transaction)
    await checkAndCreateAlerts(
      prisma,
      po.items.map((item) => ({ productId: item.productId, warehouseId: po.warehouseId }))
    );

    return serializePO(updated);
  },
};
