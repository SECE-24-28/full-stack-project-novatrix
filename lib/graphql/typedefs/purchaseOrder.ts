import gql from "graphql-tag";

export const purchaseOrderTypeDefs = gql`
  enum PurchaseOrderStatus {
    DRAFT
    SUBMITTED
    APPROVED
    PARTIALLY_RECEIVED
    RECEIVED
    CANCELLED
  }

  type POSupplier {
    id:   ID!
    name: String!
    code: String!
  }

  type POWarehouse {
    id:   ID!
    name: String!
    code: String!
  }

  type POProduct {
    id:   ID!
    sku:  String!
    name: String!
    unitOfMeasure: String!
  }

  type PurchaseOrderItem {
    id:          ID!
    product:     POProduct!
    orderedQty:  Int!
    receivedQty: Int!
    unitCost:    String!
    totalCost:   String!
  }

  type PurchaseOrder {
    id:           ID!
    poNumber:     String!
    supplier:     POSupplier!
    warehouse:    POWarehouse!
    status:       PurchaseOrderStatus!
    orderDate:    DateTime!
    expectedDate: DateTime
    receivedDate: DateTime
    subtotal:     String!
    taxAmount:    String!
    totalAmount:  String!
    notes:        String
    items:        [PurchaseOrderItem!]!
    createdAt:    DateTime!
    updatedAt:    DateTime!
  }

  type PurchaseOrderConnection {
    nodes:    [PurchaseOrder!]!
    pageInfo: PageInfo!
  }

  input POItemInput {
    productId:  ID!
    orderedQty: Int!
    unitCost:   Float!
  }

  input CreatePurchaseOrderInput {
    supplierId:   ID!
    warehouseId:  ID!
    expectedDate: DateTime
    notes:        String
    items:        [POItemInput!]!
  }

  input PurchaseOrdersFilterInput {
    search:     String
    status:     PurchaseOrderStatus
    supplierId: ID
    warehouseId: ID
  }

  extend type Query {
    purchaseOrder(id: ID!): PurchaseOrder
    purchaseOrders(
      filter:     PurchaseOrdersFilterInput
      pagination: PaginationInput
    ): PurchaseOrderConnection!
  }

  extend type Mutation {
    createPurchaseOrder(input: CreatePurchaseOrderInput!): PurchaseOrder!
    approvePurchaseOrder(id: ID!):  PurchaseOrder!
    cancelPurchaseOrder(id: ID!):   PurchaseOrder!
    receivePurchaseOrder(id: ID!):  PurchaseOrder!
  }
`;
