import { GraphQLError } from "graphql";
import { requirePermission } from "@/lib/auth/guards";
import { alertService } from "@/lib/services/alert.service";
import type { GraphQLContext } from "@/types/auth";
import type { AlertType, AlertStatus } from "@prisma/client";

interface AlertsArgs {
  filter?: { type?: AlertType; status?: AlertStatus; warehouseId?: string; search?: string };
  pagination?: { page: number; limit: number };
}

export const alertResolvers = {
  Query: {
    stockAlerts: (_: unknown, args: AlertsArgs, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:inventory");
      return alertService.findMany(ctx.prisma, args.filter, args.pagination);
    },

    openAlertCount: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "read:inventory");
      return alertService.countOpen(ctx.prisma);
    },
  },

  Mutation: {
    acknowledgeAlert: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:inventory");
      try {
        return await alertService.acknowledge(ctx.prisma, id, ctx.auth!.userId);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    resolveAlert: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:inventory");
      try {
        return await alertService.resolve(ctx.prisma, id);
      } catch (err) {
        throw new GraphQLError((err as Error).message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    bulkResolveAlerts: async (_: unknown, { ids }: { ids: string[] }, ctx: GraphQLContext) => {
      requirePermission(ctx.auth, "update:inventory");
      return alertService.bulkResolve(ctx.prisma, ids);
    },
  },
};
