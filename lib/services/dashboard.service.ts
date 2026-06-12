import type { PrismaClient } from "@prisma/client";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(date: Date) { return MONTHS[date.getMonth()]!; }
function monthKey(y: number, m: number) { return `${y}-${String(m + 1).padStart(2, "0")}`; }

export const dashboardService = {
  async getDashboardData(prisma: PrismaClient) {
    const now    = new Date();
    const m12ago = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ── Parallel top-level counts ──────────────────────────────────────────────
    const [
      totalProducts,
      totalWarehouses,
      totalSuppliers,
      totalPurchaseOrders,
      totalSalesOrders,
      openAlerts,
      stocks,
      categories,
      warehouses,
      soLast12,
      txnLast12,
      recentPOs,
      recentSOs,
    ] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.warehouse.count({ where: { status: "ACTIVE" } }),
      prisma.supplier.count({ where: { status: "ACTIVE" } }),
      prisma.purchaseOrder.count(),
      prisma.salesOrder.count(),
      prisma.stockAlert.count({ where: { status: "OPEN" } }),

      // All inventory stock for low-stock + utilization
      prisma.inventoryStock.findMany({
        select: {
          quantity:    true,
          warehouseId: true,
          product: { select: { reorderPoint: true } },
        },
      }),

      // Categories with product count
      prisma.category.findMany({
        select: {
          id:       true,
          name:     true,
          _count:   { select: { products: true } },
        },
        orderBy: { products: { _count: "desc" } },
        take:    8,
      }),

      // Warehouses for utilization chart
      prisma.warehouse.findMany({
        where:  { status: "ACTIVE" },
        select: { id: true, name: true, code: true, capacity: true },
        orderBy: { name: "asc" },
        take: 8,
      }),

      // Sales orders last 12 months
      prisma.salesOrder.findMany({
        where:  { orderDate: { gte: m12ago }, status: { not: "CANCELLED" } },
        select: { orderDate: true, totalAmount: true },
      }),

      // Inventory transactions last 12 months
      prisma.inventoryTransaction.findMany({
        where:  { createdAt: { gte: m12ago } },
        select: { createdAt: true, quantity: true, type: true },
      }),

      // Recent purchase orders
      prisma.purchaseOrder.findMany({
        orderBy: { createdAt: "desc" },
        take:    5,
        select: {
          id: true, poNumber: true, status: true, totalAmount: true, orderDate: true,
          supplier: { select: { name: true } },
        },
      }),

      // Recent sales orders
      prisma.salesOrder.findMany({
        orderBy: { createdAt: "desc" },
        take:    5,
        select: {
          id: true, soNumber: true, status: true, totalAmount: true, orderDate: true,
          customerName: true,
        },
      }),
    ]);

    // ── KPI stats ─────────────────────────────────────────────────────────────
    const totalInventoryUnits = stocks.reduce((s, r) => s + r.quantity, 0);
    const lowStockProducts    = stocks.filter(
      (r) => r.quantity > 0 && r.quantity <= r.product.reorderPoint
    ).length;

    // ── Monthly sales (last 12 months) ────────────────────────────────────────
    const salesMap = new Map<string, { count: number; revenue: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      salesMap.set(monthKey(d.getFullYear(), d.getMonth()), { count: 0, revenue: 0 });
    }
    for (const so of soLast12) {
      const d   = new Date(so.orderDate);
      const key = monthKey(d.getFullYear(), d.getMonth());
      const cur = salesMap.get(key);
      if (cur) {
        cur.count++;
        cur.revenue += Number(so.totalAmount);
      }
    }
    const monthlySales = Array.from(salesMap.entries()).map(([key, v]) => {
      const [y, m] = key.split("-").map(Number) as [number, number];
      return {
        month:       MONTHS[m - 1]!,
        year:        y,
        salesOrders: v.count,
        revenue:     v.revenue.toFixed(2),
      };
    });

    // ── Inventory trend (last 12 months) ─────────────────────────────────────
    const INCOMING_TYPES = new Set(["PURCHASE_RECEIPT","TRANSFER_IN","ADJUSTMENT_IN","RETURN_IN"]);
    const trendMap = new Map<string, { incoming: number; outgoing: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trendMap.set(monthKey(d.getFullYear(), d.getMonth()), { incoming: 0, outgoing: 0 });
    }
    for (const txn of txnLast12) {
      const d   = new Date(txn.createdAt);
      const key = monthKey(d.getFullYear(), d.getMonth());
      const cur = trendMap.get(key);
      if (cur) {
        if (INCOMING_TYPES.has(txn.type)) cur.incoming += txn.quantity;
        else                              cur.outgoing += txn.quantity;
      }
    }
    const inventoryTrend = Array.from(trendMap.entries()).map(([key, v]) => {
      const [y, m] = key.split("-").map(Number) as [number, number];
      return {
        month:    MONTHS[m - 1]!,
        year:     y,
        incoming: v.incoming,
        outgoing: v.outgoing,
        net:      v.incoming - v.outgoing,
      };
    });

    // ── Category distribution ─────────────────────────────────────────────────
    const categoryDistribution = categories
      .filter((c) => c._count.products > 0)
      .map((c) => ({
        categoryId:   c.id,
        categoryName: c.name,
        productCount: c._count.products,
      }));

    // ── Warehouse utilization ─────────────────────────────────────────────────
    const warehouseUtilization = await Promise.all(
      warehouses.map(async (wh) => {
        const usedUnits = stocks
          .filter((s) => s.warehouseId === wh.id)
          .reduce((s, r) => s + r.quantity, 0);
        const utilisationPct = wh.capacity
          ? Math.min(Math.round((usedUnits / wh.capacity) * 1000) / 10, 100)
          : 0;
        return {
          warehouseId:   wh.id,
          warehouseName: wh.name,
          warehouseCode: wh.code,
          capacity:      wh.capacity,
          usedUnits,
          utilisationPct,
        };
      })
    );

    // ── Recent orders (PO + SO merged, sorted by date desc) ──────────────────
    const recentOrders = [
      ...recentPOs.map((po) => ({
        id:          po.id,
        number:      po.poNumber,
        type:        "PO",
        status:      po.status,
        party:       po.supplier.name,
        totalAmount: po.totalAmount.toString(),
        date:        po.orderDate,
      })),
      ...recentSOs.map((so) => ({
        id:          so.id,
        number:      so.soNumber,
        type:        "SO",
        status:      so.status,
        party:       so.customerName,
        totalAmount: so.totalAmount.toString(),
        date:        so.orderDate,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    // ── Low stock products ────────────────────────────────────────────────────
    const productStocks = await prisma.inventoryStock.findMany({
      where: {
        quantity: { gt: 0 },
        product:  { reorderPoint: { gt: 0 }, status: "ACTIVE" },
      },
      select: {
        quantity:  true,
        productId: true,
        product: { select: { sku: true, name: true, reorderPoint: true } },
      },
    });

    // Aggregate by product
    const productQtyMap = new Map<string, { sku: string; name: string; reorderPoint: number; qty: number }>();
    for (const s of productStocks) {
      const cur = productQtyMap.get(s.productId);
      if (cur) cur.qty += s.quantity;
      else productQtyMap.set(s.productId, {
        sku:          s.product.sku,
        name:         s.product.name,
        reorderPoint: s.product.reorderPoint,
        qty:          s.quantity,
      });
    }

    const lowStockList = Array.from(productQtyMap.entries())
      .filter(([, v]) => v.qty <= v.reorderPoint)
      .sort((a, b) => (a[1].qty / a[1].reorderPoint) - (b[1].qty / b[1].reorderPoint))
      .slice(0, 10)
      .map(([productId, v]) => ({
        productId,
        sku:          v.sku,
        name:         v.name,
        totalQuantity:v.qty,
        reorderPoint: v.reorderPoint,
        deficit:      v.reorderPoint - v.qty,
      }));

    return {
      stats: {
        totalProducts,
        totalWarehouses,
        totalSuppliers,
        totalPurchaseOrders,
        totalSalesOrders,
        lowStockProducts,
        openAlerts,
        totalInventoryUnits,
      },
      monthlySales,
      inventoryTrend,
      categoryDistribution,
      warehouseUtilization,
      recentOrders,
      lowStockProducts: lowStockList,
    };
  },
};
