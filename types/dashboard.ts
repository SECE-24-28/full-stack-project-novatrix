export interface DashboardStats {
  totalProducts:       number;
  totalWarehouses:     number;
  totalSuppliers:      number;
  totalPurchaseOrders: number;
  totalSalesOrders:    number;
  lowStockProducts:    number;
  openAlerts:          number;
  totalInventoryUnits: number;
}

export interface MonthlySalesPoint {
  month:       string;
  year:        number;
  salesOrders: number;
  revenue:     string;
}

export interface InventoryTrendPoint {
  month:    string;
  year:     number;
  incoming: number;
  outgoing: number;
  net:      number;
}

export interface CategoryDistributionItem {
  categoryId:   string;
  categoryName: string;
  productCount: number;
}

export interface WarehouseUtilizationItem {
  warehouseId:   string;
  warehouseName: string;
  warehouseCode: string;
  capacity:      number | null;
  usedUnits:     number;
  utilisationPct:number;
}

export interface RecentOrder {
  id:          string;
  number:      string;
  type:        "PO" | "SO";
  status:      string;
  party:       string;
  totalAmount: string;
  date:        string;
}

export interface LowStockProduct {
  productId:    string;
  sku:          string;
  name:         string;
  totalQuantity:number;
  reorderPoint: number;
  deficit:      number;
}

export interface DashboardData {
  stats:                DashboardStats;
  monthlySales:         MonthlySalesPoint[];
  inventoryTrend:       InventoryTrendPoint[];
  categoryDistribution: CategoryDistributionItem[];
  warehouseUtilization: WarehouseUtilizationItem[];
  recentOrders:         RecentOrder[];
  lowStockProducts:     LowStockProduct[];
}
