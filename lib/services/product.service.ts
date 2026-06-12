import type { PrismaClient, ProductStatus, Prisma } from "@prisma/client";

// ─── Shared include ───────────────────────────────────────────────────────────

const productInclude = {
  category:       true,
  supplier:       { select: { id: true, name: true, code: true } },
  inventoryStock: { select: { quantity: true, reservedQty: true } },
} satisfies Prisma.ProductInclude;

// ─── Explicit input type ──────────────────────────────────────────────────────

export interface ProductCreateData {
  sku:             string;
  name:            string;
  description?:    string;
  categoryId:      string;
  supplierId?:     string;
  unitOfMeasure:   string;
  costPrice:       number;
  sellingPrice:    number;
  reorderPoint:    number;
  reorderQuantity: number;
  weight?:         number;
  barcode?:        string;
  imageUrl?:       string;
  status?:         ProductStatus;
}

export type ProductUpdateData = Partial<ProductCreateData>;

// ─── Other types ──────────────────────────────────────────────────────────────

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export interface ProductsFilter {
  search?:     string;
  categoryId?: string;
  status?:     ProductStatus;
  supplierId?: string;
}

export interface PaginationArgs {
  page:  number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProductWhere(filter?: ProductsFilter): Prisma.ProductWhereInput {
  return {
    ...(filter?.status     && { status:     filter.status     }),
    ...(filter?.categoryId && { categoryId: filter.categoryId }),
    ...(filter?.supplierId && { supplierId: filter.supplierId }),
    ...(filter?.search && {
      OR: [
        { name:        { contains: filter.search, mode: "insensitive" } },
        { sku:         { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
        { barcode:     { contains: filter.search, mode: "insensitive" } },
      ],
    }),
  };
}

function toStockSummary(stock: { quantity: number; reservedQty: number }[]) {
  const totalQuantity = stock.reduce((s, r) => s + r.quantity,    0);
  const reservedQty   = stock.reduce((s, r) => s + r.reservedQty, 0);
  return { totalQuantity, reservedQty, availableQty: totalQuantity - reservedQty };
}

export function serializeProduct(p: ProductRecord) {
  return {
    ...p,
    costPrice:    p.costPrice.toString(),
    sellingPrice: p.sellingPrice.toString(),
    weight:       p.weight?.toString() ?? null,
    stockSummary: toStockSummary(p.inventoryStock),
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

// ─── Category service ─────────────────────────────────────────────────────────

export const categoryService = {
  async findById(prisma: PrismaClient, id: string) {
    return prisma.category.findUnique({
      where:   { id },
      include: { parent: true, children: true, _count: { select: { products: true } } },
    });
  },

  async findAll(prisma: PrismaClient, parentId?: string | null, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip  = (page - 1) * limit;
    const where: Prisma.CategoryWhereInput =
      parentId !== undefined ? { parentId: parentId ?? null } : {};

    const [nodes, totalCount] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take:    limit,
        include: { parent: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.category.count({ where }),
    ]);

    return { nodes, pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async create(prisma: PrismaClient, data: { name: string; description?: string; parentId?: string }) {
    return prisma.category.create({
      data:    { name: data.name, description: data.description, parentId: data.parentId ?? null },
      include: { parent: true, _count: { select: { products: true } } },
    });
  },

  async update(prisma: PrismaClient, id: string, data: { name?: string; description?: string; parentId?: string }) {
    return prisma.category.update({
      where:   { id },
      data: {
        ...(data.name        !== undefined && { name:        data.name        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId    !== undefined && { parentId:    data.parentId    }),
      },
      include: { parent: true, _count: { select: { products: true } } },
    });
  },

  async delete(prisma: PrismaClient, id: string) {
    const used = await prisma.product.count({ where: { categoryId: id } });
    if (used > 0) throw new Error(`Category has ${used} product(s). Reassign them before deleting.`);
    await prisma.category.delete({ where: { id } });
  },
};

// ─── Product service ──────────────────────────────────────────────────────────

export const productService = {
  async findById(prisma: PrismaClient, id: string) {
    const p = await prisma.product.findUnique({ where: { id }, include: productInclude });
    return p ? serializeProduct(p) : null;
  },

  async findBySku(prisma: PrismaClient, sku: string) {
    const p = await prisma.product.findUnique({ where: { sku }, include: productInclude });
    return p ? serializeProduct(p) : null;
  },

  async findMany(prisma: PrismaClient, filter?: ProductsFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;
    const where = buildProductWhere(filter);

    const [records, totalCount] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, include: productInclude, orderBy: { createdAt: "desc" } }),
      prisma.product.count({ where }),
    ]);

    return { nodes: records.map(serializeProduct), pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async create(prisma: PrismaClient, data: ProductCreateData) {
    const p = await prisma.product.create({
      data: {
        sku:             data.sku,
        name:            data.name,
        description:     data.description    ?? null,
        categoryId:      data.categoryId,
        supplierId:      data.supplierId     ?? null,
        unitOfMeasure:   data.unitOfMeasure,
        costPrice:       data.costPrice,
        sellingPrice:    data.sellingPrice,
        reorderPoint:    data.reorderPoint,
        reorderQuantity: data.reorderQuantity,
        weight:          data.weight         ?? null,
        barcode:         data.barcode        ?? null,
        imageUrl:        data.imageUrl       ?? null,
        status:          data.status         ?? "ACTIVE",
      },
      include: productInclude,
    });
    return serializeProduct(p);
  },

  async update(prisma: PrismaClient, id: string, data: ProductUpdateData) {
    const p = await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku             !== undefined && { sku:             data.sku             }),
        ...(data.name            !== undefined && { name:            data.name            }),
        ...(data.description     !== undefined && { description:     data.description     }),
        ...(data.categoryId      !== undefined && { categoryId:      data.categoryId      }),
        ...(data.supplierId      !== undefined && { supplierId:      data.supplierId      }),
        ...(data.unitOfMeasure   !== undefined && { unitOfMeasure:   data.unitOfMeasure   }),
        ...(data.costPrice       !== undefined && { costPrice:       data.costPrice       }),
        ...(data.sellingPrice    !== undefined && { sellingPrice:    data.sellingPrice    }),
        ...(data.reorderPoint    !== undefined && { reorderPoint:    data.reorderPoint    }),
        ...(data.reorderQuantity !== undefined && { reorderQuantity: data.reorderQuantity }),
        ...(data.weight          !== undefined && { weight:          data.weight          }),
        ...(data.barcode         !== undefined && { barcode:         data.barcode         }),
        ...(data.imageUrl        !== undefined && { imageUrl:        data.imageUrl        }),
        ...(data.status          !== undefined && { status:          data.status          }),
      },
      include: productInclude,
    });
    return serializeProduct(p);
  },

  async delete(prisma: PrismaClient, id: string) {
    const [poItems, soItems] = await Promise.all([
      prisma.purchaseOrderItem.count({ where: { productId: id } }),
      prisma.salesOrderItem.count({    where: { productId: id } }),
    ]);
    if (poItems + soItems > 0) {
      throw new Error("Cannot delete a product with associated orders. Discontinue it instead.");
    }
    await prisma.product.delete({ where: { id } });
  },
};
