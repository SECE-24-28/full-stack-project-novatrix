import type { PrismaClient, AuditAction, Prisma } from "@prisma/client";

export interface AuditLogFilter {
  search?:     string | null;
  action?:     AuditAction | null;
  resource?:   string      | null;
  userId?:     string      | null;
  dateFrom?:   Date        | null;
  dateTo?:     Date        | null;
}

export interface PaginationArgs { page: number; limit: number; }

function buildWhere(filter: AuditLogFilter): Prisma.AuditLogWhereInput {
  return {
    ...(filter.action   ? { action:   filter.action   } : {}),
    ...(filter.resource ? { resource: { equals: filter.resource, mode: "insensitive" } } : {}),
    ...(filter.userId   ? { userId:   filter.userId   } : {}),
    ...(filter.dateFrom || filter.dateTo ? {
      createdAt: {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo   ? { lte: filter.dateTo   } : {}),
      },
    } : {}),
    ...(filter.search ? {
      OR: [
        { resource:   { contains: filter.search, mode: "insensitive" } },
        { resourceId: { contains: filter.search, mode: "insensitive" } },
        { user: {
          OR: [
            { firstName: { contains: filter.search, mode: "insensitive" } },
            { lastName:  { contains: filter.search, mode: "insensitive" } },
            { email:     { contains: filter.search, mode: "insensitive" } },
          ],
        }},
      ],
    } : {}),
  };
}

export const auditLogService = {
  async findMany(prisma: PrismaClient, filter: AuditLogFilter = {}, pagination: PaginationArgs = { page: 1, limit: 50 }) {
    const page  = pagination.page  ?? 1;
    const limit = pagination.limit ?? 50;
    const skip  = (page - 1) * limit;
    const where = buildWhere(filter);

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      nodes: logs,
      pageInfo: {
        totalCount,
        totalPages:      Math.ceil(totalCount / limit),
        currentPage:     page,
        hasNextPage:     page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
    };
  },

  async findById(prisma: PrismaClient, id: string) {
    return prisma.auditLog.findUnique({
      where:   { id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });
  },

  async getStats(prisma: PrismaClient) {
    const [total, byAction, byResource] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({ by: ["action"],   _count: { _all: true }, orderBy: { _count: { action: "desc" } } }),
      prisma.auditLog.groupBy({ by: ["resource"], _count: { _all: true }, orderBy: { _count: { resource: "desc" } }, take: 8 }),
    ]);

    return {
      total,
      byAction:   byAction.map((r)   => ({ label: r.action,   count: r._count._all })),
      byResource: byResource.map((r) => ({ label: r.resource, count: r._count._all })),
    };
  },

  async getDistinctResources(prisma: PrismaClient): Promise<string[]> {
    const rows = await prisma.auditLog.findMany({
      distinct:  ["resource"],
      select:    { resource: true },
      orderBy:   { resource: "asc" },
    });
    return rows.map((r) => r.resource);
  },
};
