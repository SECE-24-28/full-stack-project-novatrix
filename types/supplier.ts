import type { SupplierStatus } from "@prisma/client";

export interface PurchaseOrderSummary {
  id:          string;
  poNumber:    string;
  status:      string;
  totalAmount: string;
  orderDate:   string;
}

export interface Supplier {
  id:             string;
  code:           string;
  name:           string;
  contactName:    string | null;
  email:          string | null;
  phone:          string | null;
  address:        string | null;
  city:           string | null;
  country:        string | null;
  gstNumber:      string | null;
  status:         SupplierStatus;
  paymentTerms:   number;
  notes:          string | null;
  productCount:   number;
  purchaseHistory: PurchaseOrderSummary[];
  createdAt:      string;
  updatedAt:      string;
}

export interface SupplierConnection {
  nodes:    Supplier[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface SuppliersFilterInput {
  search?: string;
  status?: SupplierStatus;
}

export interface CreateSupplierInput {
  name:          string;
  code:          string;
  contactName?:  string;
  email?:        string;
  phone?:        string;
  address?:      string;
  city?:         string;
  country?:      string;
  gstNumber?:    string;
  status?:       SupplierStatus;
  paymentTerms?: number;
  notes?:        string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  id: string;
}
