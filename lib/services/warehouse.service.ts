import type { PrismaClient, WarehouseStatus, Prisma } from "@prisma/client";

// ─── Shared includes ──────────────────────────────────────────────────────────

const warehouseInclude = {
  zones: {
    select: { id: true, name: true, code: true, description: true, createdAt: true, updatedAt: true, warehouseId: true },
    orderBy: { code: "asc" as const },
  },
  _count: { select: { inventoryStock: true } },
} satisfies Prisma.WarehouseInclude;

const stockInclude = {
  product: {
    include: {
      category: { select: { id: true, name: true } },
    },
    select: {
      id: true, sku: true, name: true,
      unitOfMeasure: true, reorderPoint: true, status: true,
      category: true,
    },
  },
  zone: { select: { id: true, name: true, code: true } },
} satisfies Prisma.InventoryStockInclude;

// ─── Types ────────────────────────────────────────────────────────────────────

type WarehouseRecord = Prisma.WarehouseGetPayload<{ include: typeof warehouseInclude }>;
type StockRecord     = Prisma.InventoryStockGetPayload<{ include: typeof stockInclude }>;

export interface WarehouseUpdateData {
  name?:      string;
  code?:      string;
  address?:   string;
  city?:      string;
  country?:   string;
  phone?:     string;
  email?:     string;
  managerId?: string;
  capacity?:  number;
  status?:    WarehouseStatus;
}

export interface WarehousesFilter {
  search?:  string;
  status?:  WarehouseStatus;
  city?:    string;
  country?: string;
}

