import gql from "graphql-tag";

export const warehouseTypeDefs = gql`
  # ── Enums ─────────────────────────────────────────────────────────────────────

  enum WarehouseStatus {
    ACTIVE
    INACTIVE
    UNDER_MAINTENANCE
  }

  # ── Types ─────────────────────────────────────────────────────────────────────

  type WarehouseZone {
    id:          ID!
    warehouseId: ID!
    name:        String!
    code:        String!
    description: String
    stockCount:  Int!
    createdAt:   DateTime!
    updatedAt:   DateTime!
  }

  type WarehouseCapacityStats {
    totalCapacity:     Int
    usedCapacity:      Int!
    availableCapacity: Int
    utilisationPct:    Float
  }

  type WarehouseSummary {
    totalProducts: Int!
    totalUnits:    Int!
    lowStockCount: Int!
    zoneCount:     Int!
  }

  type Warehouse {
    id:            ID!
    name:          String!
    code:          String!
    address:       String
    city:          String
    country:       String
    phone:         String
    email:         String
    managerId:     ID
    capacity:      Int
    status:        WarehouseStatus!
    capacityStats: WarehouseCapacityStats!
    summary:       WarehouseSummary!
    zones:         [WarehouseZone!]!
    createdAt:     DateTime!
    updatedAt:     DateTime!
  }

  type WarehouseConnection {
    nodes:    [Warehouse!]!
    pageInfo: PageInfo!
  }

  type WarehouseStockProduct {
    id:            ID!
    sku:           String!
    name:          String!
    unitOfMeasure: String!
    reorderPoint:  Int!
    status:        ProductStatus!
    category:      Category!
  }

  type WarehouseStockZone {
    id:   ID!
    name: String!
    code: String!
  }

  type WarehouseStockItem {
    id:           ID!
    quantity:     Int!
    reservedQty:  Int!
    availableQty: Int!
    product:      WarehouseStockProduct!
    zone:         WarehouseStockZone
    updatedAt:    DateTime!
  }

  type WarehouseStockConnection {
    nodes:    [WarehouseStockItem!]!
    pageInfo: PageInfo!
  }

  # ── Inputs ────────────────────────────────────────────────────────────────────

  input WarehousesFilterInput {
    search:  String
    status:  WarehouseStatus
    city:    String
    country: String
  }

  input CreateWarehouseInput {
    name:      String!
    code:      String!
    address:   String
    city:      String
    country:   String
    phone:     String
    email:     String
    managerId: ID
    capacity:  Int
    status:    WarehouseStatus
  }

  input UpdateWarehouseInput {
    id:        ID!
    name:      String
    code:      String
    address:   String
    city:      String
    country:   String
    phone:     String
    email:     String
    managerId: ID
    capacity:  Int
    status:    WarehouseStatus
  }

  input CreateZoneInput {
    warehouseId:  ID!
    name:         String!
    code:         String!
    description:  String
  }

  input UpdateZoneInput {
    id:          ID!
    name:        String
    code:        String
    description: String
  }

  input AssignStockInput {
    productId:   ID!
    warehouseId: ID!
    zoneId:      ID
    quantity:    Int!
  }

  input AdjustStockInput {
    stockId:  ID!
    quantity: Int!
    notes:    String
  }

  input WarehouseStockFilterInput {
    search:    String
    zoneId:    ID
    lowStock:  Boolean
  }

  # ── Queries ───────────────────────────────────────────────────────────────────

  extend type Query {
    warehouse(id: ID!):     Warehouse
    warehouseByCode(code: String!): Warehouse
    warehouses(
      filter:     WarehousesFilterInput
      pagination: PaginationInput
    ): WarehouseConnection!

    warehouseZone(id: ID!): WarehouseZone
    warehouseZones(warehouseId: ID!): [WarehouseZone!]!

    warehouseStock(
      warehouseId: ID!
      filter:      WarehouseStockFilterInput
      pagination:  PaginationInput
    ): WarehouseStockConnection!
  }

  # ── Mutations ─────────────────────────────────────────────────────────────────

  extend type Mutation {
    createWarehouse(input: CreateWarehouseInput!): Warehouse!
    updateWarehouse(input: UpdateWarehouseInput!): Warehouse!
    deleteWarehouse(id: ID!):                      Boolean!

    createZone(input: CreateZoneInput!): WarehouseZone!
    updateZone(input: UpdateZoneInput!): WarehouseZone!
    deleteZone(id: ID!):                 Boolean!

    assignStock(input: AssignStockInput!): WarehouseStockItem!
    adjustStock(input: AdjustStockInput!): WarehouseStockItem!
    removeStock(stockId: ID!):             Boolean!
  }
`;
