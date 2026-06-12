import type { PurchaseOrderStatus } from "@prisma/client";

export type { PurchaseOrderStatus };

export interface POSupplier  { id: string; name: string; code: string; }
export interface POWarehouse { id: string; name: string; code: string; }
export interface POProduct   { id: string; sku: string; name: string; unitOfMeasure: string; }

export interface PurchaseOrderItem {
  id:          string;
  product:     POProduct;
  orderedQty:  number;
  receivedQty: number;
  unitCost:    string;
  totalCost:   string;
}

export interface PurchaseOrder {
  id:           string;
  poNumber:     string;
  supplier:     POSupplier;
  warehouse:    POWarehouse;
  status:       PurchaseOrderStatus;
  orderDate:    string;
  expectedDate: string | null;
  receivedDate: string | null;
  subtotal:     string;
  taxAmount:    string;
  totalAmount:  string;
  notes:        string | null;
  items:        PurchaseOrderItem[];
  createdAt:    string;
  updatedAt:    string;
}

export interface PurchaseOrderConnection {
  nodes:    PurchaseOrder[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface PurchaseOrdersFilterInput {
  search?:     string;
  status?:     PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
}

export interface POItemInput {
  productId:  string;
  orderedQty: number;
  unitCost:   number;
}

export interface CreatePurchaseOrderInput {
  supplierId:   string;
  warehouseId:  string;
  expectedDate?: string;
  notes?:        string;
  items:         POItemInput[];
}