export interface StockFilter {
  search?:   string;
  zoneId?:   string;
  lowStock?: boolean;
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

async function computeWarehouseStats(prisma: PrismaClient, warehouseId: string, capacity: number | null) {
  const stocks = await prisma.inventoryStock.findMany({
    where:  { warehouseId },
    select: { quantity: true, product: { select: { reorderPoint: true } } },
  });

  const usedCapacity  = stocks.reduce((s, r) => s + r.quantity, 0);
  const lowStockCount = stocks.filter(
    (r) => r.quantity > 0 && r.quantity <= r.product.reorderPoint
  ).length;

  const [zoneCount, totalProducts] = await Promise.all([
    prisma.warehouseZone.count({ where: { warehouseId } }),
    prisma.inventoryStock.count({ where: { warehouseId, quantity: { gt: 0 } } }),
  ]);

  return {
    capacityStats: {
      totalCapacity:     capacity,
      usedCapacity,
      availableCapacity: capacity != null ? capacity - usedCapacity : null,
      utilisationPct:    capacity ? Math.round((usedCapacity / capacity) * 100 * 10) / 10 : null,
    },
    summary: {
      totalProducts,
      totalUnits:    usedCapacity,
      lowStockCount,
      zoneCount,
    },
  };
}

function serializeWarehouse(w: WarehouseRecord) {
  return {
    ...w,
    zones: w.zones.map((z) => ({ ...z, stockCount: 0 })), // stockCount resolved lazily
  };
}

function serializeStock(s: StockRecord) {
  return {
    ...s,
    availableQty: s.quantity - s.reservedQty,
  };
}

// ─── Warehouse service ────────────────────────────────────────────────────────

export const warehouseService = {
  async findById(prisma: PrismaClient, id: string) {
    const w = await prisma.warehouse.findUnique({ where: { id }, include: warehouseInclude });
    if (!w) return null;
    const stats = await computeWarehouseStats(prisma, id, w.capacity);
    return { ...serializeWarehouse(w), ...stats };
  },

  async findByCode(prisma: PrismaClient, code: string) {
    const w = await prisma.warehouse.findUnique({ where: { code }, include: warehouseInclude });
    if (!w) return null;
    const stats = await computeWarehouseStats(prisma, w.id, w.capacity);
    return { ...serializeWarehouse(w), ...stats };
  },

  async findMany(prisma: PrismaClient, filter?: WarehousesFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.WarehouseWhereInput = {
      ...(filter?.status  && { status:  filter.status  }),
      ...(filter?.city    && { city:    { contains: filter.city,    mode: "insensitive" } }),
      ...(filter?.country && { country: { contains: filter.country, mode: "insensitive" } }),
      ...(filter?.search  && {
        OR: [
          { name:    { contains: filter.search, mode: "insensitive" } },
          { code:    { contains: filter.search, mode: "insensitive" } },
          { address: { contains: filter.search, mode: "insensitive" } },
          { city:    { contains: filter.search, mode: "insensitive" } },
        ],
      }),
    };

    const [records, totalCount] = await Promise.all([
      prisma.warehouse.findMany({
        where, skip, take: limit, include: warehouseInclude, orderBy: { name: "asc" },
      }),
      prisma.warehouse.count({ where }),
    ]);

    // Attach stats per warehouse in parallel
    const nodes = await Promise.all(
      records.map(async (w) => {
        const stats = await computeWarehouseStats(prisma, w.id, w.capacity);
        return { ...serializeWarehouse(w), ...stats };
      })
    );

    return { nodes, pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async create(prisma: PrismaClient, data: {
    name: string; code: string; address?: string; city?: string; country?: string;
    phone?: string; email?: string; managerId?: string; capacity?: number; status?: WarehouseStatus;
  }) {
    const w = await prisma.warehouse.create({
      data: {
        name:      data.name,
        code:      data.code.toUpperCase(),
        address:   data.address   ?? null,
        city:      data.city      ?? null,
        country:   data.country   ?? null,
        phone:     data.phone     ?? null,
        email:     data.email     ?? null,
        managerId: data.managerId ?? null,
        capacity:  data.capacity  ?? null,
        status:    data.status    ?? "ACTIVE",
      },
      include: warehouseInclude,
    });
    const stats = await computeWarehouseStats(prisma, w.id, w.capacity);
    return { ...serializeWarehouse(w), ...stats };
  },

  async update(prisma: PrismaClient, id: string, data: WarehouseUpdateData) {
    const w = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(data.name      !== undefined && { name:      data.name      }),
        ...(data.code      !== undefined && { code:      data.code.toUpperCase() }),
        ...(data.address   !== undefined && { address:   data.address   }),
        ...(data.city      !== undefined && { city:      data.city      }),
        ...(data.country   !== undefined && { country:   data.country   }),
        ...(data.phone     !== undefined && { phone:     data.phone     }),
        ...(data.email     !== undefined && { email:     data.email     }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.capacity  !== undefined && { capacity:  data.capacity  }),
        ...(data.status    !== undefined && { status:    data.status    }),
      },
      include: warehouseInclude,
    });
    const stats = await computeWarehouseStats(prisma, w.id, w.capacity);
    return { ...serializeWarehouse(w), ...stats };
  },

  async delete(prisma: PrismaClient, id: string) {
    const stockCount = await prisma.inventoryStock.count({
      where: { warehouseId: id, quantity: { gt: 0 } },
    });
    if (stockCount > 0) {
      throw new Error(`Warehouse has ${stockCount} stock record(s) with inventory. Transfer or clear stock before deleting.`);
    }
    await prisma.warehouse.delete({ where: { id } });
  },
};

// ─── Zone service ─────────────────────────────────────────────────────────────

