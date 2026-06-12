import { gql } from "@apollo/client";

export const PO_ITEM_FIELDS = gql`
  fragment POItemFields on PurchaseOrderItem {
    id orderedQty receivedQty unitCost totalCost
    product { id sku name unitOfMeasure }
  }
`;

export const PO_FIELDS = gql`
  fragment POFields on PurchaseOrder {
    id poNumber status orderDate expectedDate receivedDate
    subtotal taxAmount totalAmount notes createdAt updatedAt
    supplier  { id name code }
    warehouse { id name code }
    items     { id }
  }
`;

export const PO_DETAIL_FIELDS = gql`
  ${PO_ITEM_FIELDS}
  fragment PODetailFields on PurchaseOrder {
    id poNumber status orderDate expectedDate receivedDate
    subtotal taxAmount totalAmount notes createdAt updatedAt
    supplier  { id name code }
    warehouse { id name code }
    items { ...POItemFields }
  }
`;

export const GET_PURCHASE_ORDERS = gql`
  ${PO_FIELDS}
  query GetPurchaseOrders($filter: PurchaseOrdersFilterInput, $pagination: PaginationInput) {
    purchaseOrders(filter: $filter, pagination: $pagination) {
      nodes    { ...POFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_PURCHASE_ORDER = gql`
  ${PO_DETAIL_FIELDS}
  query GetPurchaseOrder($id: ID!) {
    purchaseOrder(id: $id) { ...PODetailFields }
  }
`;

export const CREATE_PURCHASE_ORDER = gql`
  ${PO_DETAIL_FIELDS}
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(input: $input) { ...PODetailFields }
  }
`;

export const APPROVE_PURCHASE_ORDER = gql`
  ${PO_FIELDS}
  mutation ApprovePurchaseOrder($id: ID!) {
    approvePurchaseOrder(id: $id) { ...POFields }
  }
`;

export const CANCEL_PURCHASE_ORDER = gql`
  ${PO_FIELDS}
  mutation CancelPurchaseOrder($id: ID!) {
    cancelPurchaseOrder(id: $id) { ...POFields }
  }
`;

export const RECEIVE_PURCHASE_ORDER = gql`
  ${PO_DETAIL_FIELDS}
  mutation ReceivePurchaseOrder($id: ID!) {
    receivePurchaseOrder(id: $id) { ...PODetailFields }
  }
`;
