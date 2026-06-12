import gql from "graphql-tag";

export const alertTypeDefs = gql`
  enum AlertType {
    LOW_STOCK
    OUT_OF_STOCK
    OVERSTOCK
    EXPIRY_APPROACHING
  }

  enum AlertStatus {
    OPEN
    ACKNOWLEDGED
    RESOLVED
  }

  type AlertProduct {
    id:           ID!
    sku:          String!
    name:         String!
    reorderPoint: Int!
  }

  type StockAlert {
    id:               ID!
    type:             AlertType!
    status:           AlertStatus!
    product:          AlertProduct!
    warehouseId:      ID
    currentQuantity:  Int!
    threshold:        Int
    message:          String
    acknowledgedAt:   DateTime
    resolvedAt:       DateTime
    createdAt:        DateTime!
    updatedAt:        DateTime!
  }

  type StockAlertConnection {
    nodes:    [StockAlert!]!
    pageInfo: PageInfo!
  }

  input AlertsFilterInput {
    type:        AlertType
    status:      AlertStatus
    warehouseId: ID
    search:      String
  }

  extend type Query {
    stockAlerts(
      filter:     AlertsFilterInput
      pagination: PaginationInput
    ): StockAlertConnection!

    openAlertCount: Int!
  }

  extend type Mutation {
    acknowledgeAlert(id: ID!):          StockAlert!
    resolveAlert(id: ID!):              StockAlert!
    bulkResolveAlerts(ids: [ID!]!):     Int!
  }
`;
