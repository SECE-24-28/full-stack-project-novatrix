"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute }       from "@/components/auth/ProtectedRoute";
import { TransactionTable }     from "@/components/inventory/TransactionTable";
import { TransactionFilters }   from "@/components/inventory/TransactionFilters";
import { Button }               from "@/components/ui/Button";
import { ErrorMessage }         from "@/components/ui/Feedback";
import { GET_INVENTORY_TRANSACTIONS } from "@/lib/graphql/operations/inventory";
import type { InventoryTransactionsFilterInput } from "@/types/inventory";

const DEFAULT_FILTER: InventoryTransactionsFilterInput = {};

export default function TransactionHistoryPage() {
  return (
    <ProtectedRoute permission="read:inventory">
      <TransactionHistoryContent />
    </ProtectedRoute>
  );
}

function TransactionHistoryContent() {
  const [filter, setFilter] = useState<InventoryTransactionsFilterInput>(DEFAULT_FILTER);
  const [page,   setPage]   = useState(1);

  const { data, loading, error } = useQuery(GET_INVENTORY_TRANSACTIONS, {
    variables:   { filter, pagination: { page, limit: 50 } },
    fetchPolicy: "cache-and-network",
  });

  function handleFilterChange(f: InventoryTransactionsFilterInput) {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <p className="mt-1 text-sm text-gray-500">
            {data?.inventoryTransactions?.pageInfo.totalCount ?? 0} transactions total
          </p>
        </div>
        <Link href="/inventory">
          <Button variant="ghost">← Back to inventory</Button>
        </Link>
      </div>

      <TransactionFilters
        filter={filter}
        onChange={handleFilterChange}
        onReset={() => { setFilter(DEFAULT_FILTER); setPage(1); }}
      />

      {error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <TransactionTable
          data={data?.inventoryTransactions}
          loading={loading}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
