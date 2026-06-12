import type { PrismaClient, SalesOrderStatus, Prisma } from "@prisma/client";
import { checkAndCreateAlerts } from "@/lib/services/alert.service";

// ─── Shared include ───────────────────────────────────────────────────────────

const soInclude = {
  warehouse: { select: { id: true, name: true, code: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.SalesOrderInclude;

// ─── Types ────────────────────────────────────────────────────────────────────

type SORecord = Prisma.SalesOrderGetPayload<{ include: typeof soInclude }>;

export interface SOItemInput {
  productId:   string;
  orderedQty:  number;
  unitPrice:   number;
  discountPct: number;
}

export interface CreateSOData {
  warehouseId:     string;
  createdById:     string;
  customerName:    string;
  customerEmail?:  string;
  customerPhone?:  string;
  shippingAddress?: string;
  requiredDate?:   string;
  notes?:          string;
  items:           SOItemInput[];
}

export interface SOsFilter {
  search?:     string;
  status?:     SalesOrderStatus;
  warehouseId?: string;
}

export interface PaginationArgs { page: number; limit: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeSO(so: SORecord) {
  return {
    ...so,
    subtotal:       so.subtotal.toString(),
    taxAmount:      so.taxAmount.toString(),
    discountAmount: so.discountAmount.toString(),
    totalAmount:    so.totalAmount.toString(),
    items: so.items.map((item) => ({
      ...item,
      unitPrice:   item.unitPrice.toString(),
      discountPct: item.discountPct.toString(),
      totalPrice:  item.totalPrice.toString(),
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

async function generateSONumber(prisma: PrismaClient): Promise<string> {
  const count = await prisma.salesOrder.count();
  return `SO-${String(count + 1).padStart(5, "0")}`;
}

function calcItemTotal(qty: number, unitPrice: number, discountPct: number): number {
  return qty * unitPrice * (1 - discountPct / 100);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const salesOrderService = {
  async findById(prisma: PrismaClient, id: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id }, include: soInclude });
    return so ? serializeSO(so) : null;
  },

  async findMany(prisma: PrismaClient, filter?: SOsFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.SalesOrderWhereInput = {
      ...(filter?.status      && { status:      filter.status      }),
      ...(filter?.warehouseId && { warehouseId: filter.warehouseId }),
      ...(filter?.search && {
        OR: [
          { soNumber:     { contains: filter.search, mode: "insensitive" } },
          { customerName: { contains: filter.search, mode: "insensitive" } },
          { customerEmail:{ contains: filter.search, mode: "insensitive" } },
          { warehouse: { name: { contains: filter.search, mode: "insensitive" } } },
        ],
      }),
    };

    const [records, totalCount] = await Promise.all([
      prisma.salesOrder.findMany({ where, skip, take: limit, include: soInclude, orderBy: { createdAt: "desc" } }),
      prisma.salesOrder.count({ where }),
    ]);

    return { nodes: records.map(serializeSO), pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async create(prisma: PrismaClient, data: CreateSOData) {
    const subtotal       = data.items.reduce((s, i) => s + calcItemTotal(i.orderedQty, i.unitPrice, i.discountPct), 0);
    const discountAmount = data.items.reduce((s, i) => s + i.orderedQty * i.unitPrice * (i.discountPct / 100), 0);
    const soNumber       = await generateSONumber(prisma);

    const so = await prisma.salesOrder.create({
      data: {
        soNumber,
        warehouseId:     data.warehouseId,
        createdById:     data.createdById,
        customerName:    data.customerName,
        customerEmail:   data.customerEmail   ?? null,
        customerPhone:   data.customerPhone   ?? null,
        shippingAddress: data.shippingAddress ?? null,
        status:          "CONFIRMED",
        requiredDate:    data.requiredDate ? new Date(data.requiredDate) : null,
        notes:           data.notes ?? null,
        subtotal,
        taxAmount:       0,
        discountAmount,
        totalAmount:     subtotal,
        items: {
          create: data.items.map((item) => ({
            productId:   item.productId,
            orderedQty:  item.orderedQty,
            shippedQty:  0,
            unitPrice:   item.unitPrice,
            discountPct: item.discountPct,
            totalPrice:  calcItemTotal(item.orderedQty, item.unitPrice, item.discountPct),
          })),
        },
      },
      include: soInclude,
    });

    return serializeSO(so);
  },

  async process(prisma: PrismaClient, id: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new Error("Sales order not found.");
    if (so.status !== "CONFIRMED") throw new Error(`Cannot process a SO with status "${so.status}".`);

    const updated = await prisma.salesOrder.update({
      where: { id },
      data:  { status: "PROCESSING" },
      include: soInclude,
    });
    return serializeSO(updated);
  },

  // Ship: deduct inventory stock, create transactions, mark SHIPPED
  async ship(prisma: PrismaClient, id: string, performedById: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id }, include: soInclude });
    if (!so) throw new Error("Sales order not found.");
    if (so.status !== "PROCESSING") throw new Error(`Cannot ship a SO with status "${so.status}". It must be in processing first.`);

    const updated = await prisma.$transaction(async (tx) => {
      // Deduct inventory & create transaction records
      await Promise.all(
        so.items.map(async (item) => {
          const stock = await tx.inventoryStock.findFirst({
            where: { productId: item.productId, warehouseId: so.warehouseId },
          });

          const available = (stock?.quantity ?? 0) - (stock?.reservedQty ?? 0);
          if (available < item.orderedQty) {
            throw new Error(`Insufficient stock for product "${item.product.name}". Available: ${available}, required: ${item.orderedQty}.`);
          }

          const quantityBefore = stock!.quantity;
          const quantityAfter  = quantityBefore - item.orderedQty;

          await tx.inventoryStock.update({
            where: { id: stock!.id },
            data:  { quantity: quantityAfter },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId:        item.productId,
              sourceWarehouseId: so.warehouseId,
              salesOrderId:     so.id,
              performedById,
              type:             "SALES_ISSUE",
              quantity:         item.orderedQty,
              quantityBefore,
              quantityAfter,
              unitCost:         item.unitPrice,
              reference:        so.soNumber,
            },
          });

          await tx.salesOrderItem.update({
            where: { id: item.id },
            data:  { shippedQty: item.orderedQty },
          });
        })
      );

      return tx.salesOrder.update({
        where: { id },
        data:  { status: "SHIPPED", shippedDate: new Date() },
        include: soInclude,
      });
    });

    // Check alerts after stock deduction (outside transaction)
    await checkAndCreateAlerts(
      prisma,
      so.items.map((item) => ({ productId: item.productId, warehouseId: so.warehouseId }))
    );

    return serializeSO(updated);
  },

  async deliver(prisma: PrismaClient, id: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new Error("Sales order not found.");
    if (so.status !== "SHIPPED") throw new Error(`Cannot deliver a SO with status "${so.status}". It must be shipped first.`);

    const updated = await prisma.salesOrder.update({
      where: { id },
      data:  { status: "DELIVERED", deliveredDate: new Date() },
      include: soInclude,
    });
    return serializeSO(updated);
  },

  async cancel(prisma: PrismaClient, id: string, performedById: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id }, include: soInclude });
    if (!so) throw new Error("Sales order not found.");
    if (so.status === "DELIVERED" || so.status === "CANCELLED") {
      throw new Error(`Cannot cancel a SO with status "${so.status}".`);
    }

    // If already shipped, restore inventory
    const updated = await prisma.$transaction(async (tx) => {
      if (so.status === "SHIPPED") {
        await Promise.all(
          so.items.map(async (item) => {
            if (item.shippedQty === 0) return;

            const stock = await tx.inventoryStock.findFirst({
              where: { productId: item.productId, warehouseId: so.warehouseId },
            });

            const quantityBefore = stock?.quantity ?? 0;
            const quantityAfter  = quantityBefore + item.shippedQty;

            if (stock) {
              await tx.inventoryStock.update({
                where: { id: stock.id },
                data:  { quantity: quantityAfter },
              });
            } else {
              await tx.inventoryStock.create({
                data: { productId: item.productId, warehouseId: so.warehouseId, zoneId: null, quantity: item.shippedQty },
              });
            }

            await tx.inventoryTransaction.create({
              data: {
                productId:       item.productId,
                destWarehouseId: so.warehouseId,
                salesOrderId:    so.id,
                performedById,
                type:            "RETURN_IN",
                quantity:        item.shippedQty,
                quantityBefore,
                quantityAfter,
                reference:       so.soNumber,
                notes:           "Cancelled order — stock restored",
              },
            });
          })
        );
      }

      return tx.salesOrder.update({
        where: { id },
        data:  { status: "CANCELLED" },
        include: soInclude,
      });
    });

    // Re-check alerts after any stock restoration (outside transaction)
    await checkAndCreateAlerts(
      prisma,
      so.items.map((item) => ({ productId: item.productId, warehouseId: so.warehouseId }))
    );

    return serializeSO(updated);
  },
};
