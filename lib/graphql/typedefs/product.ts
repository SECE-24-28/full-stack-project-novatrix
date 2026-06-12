import gql from "graphql-tag";

export const productTypeDefs = gql`
  # ── Enums ─────────────────────────────────────────────────────────────────────

  enum ProductStatus {
    ACTIVE
    INACTIVE
    DISCONTINUED
  }

  # ── Types ─────────────────────────────────────────────────────────────────────

  type Category {
    id:          ID!
    name:        String!
    description: String
    parentId:    ID
    parent:      Category
    children:    [Category!]!
    productCount: Int!
    createdAt:   DateTime!
    updatedAt:   DateTime!
  }

  type CategoryConnection {
    nodes:    [Category!]!
    pageInfo: PageInfo!
  }

  type ProductStockSummary {
    totalQuantity: Int!
    reservedQty:   Int!
    availableQty:  Int!
  }

  type ProductSupplier {
    id:   ID!
    name: String!
    code: String!
  }

  type Product {
    id:              ID!
    sku:             String!
    name:            String!
    description:     String
    category:        Category!
    supplier:        ProductSupplier
    unitOfMeasure:   String!
    costPrice:       String!
    sellingPrice:    String!
    reorderPoint:    Int!
    reorderQuantity: Int!
    weight:          String
    barcode:         String
    imageUrl:        String
    status:          ProductStatus!
    stockSummary:    ProductStockSummary!
    createdAt:       DateTime!
    updatedAt:       DateTime!
  }

  type ProductConnection {
    nodes:    [Product!]!
    pageInfo: PageInfo!
  }

  # ── Inputs ────────────────────────────────────────────────────────────────────

  input ProductsFilterInput {
    search:     String
    categoryId: ID
    status:     ProductStatus
    supplierId: ID
  }

  input CreateProductInput {
    sku:             String!
    name:            String!
    description:     String
    categoryId:      ID!
    supplierId:      ID
    unitOfMeasure:   String!
    costPrice:       Float!
    sellingPrice:    Float!
    reorderPoint:    Int!
    reorderQuantity: Int!
    weight:          Float
    barcode:         String
    imageUrl:        String
    status:          ProductStatus
  }

  input UpdateProductInput {
    id:              ID!
    sku:             String
    name:            String
    description:     String
    categoryId:      ID
    supplierId:      ID
    unitOfMeasure:   String
    costPrice:       Float
    sellingPrice:    Float
    reorderPoint:    Int
    reorderQuantity: Int
    weight:          Float
    barcode:         String
    imageUrl:        String
    status:          ProductStatus
  }

  input CreateCategoryInput {
    name:        String!
    description: String
    parentId:    ID
  }

  input UpdateCategoryInput {
    id:          ID!
    name:        String
    description: String
    parentId:    ID
  }

  # ── Queries ───────────────────────────────────────────────────────────────────

  extend type Query {
    product(id: ID!):  Product
    productBySku(sku: String!): Product
    products(
      filter:     ProductsFilterInput
      pagination: PaginationInput
    ): ProductConnection!

    category(id: ID!): Category
    categories(
      parentId:   ID
      pagination: PaginationInput
    ): CategoryConnection!
  }

  # ── Mutations ─────────────────────────────────────────────────────────────────

  extend type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(input: UpdateProductInput!): Product!
    deleteProduct(id: ID!):                    Boolean!

    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!):                     Boolean!
  }
`;
