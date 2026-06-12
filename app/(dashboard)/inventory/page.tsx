"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute }      from "@/components/auth/ProtectedRoute";
import { InventoryStats }      from "@/components/inventory/InventoryStats";
import { StockOverviewTable }  from "@/components/inventory/StockOverviewTable";
import { StockOverviewFilters }from "@/components/inventory/StockOverviewTable";
import { TransactionTable }    from "@/components/inventory/TransactionTable";
import { Button }              from "@/components/ui/Button";
import { ErrorMessage }        from "@/components/ui/Feedback";
import {
  INVENTORY_OVERVIEW,
  GET_PRODUCT_STOCK_OVERVIEW,
  GET_INVENTORY_TRANSACTIONS,
} from "@/lib/graphql/operations/inventory";
import type { ProductStockFilterInput } from "@/types/inventory";

const DEFAULT_STOCK_FILTER: ProductStockFilterInput = {};

export default function InventoryPage() {
  return (
    <ProtectedRoute permission="read:inventory">
      <InventoryDashboard />
    </ProtectedRoute>
  );
}

function InventoryDashboard() {
  const [tab,         setTab]         = useState<"stock" | "recent">("stock");
  const [stockFilter, setStockFilter] = useState<ProductStockFilterInput>(DEFAULT_STOCK_FILTER);
  const [stockPage,   setStockPage]   = useState(1);

  const { data: overviewData, loading: overviewLoading } = useQuery(INVENTORY_OVERVIEW, {
    fetchPolicy: "cache-and-network",
  });

  const { data: stockData, loading: stockLoading, error: stockError } = useQuery(
    GET_PRODUCT_STOCK_OVERVIEW,
    {
      variables:   { filter: stockFilter, pagination: { page: stockPage, limit: 20 } },
      skip:        tab !== "stock",
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: txnData, loading: txnLoading, error: txnError } = useQuery(
    GET_INVENTORY_TRANSACTIONS,
    {
      variables:   { pagination: { page: 1, limit: 10 } },
      skip:        tab !== "recent",
      fetchPolicy: "cache-and-network",
    }
  );

  function handleStockFilterChange(f: ProductStockFilterInput) {
    setStockFilter(f);
    setStockPage(1);
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="mt-1 text-sm text-gray-500">Real-time stock levels across all warehouses</p>
        </div>
        <Link href="/inventory/transactions">
          <Button variant="outline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Full transaction history
          </Button>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <InventoryStats data={overviewData?.inventoryOverview} loading={overviewLoading} />

      {/* ── Tab switcher ── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(["stock", "recent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "stock" ? "Product stock" : "Recent movements"}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Stock tab ── */}
      {tab === "stock" && (
        <div className="space-y-4">
          <StockOverviewFilters
            filter={stockFilter}
            onChange={handleStockFilterChange}
            onReset={() => { setStockFilter(DEFAULT_STOCK_FILTER); setStockPage(1); }}
          />
          {stockError ? (
            <ErrorMessage message={stockError.message} />
          ) : (
            <StockOverviewTable
              data={stockData?.productStockOverview}
              loading={stockLoading}
              onPageChange={setStockPage}
            />
          )}
        </div>
      )}

      {/* ── Recent movements tab ── */}
      {tab === "recent" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Last 10 stock movements</p>
            <Link href="/inventory/transactions">
              <Button variant="ghost" size="sm">View all →</Button>
            </Link>
          </div>
          {txnError ? (
            <ErrorMessage message={txnError.message} />
          ) : (
            <TransactionTable
              data={txnData?.inventoryTransactions}
              loading={txnLoading}
              onPageChange={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}
