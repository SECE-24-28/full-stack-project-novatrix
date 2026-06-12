import gql from "graphql-tag";

export const auditLogTypeDefs = gql`
  enum AuditAction {
    CREATE
    UPDATE
    DELETE
    LOGIN
    LOGOUT
    EXPORT
  }

  type AuditUser {
    id:        ID!
    firstName: String!
    lastName:  String!
    email:     String!
    role:      String!
  }

  type AuditLog {
    id:         ID!
    user:       AuditUser
    action:     AuditAction!
    resource:   String!
    resourceId: String
    oldValues:  JSON
    newValues:  JSON
    ipAddress:  String
    userAgent:  String
    createdAt:  DateTime!
  }

  type AuditLogConnection {
    nodes:    [AuditLog!]!
    pageInfo: PageInfo!
  }

  type AuditActionCount {
    label: String!
    count: Int!
  }

  type AuditLogStats {
    total:      Int!
    byAction:   [AuditActionCount!]!
    byResource: [AuditActionCount!]!
  }

  input AuditLogFilterInput {
    search:   String
    action:   AuditAction
    resource: String
    userId:   ID
    dateFrom: DateTime
    dateTo:   DateTime
  }

  extend type Query {
    auditLogs(
      filter:     AuditLogFilterInput
      pagination: PaginationInput
    ): AuditLogConnection!

    auditLog(id: ID!): AuditLog

    auditLogStats: AuditLogStats!

    auditLogResources: [String!]!
  }
`;
