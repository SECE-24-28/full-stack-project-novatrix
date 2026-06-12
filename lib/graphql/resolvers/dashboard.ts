import { requireAuth }       from "@/lib/auth/guards";
import { dashboardService }  from "@/lib/services/dashboard.service";
import type { GraphQLContext } from "@/types/auth";

export const dashboardResolvers = {
  Query: {
    dashboardData: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx.auth);
      return dashboardService.getDashboardData(ctx.prisma);
    },
  },
};
