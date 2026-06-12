import type { PrismaClient, SupplierStatus, Prisma } from "@prisma/client";

const supplierInclude = {
  _count:        { select: { products: true } },
  purchaseOrders: {
    select: {
      id:          true,
      poNumber:    true,
      status:      true,
      totalAmount: true,
      orderDate:   true,
    },
    orderBy: { orderDate: "desc" as const },
    take:    20,
  },
} satisfies Prisma.SupplierInclude;

export interface SupplierCreateData {
  name:         string;
  code:         string;
  contactName?: string;
  email?:       string;
  phone?:       string;
  address?:     string;
  city?:        string;
  country?:     string;
  gstNumber?:   string;
  status?:      SupplierStatus;
  paymentTerms?: number;
  notes?:       string;
}

export type SupplierUpdateData = Partial<SupplierCreateData>;

export interface SuppliersFilter {
  search?: string;
  status?: SupplierStatus;
}

export interface PaginationArgs {
  page:  number;
  limit: number;
}

type SupplierRecord = Prisma.SupplierGetPayload<{ include: typeof supplierInclude }>;

export function serializeSupplier(s: SupplierRecord) {
  return {
    ...s,
    productCount:    s._count.products,
    purchaseHistory: s.purchaseOrders.map((po) => ({
      ...po,
      totalAmount: po.totalAmount.toString(),
    })),
  };
}

function buildWhere(filter?: SuppliersFilter): Prisma.SupplierWhereInput {
  return {
    ...(filter?.status && { status: filter.status }),
    ...(filter?.search && {
      OR: [
        { name:  { contains: filter.search, mode: "insensitive" } },
        { code:  { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
        { phone: { contains: filter.search, mode: "insensitive" } },
      ],
    }),
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

export const supplierService = {
  async findById(prisma: PrismaClient, id: string) {
    const s = await prisma.supplier.findUnique({ where: { id }, include: supplierInclude });
    return s ? serializeSupplier(s) : null;
  },

  async findMany(prisma: PrismaClient, filter?: SuppliersFilter, pagination?: PaginationArgs) {
    const page  = pagination?.page  ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip  = (page - 1) * limit;
    const where = buildWhere(filter);

    const [records, totalCount] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, include: supplierInclude, orderBy: { createdAt: "desc" } }),
      prisma.supplier.count({ where }),
    ]);

    return { nodes: records.map(serializeSupplier), pageInfo: buildPageInfo(totalCount, page, limit) };
  },

  async create(prisma: PrismaClient, data: SupplierCreateData) {
    const s = await prisma.supplier.create({
      data: {
        name:         data.name,
        code:         data.code.toUpperCase(),
        contactName:  data.contactName  ?? null,
        email:        data.email        ?? null,
        phone:        data.phone        ?? null,
        address:      data.address      ?? null,
        city:         data.city         ?? null,
        country:      data.country      ?? null,
        gstNumber:    data.gstNumber    ?? null,
        status:       data.status       ?? "ACTIVE",
        paymentTerms: data.paymentTerms ?? 30,
        notes:        data.notes        ?? null,
      },
      include: supplierInclude,
    });
    return serializeSupplier(s);
  },

  async update(prisma: PrismaClient, id: string, data: SupplierUpdateData) {
    const s = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name         !== undefined && { name:         data.name         }),
        ...(data.code         !== undefined && { code:         data.code.toUpperCase() }),
        ...(data.contactName  !== undefined && { contactName:  data.contactName  }),
        ...(data.email        !== undefined && { email:        data.email        }),
        ...(data.phone        !== undefined && { phone:        data.phone        }),
        ...(data.address      !== undefined && { address:      data.address      }),
        ...(data.city         !== undefined && { city:         data.city         }),
        ...(data.country      !== undefined && { country:      data.country      }),
        ...(data.gstNumber    !== undefined && { gstNumber:    data.gstNumber    }),
        ...(data.status       !== undefined && { status:       data.status       }),
        ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
        ...(data.notes        !== undefined && { notes:        data.notes        }),
      },
      include: supplierInclude,
    });
    return serializeSupplier(s);
  },

  async delete(prisma: PrismaClient, id: string) {
    const [productCount, poCount] = await Promise.all([
      prisma.product.count({ where: { supplierId: id } }),
      prisma.purchaseOrder.count({ where: { supplierId: id } }),
    ]);
    if (productCount > 0) throw new Error(`Supplier has ${productCount} product(s). Reassign them before deleting.`);
    if (poCount > 0) throw new Error(`Supplier has ${poCount} purchase order(s). Cannot delete.`);
    await prisma.supplier.delete({ where: { id } });
  },
};
