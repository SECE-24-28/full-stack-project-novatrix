import type { TransactionType } from "@prisma/client";

export type { TransactionType };

export interface InventoryOverview {
  totalProducts:   number;
  totalUnits:      number;
  totalWarehouses: number;
  lowStockCount:   number;
  outOfStockCount: number;
  incomingUnits:   number;
  outgoingUnits:   number;
}

export interface StockByWarehouse {
  warehouseId:   string;
  warehouseName: string;
  warehouseCode: string;
  quantity:      number;
  reservedQty:   number;
  availableQty:  number;
}

export interface ProductStockOverview {
  productId:        string;
  sku:              string;
  name:             string;
  unitOfMeasure:    string;
  reorderPoint:     number;
  status:           string;
  totalQuantity:    number;
  totalReserved:    number;
  totalAvailable:   number;
  stockByWarehouse: StockByWarehouse[];
}

export interface ProductStockConnection {
  nodes: ProductStockOverview[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface TxnProduct   { id: string; sku: string; name: string; }
export interface TxnWarehouse { id: string; name: string; code: string; }
export interface TxnPerformedBy { id: string; firstName: string; lastName: string; }

export interface InventoryTransaction {
  id:              string;
  type:            TransactionType;
  quantity:        number;
  quantityBefore:  number;
  quantityAfter:   number;
  unitCost:        string | null;
  reference:       string | null;
  notes:           string | null;
  product:         TxnProduct;
  sourceWarehouse: TxnWarehouse | null;
  destWarehouse:   TxnWarehouse | null;
  performedBy:     TxnPerformedBy;
  createdAt:       string;
}

export interface InventoryTransactionConnection {
  nodes: InventoryTransaction[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface InventoryTransactionsFilterInput {
  productId?:   string;
  warehouseId?: string;
  type?:        TransactionType;
  dateFrom?:    string;
  dateTo?:      string;
  search?:      string;
}

export interface ProductStockFilterInput {
  search?:      string;
  warehouseId?: string;
  lowStock?:    boolean;
  outOfStock?:  boolean;
}
