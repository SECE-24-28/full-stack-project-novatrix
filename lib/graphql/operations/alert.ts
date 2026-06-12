import { gql } from "@apollo/client";

export const ALERT_FIELDS = gql`
  fragment AlertFields on StockAlert {
    id type status currentQuantity threshold message
    acknowledgedAt resolvedAt createdAt updatedAt warehouseId
    product { id sku name reorderPoint }
  }
`;

export const GET_STOCK_ALERTS = gql`
  ${ALERT_FIELDS}
  query GetStockAlerts($filter: AlertsFilterInput, $pagination: PaginationInput) {
    stockAlerts(filter: $filter, pagination: $pagination) {
      nodes    { ...AlertFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_OPEN_ALERT_COUNT = gql`
  query GetOpenAlertCount {
    openAlertCount
  }
`;

export const GET_ALERT_SUMMARY = gql`
  query GetAlertSummary {
    open:         stockAlerts(filter: { status: OPEN         }) { pageInfo { totalCount } }
    acknowledged: stockAlerts(filter: { status: ACKNOWLEDGED }) { pageInfo { totalCount } }
    resolved:     stockAlerts(filter: { status: RESOLVED     }) { pageInfo { totalCount } }
    all:          stockAlerts                                   { pageInfo { totalCount } }
  }
`;

export const ACKNOWLEDGE_ALERT = gql`
  ${ALERT_FIELDS}
  mutation AcknowledgeAlert($id: ID!) {
    acknowledgeAlert(id: $id) { ...AlertFields }
  }
`;

export const RESOLVE_ALERT = gql`
  ${ALERT_FIELDS}
  mutation ResolveAlert($id: ID!) {
    resolveAlert(id: $id) { ...AlertFields }
  }
`;

export const BULK_RESOLVE_ALERTS = gql`
  mutation BulkResolveAlerts($ids: [ID!]!) {
    bulkResolveAlerts(ids: $ids)
  }
`;
