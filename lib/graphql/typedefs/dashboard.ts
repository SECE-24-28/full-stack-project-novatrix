import gql from "graphql-tag";

export const dashboardTypeDefs = gql`
  type DashboardStats {
    totalProducts:      Int!
    totalWarehouses:    Int!
    totalSuppliers:     Int!
    totalPurchaseOrders:Int!
    totalSalesOrders:   Int!
    lowStockProducts:   Int!
    openAlerts:         Int!
    totalInventoryUnits:Int!
  }

  type MonthlySalesPoint {
    month:       String!   # "Jan", "Feb", …
    year:        Int!
    salesOrders: Int!
    revenue:     String!
  }

  type InventoryTrendPoint {
    month:       String!
    year:        Int!
    incoming:    Int!
    outgoing:    Int!
    net:         Int!
  }

  type CategoryDistributionItem {
    categoryId:   ID!
    categoryName: String!
    productCount: Int!
  }

  type WarehouseUtilizationItem {
    warehouseId:   ID!
    warehouseName: String!
    warehouseCode: String!
    capacity:      Int
    usedUnits:     Int!
    utilisationPct:Float!
  }

  type RecentOrder {
    id:         ID!
    number:     String!
    type:       String!   # "PO" | "SO"
    status:     String!
    party:      String!   # supplier name or customer name
    totalAmount:String!
    date:       DateTime!
  }

  type LowStockProduct {
    productId:    ID!
    sku:          String!
    name:         String!
    totalQuantity:Int!
    reorderPoint: Int!
    deficit:      Int!
  }

  type DashboardData {
    stats:                 DashboardStats!
    monthlySales:          [MonthlySalesPoint!]!
    inventoryTrend:        [InventoryTrendPoint!]!
    categoryDistribution:  [CategoryDistributionItem!]!
    warehouseUtilization:  [WarehouseUtilizationItem!]!
    recentOrders:          [RecentOrder!]!
    lowStockProducts:      [LowStockProduct!]!
  }

  extend type Query {
    dashboardData: DashboardData!
  }
`;
