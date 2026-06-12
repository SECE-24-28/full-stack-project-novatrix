"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { ProtectedRoute }       from "@/components/auth/ProtectedRoute";
import { RoleGate }             from "@/components/auth/RoleGate";
import { PurchaseOrderTable }   from "@/components/purchaseOrders/PurchaseOrderTable";
import { SalesOrderTable }      from "@/components/salesOrders/SalesOrderTable";
import { PurchaseOrderFilters } from "@/components/purchaseOrders/PurchaseOrderFilters";
import { SalesOrderFilters }    from "@/components/salesOrders/SalesOrderFilters";
import { Button }               from "@/components/ui/Button";
import { ErrorMessage }         from "@/components/ui/Feedback";
import { GET_PURCHASE_ORDERS }  from "@/lib/graphql/operations/purchaseOrder";
import { GET_SALES_ORDERS }     from "@/lib/graphql/operations/salesOrder";
import type { PurchaseOrdersFilterInput } from "@/types/purchaseOrder";
import type { SalesOrdersFilterInput }    from "@/types/salesOrder";

export default function OrdersPage() {
  return (
    <ProtectedRoute permission="read:orders">
      <OrdersContent />
    </ProtectedRoute>
  );
}

function OrdersContent() {
  const [tab,      setTab]      = useState<"purchase" | "sales">("purchase");
  const [poFilter, setPOFilter] = useState<PurchaseOrdersFilterInput>({});
  const [soFilter, setSOFilter] = useState<SalesOrdersFilterInput>({});
  const [poPage,   setPOPage]   = useState(1);
  const [soPage,   setSOPage]   = useState(1);

  const { data: poData, loading: poLoading, error: poError } = useQuery(GET_PURCHASE_ORDERS, {
    variables:   { filter: poFilter, pagination: { page: poPage, limit: 20 } },
    skip:        tab !== "purchase",
    fetchPolicy: "cache-and-network",
  });

  const { data: soData, loading: soLoading, error: soError } = useQuery(GET_SALES_ORDERS, {
    variables:   { filter: soFilter, pagination: { page: soPage, limit: 20 } },
    skip:        tab !== "sales",
    fetchPolicy: "cache-and-network",
  });

  const poTotal = poData?.purchaseOrders?.pageInfo.totalCount ?? 0;
  const soTotal = soData?.salesOrders?.pageInfo.totalCount    ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="mt-1 text-sm text-gray-500">Manage purchase and sales orders</p>
        </div>
        <div className="flex gap-2">
          <RoleGate permission="create:orders">
            <Link href="/purchase-orders/new">
              <Button variant="outline" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New PO
              </Button>
            </Link>
            <Link href="/sales-orders/new">
              <Button size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New SO
              </Button>
            </Link>
          </RoleGate>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setTab("purchase")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "purchase"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Purchase Orders
            {poTotal > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {poTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("sales")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "sales"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Sales Orders
            {soTotal > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {soTotal}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Purchase Orders Tab */}
      {tab === "purchase" && (
        <div className="space-y-4">
          <PurchaseOrderFilters
            filter={poFilter}
            onChange={(f) => { setPOFilter(f); setPOPage(1); }}
            onReset={() => { setPOFilter({}); setPOPage(1); }}
          />
          {poError ? (
            <ErrorMessage message={poError.message} />
          ) : (
            <PurchaseOrderTable
              data={poData?.purchaseOrders}
              loading={poLoading}
              onPageChange={setPOPage}
            />
          )}
        </div>
      )}

      {/* Sales Orders Tab */}
      {tab === "sales" && (
        <div className="space-y-4">
          <SalesOrderFilters
            filter={soFilter}
            onChange={(f) => { setSOFilter(f); setSOPage(1); }}
            onReset={() => { setSOFilter({}); setSOPage(1); }}
          />
          {soError ? (
            <ErrorMessage message={soError.message} />
          ) : (
            <SalesOrderTable
              data={soData?.salesOrders}
              loading={soLoading}
              onPageChange={setSOPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
