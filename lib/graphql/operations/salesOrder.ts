import { gql } from "@apollo/client";

export const SO_ITEM_FIELDS = gql`
  fragment SOItemFields on SalesOrderItem {
    id orderedQty shippedQty unitPrice discountPct totalPrice
    product { id sku name unitOfMeasure }
  }
`;

export const SO_FIELDS = gql`
  fragment SOFields on SalesOrder {
    id soNumber status orderDate requiredDate shippedDate deliveredDate
    customerName customerEmail customerPhone shippingAddress
    subtotal taxAmount discountAmount totalAmount notes createdAt updatedAt
    warehouse { id name code }
    items     { id }
  }
`;

export const SO_DETAIL_FIELDS = gql`
  ${SO_ITEM_FIELDS}
  fragment SODetailFields on SalesOrder {
    id soNumber status orderDate requiredDate shippedDate deliveredDate
    customerName customerEmail customerPhone shippingAddress
    subtotal taxAmount discountAmount totalAmount notes createdAt updatedAt
    warehouse { id name code }
    items { ...SOItemFields }
  }
`;

export const GET_SALES_ORDERS = gql`
  ${SO_FIELDS}
  query GetSalesOrders($filter: SalesOrdersFilterInput, $pagination: PaginationInput) {
    salesOrders(filter: $filter, pagination: $pagination) {
      nodes    { ...SOFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_SALES_ORDER = gql`
  ${SO_DETAIL_FIELDS}
  query GetSalesOrder($id: ID!) {
    salesOrder(id: $id) { ...SODetailFields }
  }
`;

export const CREATE_SALES_ORDER = gql`
  ${SO_DETAIL_FIELDS}
  mutation CreateSalesOrder($input: CreateSalesOrderInput!) {
    createSalesOrder(input: $input) { ...SODetailFields }
  }
`;

export const PROCESS_SALES_ORDER = gql`
  ${SO_FIELDS}
  mutation ProcessSalesOrder($id: ID!) {
    processSalesOrder(id: $id) { ...SOFields }
  }
`;

export const SHIP_SALES_ORDER = gql`
  ${SO_DETAIL_FIELDS}
  mutation ShipSalesOrder($id: ID!) {
    shipSalesOrder(id: $id) { ...SODetailFields }
  }
`;

export const DELIVER_SALES_ORDER = gql`
  ${SO_FIELDS}
  mutation DeliverSalesOrder($id: ID!) {
    deliverSalesOrder(id: $id) { ...SOFields }
  }
`;

export const CANCEL_SALES_ORDER = gql`
  ${SO_FIELDS}
  mutation CancelSalesOrder($id: ID!) {
    cancelSalesOrder(id: $id) { ...SOFields }
  }
`;
