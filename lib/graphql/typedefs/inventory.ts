import gql from "graphql-tag";

export const inventoryTypeDefs = gql`
  enum TransactionType {
    PURCHASE_RECEIPT
    SALES_ISSUE
    TRANSFER_IN
    TRANSFER_OUT
    ADJUSTMENT_IN
    ADJUSTMENT_OUT
    RETURN_IN
    RETURN_OUT
    DAMAGE_WRITE_OFF
  }

  # ── Overview ──────────────────────────────────────────────────────────────────

  type InventoryOverview {
    totalProducts:    Int!
    totalUnits:       Int!
    totalWarehouses:  Int!
    lowStockCount:    Int!
    outOfStockCount:  Int!
    incomingUnits:    Int!
    outgoingUnits:    Int!
  }

  # ── Product stock across all warehouses ───────────────────────────────────────

  type StockByWarehouse {
    warehouseId:   ID!
    warehouseName: String!
    warehouseCode: String!
    quantity:      Int!
    reservedQty:   Int!
    availableQty:  Int!
  }

  type ProductStockOverview {
    productId:     ID!
    sku:           String!
    name:          String!
    unitOfMeasure: String!
    reorderPoint:  Int!
    status:        ProductStatus!
    totalQuantity: Int!
    totalReserved: Int!
    totalAvailable:Int!
    stockByWarehouse: [StockByWarehouse!]!
  }

  type ProductStockConnection {
    nodes:    [ProductStockOverview!]!
    pageInfo: PageInfo!
  }

  # ── Transactions ──────────────────────────────────────────────────────────────

  type TxnProduct {
    id:   ID!
    sku:  String!
    name: String!
  }

  type TxnWarehouse {
    id:   ID!
    name: String!
    code: String!
  }

  type TxnPerformedBy {
    id:        ID!
    firstName: String!
    lastName:  String!
  }

  type InventoryTransaction {
    id:               ID!
    type:             TransactionType!
    quantity:         Int!
    quantityBefore:   Int!
    quantityAfter:    Int!
    unitCost:         String
    reference:        String
    notes:            String
    product:          TxnProduct!
    sourceWarehouse:  TxnWarehouse
    destWarehouse:    TxnWarehouse
    performedBy:      TxnPerformedBy!
    createdAt:        DateTime!
  }

  type InventoryTransactionConnection {
    nodes:    [InventoryTransaction!]!
    pageInfo: PageInfo!
  }

  # ── Inputs ────────────────────────────────────────────────────────────────────

  input InventoryTransactionsFilterInput {
    productId:   ID
    warehouseId: ID
    type:        TransactionType
    dateFrom:    DateTime
    dateTo:      DateTime
    search:      String
  }

  input ProductStockFilterInput {
    search:      String
    warehouseId: ID
    lowStock:    Boolean
    outOfStock:  Boolean
  }

  # ── Queries ───────────────────────────────────────────────────────────────────

  extend type Query {
    inventoryOverview: InventoryOverview!

    inventoryTransactions(
      filter:     InventoryTransactionsFilterInput
      pagination: PaginationInput
    ): InventoryTransactionConnection!

    productStockOverview(
      filter:     ProductStockFilterInput
      pagination: PaginationInput
    ): ProductStockConnection!
  }
`;
