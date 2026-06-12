import { GraphQLError }    from "graphql";
import { requirePermission } from "@/lib/auth/guards";
import { auditLogService }   from "@/lib/services/auditLog.service";
import type { GraphQLContext } from "@/types/auth";
import type { AuditAction }   from "@prisma/client";

interface AuditLogsArgs {
  filter?: {
    search?:   string      | null;
    action?:   AuditAction | null;
    resource?: string      | null;
    userId?:   string      | null;
    dateFrom?: Date        | null;
    dateTo?:   Date        | null;
  };
  pagination?: { page: number; limit: number };
}

export const auditLogResolvers = {
  Query: {
    auditLogs: async (_: unknown, { filter, pagination }: AuditLogsArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:reports");
      return auditLogService.findMany(ctx.prisma, filter ?? {}, pagination);
    },

    auditLog: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:reports");
      const log = await auditLogService.findById(ctx.prisma, id);
      if (!log) throw new GraphQLError("Audit log entry not found.", { extensions: { code: "NOT_FOUND" } });
      return log;
    },

    auditLogStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:reports");
      return auditLogService.getStats(ctx.prisma);
    },

    auditLogResources: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "manage:reports");
      return auditLogService.getDistinctResources(ctx.prisma);
    },
  },
};
