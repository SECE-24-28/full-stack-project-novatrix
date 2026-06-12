import gql from "graphql-tag";

export const supplierTypeDefs = gql`
  enum SupplierStatus {
    ACTIVE
    INACTIVE
    BLACKLISTED
  }

  type PurchaseOrderSummary {
    id:          ID!
    poNumber:    String!
    status:      String!
    totalAmount: String!
    orderDate:   DateTime!
  }

  type Supplier {
    id:           ID!
    name:         String!
    code:         String!
    contactName:  String
    email:        String
    phone:        String
    address:      String
    city:         String
    country:      String
    gstNumber:    String
    status:       SupplierStatus!
    paymentTerms: Int!
    notes:        String
    productCount: Int!
    purchaseHistory: [PurchaseOrderSummary!]!
    createdAt:    DateTime!
    updatedAt:    DateTime!
  }

  type SupplierConnection {
    nodes:    [Supplier!]!
    pageInfo: PageInfo!
  }

  input SuppliersFilterInput {
    search: String
    status: SupplierStatus
  }

  input CreateSupplierInput {
    name:         String!
    code:         String!
    contactName:  String
    email:        String
    phone:        String
    address:      String
    city:         String
    country:      String
    gstNumber:    String
    status:       SupplierStatus
    paymentTerms: Int
    notes:        String
  }

  input UpdateSupplierInput {
    id:           ID!
    name:         String
    code:         String
    contactName:  String
    email:        String
    phone:        String
    address:      String
    city:         String
    country:      String
    gstNumber:    String
    status:       SupplierStatus
    paymentTerms: Int
    notes:        String
  }

  extend type Query {
    supplier(id: ID!): Supplier
    suppliers(
      filter:     SuppliersFilterInput
      pagination: PaginationInput
    ): SupplierConnection!
  }

  extend type Mutation {
    createSupplier(input: CreateSupplierInput!): Supplier!
    updateSupplier(input: UpdateSupplierInput!): Supplier!
    deleteSupplier(id: ID!):                     Boolean!
  }
`;
