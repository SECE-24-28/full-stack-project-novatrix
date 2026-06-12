import type { AlertType, AlertStatus } from "@prisma/client";

export type { AlertType, AlertStatus };

export interface AlertProduct {
  id:           string;
  sku:          string;
  name:         string;
  reorderPoint: number;
}

export interface StockAlert {
  id:              string;
  type:            AlertType;
  status:          AlertStatus;
  product:         AlertProduct;
  warehouseId:     string | null;
  currentQuantity: number;
  threshold:       number | null;
  message:         string | null;
  acknowledgedAt:  string | null;
  resolvedAt:      string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface StockAlertConnection {
  nodes: StockAlert[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface AlertsFilterInput {
  type?:        AlertType;
  status?:      AlertStatus;
  warehouseId?: string;
  search?:      string;
}
