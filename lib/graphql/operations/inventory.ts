import { gql } from "@apollo/client";

export const INVENTORY_OVERVIEW = gql`
  query InventoryOverview {
    inventoryOverview {
      totalProducts
      totalUnits
      totalWarehouses
      lowStockCount
      outOfStockCount
      incomingUnits
      outgoingUnits
    }
  }
`;

export const TXN_FIELDS = gql`
  fragment TxnFields on InventoryTransaction {
    id type quantity quantityBefore quantityAfter unitCost reference notes createdAt
    product         { id sku name }
    sourceWarehouse { id name code }
    destWarehouse   { id name code }
    performedBy     { id firstName lastName }
  }
`;

export const GET_INVENTORY_TRANSACTIONS = gql`
  ${TXN_FIELDS}
  query GetInventoryTransactions(
    $filter:     InventoryTransactionsFilterInput
    $pagination: PaginationInput
  ) {
    inventoryTransactions(filter: $filter, pagination: $pagination) {
      nodes    { ...TxnFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const STOCK_OVERVIEW_FIELDS = gql`
  fragment StockOverviewFields on ProductStockOverview {
    productId sku name unitOfMeasure reorderPoint status
    totalQuantity totalReserved totalAvailable
    stockByWarehouse {
      warehouseId warehouseName warehouseCode
      quantity reservedQty availableQty
    }
  }
`;

export const GET_PRODUCT_STOCK_OVERVIEW = gql`
  ${STOCK_OVERVIEW_FIELDS}
  query GetProductStockOverview(
    $filter:     ProductStockFilterInput
    $pagination: PaginationInput
  ) {
    productStockOverview(filter: $filter, pagination: $pagination) {
      nodes    { ...StockOverviewFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;
