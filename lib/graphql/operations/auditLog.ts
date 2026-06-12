import { gql } from "@apollo/client";

const AUDIT_LOG_FIELDS = gql`
  fragment AuditLogFields on AuditLog {
    id action resource resourceId
    oldValues newValues
    ipAddress userAgent createdAt
    user { id firstName lastName email role }
  }
`;

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: AuditLogFilterInput, $pagination: PaginationInput) {
    auditLogs(filter: $filter, pagination: $pagination) {
      nodes {
        id action resource resourceId
        ipAddress createdAt
        user { id firstName lastName email role }
      }
      pageInfo {
        totalCount totalPages currentPage hasNextPage hasPreviousPage
      }
    }
  }
`;

export const GET_AUDIT_LOG = gql`
  query GetAuditLog($id: ID!) {
    auditLog(id: $id) {
      id action resource resourceId
      oldValues newValues
      ipAddress userAgent createdAt
      user { id firstName lastName email role }
    }
  }
`;

export const GET_AUDIT_LOG_STATS = gql`
  query GetAuditLogStats {
    auditLogStats {
      total
      byAction   { label count }
      byResource { label count }
    }
  }
`;

export const GET_AUDIT_LOG_RESOURCES = gql`
  query GetAuditLogResources {
    auditLogResources
  }
`;
