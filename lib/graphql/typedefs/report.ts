import gql from "graphql-tag";

export const reportTypeDefs = gql`
  # ── Shared filter input ───────────────────────────────────────────────────────
  input ReportFilterInput {
    search:      String
    dateFrom:    DateTime
    dateTo:      DateTime
    status:      String
    warehouseId: ID
    supplierId:  ID
    categoryId:  ID
  }

  # ── Inventory Report ──────────────────────────────────────────────────────────
  type InventoryReportRow {
    productId:      ID!
    sku:            String!
    name:           String!
    category:       String!
    supplier:       String!
    warehouseName:  String!
    warehouseCode:  String!
    quantity:       Int!
    reservedQty:    Int!
    availableQty:   Int!
    reorderPoint:   Int!
    costPrice:      String!
    sellingPrice:   String!
    stockValue:     String!
    status:         String!
  }

  type InventoryReportResult {
    rows:            [InventoryReportRow!]!
    totalRows:       Int!
    totalValue:      String!
    lowStockCount:   Int!
    outOfStockCount: Int!
  }

  # ── Sales Report ──────────────────────────────────────────────────────────────
  type SalesReportRow {
    orderId:        ID!
    soNumber:       String!
    customerName:   String!
    warehouse:      String!
    status:         String!
    orderDate:      String!
    deliveredDate:  String
    subtotal:       String!
    taxAmount:      String!
    discountAmount: String!
    totalAmount:    String!
    itemCount:      Int!
  }

  type SalesReportResult {
    rows:          [SalesReportRow!]!
    totalRows:     Int!
    totalRevenue:  String!
    totalTax:      String!
    totalDiscount: String!
    orderCount:    Int!
  }

  # ── Supplier Report ───────────────────────────────────────────────────────────
  type SupplierReportRow {
    supplierId:    ID!
    name:          String!
    code:          String!
    contactName:   String!
    email:         String!
    phone:         String!
    country:       String!
    status:        String!
    paymentTerms:  Int!
    totalOrders:   Int!
    totalSpend:    String!
    lastOrderDate: String
    productCount:  Int!
  }

  type SupplierReportResult {
    rows:        [SupplierReportRow!]!
    totalRows:   Int!
    totalSpend:  String!
    activeCount: Int!
  }

  # ── Warehouse Report ──────────────────────────────────────────────────────────
  type WarehouseReportRow {
    warehouseId:    ID!
    name:           String!
    code:           String!
    city:           String!
    country:        String!
    status:         String!
    capacity:       Int
    usedUnits:      Int!
    utilisationPct: Float!
    totalProducts:  Int!
    stockValue:     String!
    zoneCount:      Int!
    inboundOrders:  Int!
    outboundOrders: Int!
  }

  type WarehouseReportResult {
    rows:       [WarehouseReportRow!]!
    totalRows:  Int!
    totalStock: Int!
    avgUtil:    Float!
  }

  # ── Queries ───────────────────────────────────────────────────────────────────
  extend type Query {
    inventoryReport(filter: ReportFilterInput):  InventoryReportResult!
    salesReport(filter: ReportFilterInput):      SalesReportResult!
    supplierReport(filter: ReportFilterInput):   SupplierReportResult!
    warehouseReport(filter: ReportFilterInput):  WarehouseReportResult!
  }
`;
