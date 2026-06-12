import type { WarehouseStatus } from "@prisma/client";

// ─── Core types ───────────────────────────────────────────────────────────────

export interface WarehouseZone {
  id:          string;
  warehouseId: string;
  name:        string;
  code:        string;
  description: string | null;
  stockCount:  number;
  createdAt:   string;
  updatedAt:   string;
}

export interface WarehouseStockItem {
  id:          string;
  quantity:    number;
  reservedQty: number;
  availableQty: number;
  product: {
    id:           string;
    sku:          string;
    name:         string;
    unitOfMeasure: string;
    reorderPoint:  number;
    status:        string;
    category: { id: string; name: string };
  };
  zone: Pick<WarehouseZone, "id" | "name" | "code"> | null;
  updatedAt: string;
}

export interface WarehouseCapacityStats {
  totalCapacity:     number | null;
  usedCapacity:      number;
  availableCapacity: number | null;
  utilisationPct:    number | null;
}

export interface WarehouseSummary {
  totalProducts: number;
  totalUnits:    number;
  lowStockCount: number;
  zoneCount:     number;
}

export interface Warehouse {
  id:        string;
  name:      string;
  code:      string;
  address:   string | null;
  city:      string | null;
  country:   string | null;
  phone:     string | null;
  email:     string | null;
  managerId: string | null;
  capacity:  number | null;
  status:    WarehouseStatus;
  capacityStats: WarehouseCapacityStats;
  summary:       WarehouseSummary;
  zones:         WarehouseZone[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseListItem
  extends Omit<Warehouse, "zones"> {
  zones: Pick<WarehouseZone, "id" | "name" | "code">[];
}

export interface WarehouseConnection {
  nodes:    WarehouseListItem[];
  pageInfo: PageInfo;
}

export interface WarehouseStockConnection {
  nodes:    WarehouseStockItem[];
  pageInfo: PageInfo;
}

interface PageInfo {
  totalCount:      number;
  totalPages:      number;
  currentPage:     number;
  hasNextPage:     boolean;
  hasPreviousPage: boolean;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface WarehousesFilterInput {
  search?:  string;
  status?:  WarehouseStatus;
  city?:    string;
  country?: string;
}

export interface CreateWarehouseInput {
  name:      string;
  code:      string;
  address?:  string;
  city?:     string;
  country?:  string;
  phone?:    string;
  email?:    string;
  managerId?: string;
  capacity?: number;
  status?:   WarehouseStatus;
}

export interface UpdateWarehouseInput extends Partial<Omit<CreateWarehouseInput, "code">> {
  id:    string;
  code?: string;
}

export interface CreateZoneInput {
  warehouseId: string;
  name:        string;
  code:        string;
  description?: string;
}

export interface UpdateZoneInput {
  id:           string;
  name?:        string;
  code?:        string;
  description?: string;
}

export interface AssignStockInput {
  productId:   string;
  warehouseId: string;
  zoneId?:     string;
  quantity:    number;
}

export interface AdjustStockInput {
  stockId:  string;
  quantity: number;
  notes?:   string;
}