export const zoneService = {
  async findById(prisma: PrismaClient, id: string) {
    const zone = await prisma.warehouseZone.findUnique({ where: { id } });
    if (!zone) return null;
    const stockCount = await prisma.inventoryStock.count({ where: { zoneId: id } });
    return { ...zone, stockCount };
  },

  async findByWarehouse(prisma: PrismaClient, warehouseId: string) {
    const zones = await prisma.warehouseZone.findMany({
      where:   { warehouseId },
      orderBy: { code: "asc" },
    });
    const counts = await Promise.all(
      zones.map((z) => prisma.inventoryStock.count({ where: { zoneId: z.id } }))
    );
    return zones.map((z, i) => ({ ...z, stockCount: counts[i] ?? 0 }));
  },

  async create(prisma: PrismaClient, data: { warehouseId: string; name: string; code: string; description?: string }) {
    const zone = await prisma.warehouseZone.create({
      data: { warehouseId: data.warehouseId, name: data.name, code: data.code.toUpperCase(), description: data.description ?? null },
    });
    return { ...zone, stockCount: 0 };
  },

  async update(prisma: PrismaClient, id: string, data: { name?: string; code?: string; description?: string }) {
    const zone = await prisma.warehouseZone.update({
      where: { id },
      data: {
        ...(data.name        !== undefined && { name:        data.name }),
        ...(data.code        !== undefined && { code:        data.code.toUpperCase() }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    const stockCount = await prisma.inventoryStock.count({ where: { zoneId: id } });
    return { ...zone, stockCount };
  },

  async delete(prisma: PrismaClient, id: string) {
    const stockCount = await prisma.inventoryStock.count({
      where: { zoneId: id, quantity: { gt: 0 } },
    });
    if (stockCount > 0) {
      throw new Error(`Zone has ${stockCount} stock record(s). Transfer stock before deleting.`);
    }
    await prisma.warehouseZone.delete({ where: { id } });
  },
};

// ─── Stock service ────────────────────────────────────────────────────────────

export const stockService = {
  async findByWarehouse(prisma: PrismaClient, warehouseId: string, filter?: StockFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.InventoryStockWhereInput = {
      warehouseId,
      ...(filter?.zoneId && { zoneId: filter.zoneId }),
      ...(filter?.lowStock && { product: { status: "ACTIVE" } }), // refined in filter below
      ...(filter?.search && {
        product: {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { sku:  { contains: filter.search, mode: "insensitive" } },
          ],
        },
      }),
    };

    let [records, totalCount] = await Promise.all([
      prisma.inventoryStock.findMany({
        where, skip, take: limit, include: stockInclude, orderBy: { product: { name: "asc" } },
      }),
      prisma.inventoryStock.count({ where }),
    ]);

    // Post-filter low-stock (quantity > 0 but <= reorderPoint)
    if (filter?.lowStock) {
      records = records.filter(
        (r) => r.quantity > 0 && r.quantity <= r.product.reorderPoint
      );
      totalCount = records.length;
    }

    return {
      nodes:    records.map(serializeStock),
      pageInfo: buildPageInfo(totalCount, page, limit),
    };
  },

  async upsert(prisma: PrismaClient, data: {
    productId: string; warehouseId: string; zoneId?: string; quantity: number;
  }) {
    const existing = await prisma.inventoryStock.findFirst({
      where: {
        productId:   data.productId,
        warehouseId: data.warehouseId,
        zoneId:      data.zoneId ?? null,
      },
    });

    const record = existing
      ? await prisma.inventoryStock.update({
          where: { id: existing.id },
          data:  { quantity: data.quantity },
          include: stockInclude,
        })
      : await prisma.inventoryStock.create({
          data: {
            productId:   data.productId,
            warehouseId: data.warehouseId,
            zoneId:      data.zoneId ?? null,
            quantity:    data.quantity,
          },
          include: stockInclude,
        });

    return serializeStock(record);
  },

  async adjust(prisma: PrismaClient, stockId: string, quantity: number) {
    const record = await prisma.inventoryStock.update({
      where:   { id: stockId },
      data:    { quantity },
      include: stockInclude,
    });
    return serializeStock(record);
  },

  async remove(prisma: PrismaClient, stockId: string) {
    const existing = await prisma.inventoryStock.findUnique({ where: { id: stockId } });
    if (!existing) throw new Error("Stock record not found.");
    if (existing.reservedQty > 0) {
      throw new Error(`Cannot remove stock with ${existing.reservedQty} reserved units.`);
    }
    await prisma.inventoryStock.delete({ where: { id: stockId } });
  },
};
