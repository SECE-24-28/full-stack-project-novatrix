"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { ProtectedRoute }       from "@/components/auth/ProtectedRoute";
import { RoleGate }             from "@/components/auth/RoleGate";
import { SalesOrderTable }      from "@/components/salesOrders/SalesOrderTable";
import { SalesOrderFilters }    from "@/components/salesOrders/SalesOrderFilters";
import { Button }               from "@/components/ui/Button";
import { ErrorMessage }         from "@/components/ui/Feedback";
import { GET_SALES_ORDERS }     from "@/lib/graphql/operations/salesOrder";
import type { SalesOrdersFilterInput } from "@/types/salesOrder";

const DEFAULT_FILTER: SalesOrdersFilterInput = {};

export default function SalesOrdersPage() {
  const [filter, setFilter] = useState<SalesOrdersFilterInput>(DEFAULT_FILTER);
  const [page,   setPage]   = useState(1);

  const { data, loading, error } = useQuery(GET_SALES_ORDERS, {
    variables: { filter, pagination: { page, limit: 20 } },
  });

  function handleFilterChange(f: SalesOrdersFilterInput) {
    setFilter(f);
    setPage(1);
  }

  return (
    <ProtectedRoute permission="read:orders">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              {data?.salesOrders?.pageInfo.totalCount ?? 0} orders total
            </p>
          </div>
          <RoleGate permission="create:orders">
            <Link href="/sales-orders/new">
              <Button>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New sales order
              </Button>
            </Link>
          </RoleGate>
        </div>

        <SalesOrderFilters
          filter={filter}
          onChange={handleFilterChange}
          onReset={() => { setFilter(DEFAULT_FILTER); setPage(1); }}
        />

        {error ? (
          <ErrorMessage message={error.message} />
        ) : (
          <SalesOrderTable
            data={data?.salesOrders}
            loading={loading}
            onPageChange={setPage}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
