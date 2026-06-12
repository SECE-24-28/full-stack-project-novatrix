import { makeExecutableSchema } from "@graphql-tools/schema";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import { baseTypeDefs }            from "./typedefs/base";
import { productTypeDefs }         from "./typedefs/product";
import { warehouseTypeDefs }       from "./typedefs/warehouse";
import { supplierTypeDefs }        from "./typedefs/supplier";
import { purchaseOrderTypeDefs }   from "./typedefs/purchaseOrder";
import { salesOrderTypeDefs }      from "./typedefs/salesOrder";
import { inventoryTypeDefs }       from "./typedefs/inventory";
import { alertTypeDefs }           from "./typedefs/alert";
import { dashboardTypeDefs }       from "./typedefs/dashboard";
import { reportTypeDefs }          from "./typedefs/report";
import { auditLogTypeDefs }        from "./typedefs/auditLog";
import { authResolvers }           from "./resolvers/auth";
import { productResolvers }        from "./resolvers/product";
import { warehouseResolvers }      from "./resolvers/warehouse";
import { supplierResolvers }       from "./resolvers/supplier";
import { purchaseOrderResolvers }  from "./resolvers/purchaseOrder";
import { salesOrderResolvers }     from "./resolvers/salesOrder";
import { inventoryResolvers }      from "./resolvers/inventory";
import { alertResolvers }          from "./resolvers/alert";
import { dashboardResolvers }      from "./resolvers/dashboard";
import { reportResolvers }         from "./resolvers/report";
import { auditLogResolvers }       from "./resolvers/auditLog";

export const schema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, productTypeDefs, warehouseTypeDefs, supplierTypeDefs, purchaseOrderTypeDefs, salesOrderTypeDefs, inventoryTypeDefs, alertTypeDefs, dashboardTypeDefs, reportTypeDefs, auditLogTypeDefs],
  resolvers: [
    { DateTime: DateTimeResolver, JSON: JSONResolver },
    authResolvers,
    productResolvers,
    warehouseResolvers,
    supplierResolvers,
    purchaseOrderResolvers,
    salesOrderResolvers,
    inventoryResolvers,
    alertResolvers,
    dashboardResolvers,
    reportResolvers,
    auditLogResolvers,
  ],
});
