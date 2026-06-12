import gql from "graphql-tag";

export const baseTypeDefs = gql`
  scalar DateTime
  scalar JSON

  # ── Enums ────────────────────────────────────────────────────────────────────

  enum Role {
    SUPER_ADMIN
    ADMIN
    WAREHOUSE_MANAGER
    INVENTORY_CLERK
    VIEWER
  }

  # ── Shared ───────────────────────────────────────────────────────────────────

  type PageInfo {
    totalCount:      Int!
    totalPages:      Int!
    currentPage:     Int!
    hasNextPage:     Boolean!
    hasPreviousPage: Boolean!
  }

  input PaginationInput {
    page:  Int = 1
    limit: Int = 20
  }

  # ── Auth types ────────────────────────────────────────────────────────────────

  type AuthTokens {
    accessToken:  String!
    refreshToken: String!
  }

  type User {
    id:        ID!
    email:     String!
    firstName: String!
    lastName:  String!
    fullName:  String!
    role:      Role!
    isActive:  Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    user:   User!
    tokens: AuthTokens!
  }

  type UserConnection {
    nodes:    [User!]!
    pageInfo: PageInfo!
  }

  # ── Inputs ────────────────────────────────────────────────────────────────────

  input LoginInput {
    email:    String!
    password: String!
  }

  input RegisterInput {
    email:     String!
    password:  String!
    firstName: String!
    lastName:  String!
    role:      Role
  }

  input UpdateProfileInput {
    firstName: String
    lastName:  String
    email:     String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword:     String!
  }

  input UpdateUserRoleInput {
    userId: ID!
    role:   Role!
  }

  input UsersFilterInput {
    role:     Role
    isActive: Boolean
    search:   String
  }

  # ── Queries ───────────────────────────────────────────────────────────────────

  type Query {
    me:          User
    user(id: ID!): User
    users(
      filter:     UsersFilterInput
      pagination: PaginationInput
    ): UserConnection!
    _healthcheck: String!
  }

  # ── Mutations ─────────────────────────────────────────────────────────────────

  type Mutation {
    # Public
    login(input: LoginInput!):       AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    refreshToken(token: String!):    AuthTokens!
    logout(refreshToken: String!):   Boolean!

    # Authenticated
    updateProfile(input: UpdateProfileInput!):   User!
    changePassword(input: ChangePasswordInput!): Boolean!
    revokeAllSessions:                           Boolean!

    # Admin+
    updateUserRole(input: UpdateUserRoleInput!): User!
    deactivateUser(userId: ID!):                 User!
    activateUser(userId: ID!):                   User!
  }
`;
