import type { SalesOrderStatus } from "@prisma/client";

export type { SalesOrderStatus };

export interface SOWarehouse { id: string; name: string; code: string; }
export interface SOProduct   { id: string; sku: string; name: string; unitOfMeasure: string; }

export interface SalesOrderItem {
  id:          string;
  product:     SOProduct;
  orderedQty:  number;
  shippedQty:  number;
  unitPrice:   string;
  discountPct: string;
  totalPrice:  string;
}

export interface SalesOrder {
  id:              string;
  soNumber:        string;
  warehouse:       SOWarehouse;
  status:          SalesOrderStatus;
  customerName:    string;
  customerEmail:   string | null;
  customerPhone:   string | null;
  shippingAddress: string | null;
  orderDate:       string;
  requiredDate:    string | null;
  shippedDate:     string | null;
  deliveredDate:   string | null;
  subtotal:        string;
  taxAmount:       string;
  discountAmount:  string;
  totalAmount:     string;
  notes:           string | null;
  items:           SalesOrderItem[];
  createdAt:       string;
  updatedAt:       string;
}

export interface SalesOrderConnection {
  nodes:    SalesOrder[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface SalesOrdersFilterInput {
  search?:     string;
  status?:     SalesOrderStatus;
  warehouseId?: string;
}

export interface SOItemInput {
  productId:   string;
  orderedQty:  number;
  unitPrice:   number;
  discountPct: number;
}

export interface CreateSalesOrderInput {
  warehouseId:     string;
  customerName:    string;
  customerEmail?:  string;
  customerPhone?:  string;
  shippingAddress?: string;
  requiredDate?:   string;
  notes?:          string;
  items:           SOItemInput[];
}
