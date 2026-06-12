import type { ProductStatus } from "@prisma/client";

// ─── Core ─────────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id:          string;
  name:        string;
  description: string | null;
  parentId:    string | null;
  parent:      Pick<ProductCategory, "id" | "name"> | null;
  _count:      { products: number };
  createdAt:   string;
  updatedAt:   string;
}

export interface ProductSupplier {
  id:   string;
  name: string;
  code: string;
}

export interface ProductStockSummary {
  totalQuantity:   number;
  reservedQty:     number;
  availableQty:    number;
}

export interface Product {
  id:              string;
  sku:             string;
  name:            string;
  description:     string | null;
  category:        ProductCategory;
  supplier:        ProductSupplier | null;
  unitOfMeasure:   string;
  costPrice:       string;   // Decimal serialised as string from GraphQL
  sellingPrice:    string;
  reorderPoint:    number;
  reorderQuantity: number;
  weight:          string | null;
  barcode:         string | null;
  imageUrl:        string | null;
  status:          ProductStatus;
  stockSummary:    ProductStockSummary;
  createdAt:       string;
  updatedAt:       string;
}

export interface ProductConnection {
  nodes:    Product[];
  pageInfo: {
    totalCount:      number;
    totalPages:      number;
    currentPage:     number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

// ─── Form / Input ─────────────────────────────────────────────────────────────

export interface CreateProductInput {
  sku:             string;
  name:            string;
  description?:    string;
  categoryId:      string;
  supplierId?:     string;
  unitOfMeasure:   string;
  costPrice:       number;
  sellingPrice:    number;
  reorderPoint:    number;
  reorderQuantity: number;
  weight?:         number;
  barcode?:        string;
  imageUrl?:       string;
  status?:         ProductStatus;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductsFilterInput {
  search?:     string;
  categoryId?: string;
  status?:     ProductStatus;
  supplierId?: string;
}

export interface CreateCategoryInput {
  name:         string;
  description?: string;
  parentId?:    string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}
