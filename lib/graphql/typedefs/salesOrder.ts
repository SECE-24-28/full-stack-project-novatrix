import gql from "graphql-tag";

export const salesOrderTypeDefs = gql`
  enum SalesOrderStatus {
    DRAFT
    CONFIRMED
    PROCESSING
    PARTIALLY_SHIPPED
    SHIPPED
    DELIVERED
    CANCELLED
    RETURNED
  }

  type SOWarehouse {
    id:   ID!
    name: String!
    code: String!
  }

  type SOProduct {
    id:            ID!
    sku:           String!
    name:          String!
    unitOfMeasure: String!
  }

  type SalesOrderItem {
    id:          ID!
    product:     SOProduct!
    orderedQty:  Int!
    shippedQty:  Int!
    unitPrice:   String!
    discountPct: String!
    totalPrice:  String!
  }

  type SalesOrder {
    id:              ID!
    soNumber:        String!
    warehouse:       SOWarehouse!
    status:          SalesOrderStatus!
    customerName:    String!
    customerEmail:   String
    customerPhone:   String
    shippingAddress: String
    orderDate:       DateTime!
    requiredDate:    DateTime
    shippedDate:     DateTime
    deliveredDate:   DateTime
    subtotal:        String!
    taxAmount:       String!
    discountAmount:  String!
    totalAmount:     String!
    notes:           String
    items:           [SalesOrderItem!]!
    createdAt:       DateTime!
    updatedAt:       DateTime!
  }

  type SalesOrderConnection {
    nodes:    [SalesOrder!]!
    pageInfo: PageInfo!
  }

  input SOItemInput {
    productId:   ID!
    orderedQty:  Int!
    unitPrice:   Float!
    discountPct: Float
  }

  input CreateSalesOrderInput {
    warehouseId:     ID!
    customerName:    String!
    customerEmail:   String
    customerPhone:   String
    shippingAddress: String
    requiredDate:    DateTime
    notes:           String
    items:           [SOItemInput!]!
  }

  input SalesOrdersFilterInput {
    search:      String
    status:      SalesOrderStatus
    warehouseId: ID
  }

  extend type Query {
    salesOrder(id: ID!): SalesOrder
    salesOrders(
      filter:     SalesOrdersFilterInput
      pagination: PaginationInput
    ): SalesOrderConnection!
  }

  extend type Mutation {
    createSalesOrder(input: CreateSalesOrderInput!):   SalesOrder!
    processSalesOrder(id: ID!):                        SalesOrder!
    shipSalesOrder(id: ID!):                           SalesOrder!
    deliverSalesOrder(id: ID!):                        SalesOrder!
    cancelSalesOrder(id: ID!):                         SalesOrder!
  }
`;
