export interface ReportFilters {
  search?:     string;
  dateFrom?:   string;
  dateTo?:     string;
  status?:     string;
  warehouseId?:string;
  supplierId?: string;
  categoryId?: string;
}

// ── Inventory Report ──────────────────────────────────────────────────────────
export interface InventoryReportRow {
  productId:     string;
  sku:           string;
  name:          string;
  category:      string;
  supplier:      string;
  warehouseName: string;
  warehouseCode: string;
  quantity:      number;
  reservedQty:   number;
  availableQty:  number;
  reorderPoint:  number;
  costPrice:     string;
  sellingPrice:  string;
  stockValue:    string;
  status:        string;
}

export interface InventoryReportResult {
  rows:          InventoryReportRow[];
  totalRows:     number;
  totalValue:    string;
  lowStockCount: number;
  outOfStockCount:number;
}

// ── Sales Report ──────────────────────────────────────────────────────────────
export interface SalesReportRow {
  orderId:       string;
  soNumber:      string;
  customerName:  string;
  warehouse:     string;
  status:        string;
  orderDate:     string;
  deliveredDate: string | null;
  subtotal:      string;
  taxAmount:     string;
  discountAmount:string;
  totalAmount:   string;
  itemCount:     number;
}

export interface SalesReportResult {
  rows:         SalesReportRow[];
  totalRows:    number;
  totalRevenue: string;
  totalTax:     string;
  totalDiscount:string;
  orderCount:   number;
}

// ── Supplier Report ───────────────────────────────────────────────────────────
export interface SupplierReportRow {
  supplierId:    string;
  name:          string;
  code:          string;
  contactName:   string;
  email:         string;
  phone:         string;
  country:       string;
  status:        string;
  paymentTerms:  number;
  totalOrders:   number;
  totalSpend:    string;
  lastOrderDate: string | null;
  productCount:  number;
}

export interface SupplierReportResult {
  rows:          SupplierReportRow[];
  totalRows:     number;
  totalSpend:    string;
  activeCount:   number;
}

// ── Warehouse Report ──────────────────────────────────────────────────────────
export interface WarehouseReportRow {
  warehouseId:    string;
  name:           string;
  code:           string;
  city:           string;
  country:        string;
  status:         string;
  capacity:       number | null;
  usedUnits:      number;
  utilisationPct: number;
  totalProducts:  number;
  stockValue:     string;
  zoneCount:      number;
  inboundOrders:  number;
  outboundOrders: number;
}

export interface WarehouseReportResult {
  rows:       WarehouseReportRow[];
  totalRows:  number;
  totalStock: number;
  avgUtil:    number;
}
