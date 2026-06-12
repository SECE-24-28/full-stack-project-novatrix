import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────────────────────

export const ZONE_FIELDS = gql`
  fragment ZoneFields on WarehouseZone {
    id warehouseId name code description stockCount createdAt updatedAt
  }
`;

export const WAREHOUSE_SUMMARY_FIELDS = gql`
  fragment WarehouseSummaryFields on Warehouse {
    id name code city country status capacity createdAt updatedAt
    capacityStats { totalCapacity usedCapacity availableCapacity utilisationPct }
    summary       { totalProducts totalUnits lowStockCount zoneCount }
    zones         { id name code }
  }
`;

export const WAREHOUSE_DETAIL_FIELDS = gql`
  ${ZONE_FIELDS}
  fragment WarehouseDetailFields on Warehouse {
    id name code address city country phone email managerId status capacity createdAt updatedAt
    capacityStats { totalCapacity usedCapacity availableCapacity utilisationPct }
    summary       { totalProducts totalUnits lowStockCount zoneCount }
    zones         { ...ZoneFields }
  }
`;

export const STOCK_ITEM_FIELDS = gql`
  fragment StockItemFields on WarehouseStockItem {
    id quantity reservedQty availableQty updatedAt
    product {
      id sku name unitOfMeasure reorderPoint status
      category { id name }
    }
    zone { id name code }
  }
`;

// ─── Warehouse queries ────────────────────────────────────────────────────────

export const GET_WAREHOUSES = gql`
  ${WAREHOUSE_SUMMARY_FIELDS}
  query GetWarehouses($filter: WarehousesFilterInput, $pagination: PaginationInput) {
    warehouses(filter: $filter, pagination: $pagination) {
      nodes    { ...WarehouseSummaryFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_WAREHOUSE = gql`
  ${WAREHOUSE_DETAIL_FIELDS}
  query GetWarehouse($id: ID!) {
    warehouse(id: $id) { ...WarehouseDetailFields }
  }
`;

export const GET_WAREHOUSE_ZONES = gql`
  ${ZONE_FIELDS}
  query GetWarehouseZones($warehouseId: ID!) {
    warehouseZones(warehouseId: $warehouseId) { ...ZoneFields }
  }
`;

export const GET_WAREHOUSE_STOCK = gql`
  ${STOCK_ITEM_FIELDS}
  query GetWarehouseStock(
    $warehouseId: ID!
    $filter:      WarehouseStockFilterInput
    $pagination:  PaginationInput
  ) {
    warehouseStock(warehouseId: $warehouseId, filter: $filter, pagination: $pagination) {
      nodes    { ...StockItemFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

// ─── Warehouse mutations ──────────────────────────────────────────────────────

export const CREATE_WAREHOUSE = gql`
  ${WAREHOUSE_DETAIL_FIELDS}
  mutation CreateWarehouse($input: CreateWarehouseInput!) {
    createWarehouse(input: $input) { ...WarehouseDetailFields }
  }
`;

export const UPDATE_WAREHOUSE = gql`
  ${WAREHOUSE_DETAIL_FIELDS}
  mutation UpdateWarehouse($input: UpdateWarehouseInput!) {
    updateWarehouse(input: $input) { ...WarehouseDetailFields }
  }
`;

export const DELETE_WAREHOUSE = gql`
  mutation DeleteWarehouse($id: ID!) {
    deleteWarehouse(id: $id)
  }
`;

// ─── Zone mutations ───────────────────────────────────────────────────────────

export const CREATE_ZONE = gql`
  ${ZONE_FIELDS}
  mutation CreateZone($input: CreateZoneInput!) {
    createZone(input: $input) { ...ZoneFields }
  }
`;

export const UPDATE_ZONE = gql`
  ${ZONE_FIELDS}
  mutation UpdateZone($input: UpdateZoneInput!) {
    updateZone(input: $input) { ...ZoneFields }
  }
`;

export const DELETE_ZONE = gql`
  mutation DeleteZone($id: ID!) {
    deleteZone(id: $id)
  }
`;

// ─── Stock mutations ──────────────────────────────────────────────────────────

export const ASSIGN_STOCK = gql`
  ${STOCK_ITEM_FIELDS}
  mutation AssignStock($input: AssignStockInput!) {
    assignStock(input: $input) { ...StockItemFields }
  }
`;

export const ADJUST_STOCK = gql`
  ${STOCK_ITEM_FIELDS}
  mutation AdjustStock($input: AdjustStockInput!) {
    adjustStock(input: $input) { ...StockItemFields }
  }
`;

export const REMOVE_STOCK = gql`
  mutation RemoveStock($stockId: ID!) {
    removeStock(stockId: $stockId)
  }
`;
