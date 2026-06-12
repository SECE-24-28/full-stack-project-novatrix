"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute }            from "@/components/auth/ProtectedRoute";
import { StatCard, StatCardSkeleton }from "@/components/dashboard/StatCard";
import { ChartCard, ChartCardSkeleton } from "@/components/dashboard/ChartCard";
import { MonthlySalesChart }         from "@/components/dashboard/MonthlySalesChart";
import { InventoryTrendChart }       from "@/components/dashboard/InventoryTrendChart";
import { CategoryDonutChart }        from "@/components/dashboard/CategoryDonutChart";
import { WarehouseUtilizationChart } from "@/components/dashboard/WarehouseUtilizationChart";
import { LowStockTable }             from "@/components/dashboard/LowStockTable";
import { RecentOrdersTable }         from "@/components/dashboard/RecentOrdersTable";
import { ErrorMessage }              from "@/components/ui/Feedback";
import { GET_DASHBOARD_DATA }        from "@/lib/graphql/operations/dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_DATA, {
    fetchPolicy: "cache-and-network",
  });

  if (error) return <ErrorMessage message={error.message} />;

  const d = data?.dashboardData;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── KPI stat cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !d ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Active products"
              value={d.stats.totalProducts}
              href="/products"
              accent="blue"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            />
            <StatCard
              label="Warehouses"
              value={d.stats.totalWarehouses}
              href="/warehouses"
              accent="teal"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <StatCard
              label="Suppliers"
              value={d.stats.totalSuppliers}
              href="/suppliers"
              accent="violet"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard
              label="Inventory units"
              value={d.stats.totalInventoryUnits.toLocaleString()}
              sub="across all warehouses"
              accent="cyan"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
            <StatCard
              label="Purchase orders"
              value={d.stats.totalPurchaseOrders}
              href="/purchase-orders"
              accent="emerald"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <StatCard
              label="Sales orders"
              value={d.stats.totalSalesOrders}
              href="/sales-orders"
              accent="orange"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            />
            <StatCard
              label="Low stock"
              value={d.stats.lowStockProducts}
              href="/inventory"
              accent="amber"
              alert={d.stats.lowStockProducts > 0}
              sub="products at reorder point"
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
            />
            <StatCard
              label="Open alerts"
              value={d.stats.openAlerts}
              href="/alerts"
              accent="rose"
              alert={d.stats.openAlerts > 0}
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            />
          </>
        )}
      </div>

      {/* ── Row 2: Monthly Sales + Inventory Trend ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {loading || !d ? (
          <>
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </>
        ) : (
          <>
            <ChartCard
              title="Monthly Revenue"
              subtitle="Sales orders — last 12 months"
              action={
                <Link href="/sales-orders" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  View all →
                </Link>
              }
            >
              <MonthlySalesChart data={d.monthlySales} />
            </ChartCard>

            <ChartCard
              title="Inventory Movement"
              subtitle="Incoming vs outgoing units — last 12 months"
              action={
                <Link href="/inventory/transactions" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  View all →
                </Link>
              }
            >
              <InventoryTrendChart data={d.inventoryTrend} />
            </ChartCard>
          </>
        )}
      </div>

      {/* ── Row 3: Category Donut + Warehouse Utilization ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading || !d ? (
          <>
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Product Distribution" subtitle="Products by category">
              <CategoryDonutChart data={d.categoryDistribution} />
            </ChartCard>

            <ChartCard title="Warehouse Utilization" subtitle="Used capacity by warehouse">
              <WarehouseUtilizationChart data={d.warehouseUtilization} />
            </ChartCard>
          </>
        )}
      </div>

      {/* ── Row 4: Recent orders + Low stock ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading || !d ? (
          <>
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Recent Orders" subtitle="Latest purchase & sales orders">
              <RecentOrdersTable data={d.recentOrders} />
            </ChartCard>

            <ChartCard
              title="Low Stock Products"
              subtitle="Products at or below reorder point"
              action={
                d.stats.lowStockProducts > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {d.stats.lowStockProducts} item{d.stats.lowStockProducts !== 1 ? "s" : ""}
                  </span>
                ) : undefined
              }
            >
              <LowStockTable data={d.lowStockProducts} />
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}
