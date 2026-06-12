"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { ProtectedRoute }        from "@/components/auth/ProtectedRoute";
import { RoleGate }              from "@/components/auth/RoleGate";
import { SupplierTable }         from "@/components/suppliers/SupplierTable";
import { SupplierFilters }       from "@/components/suppliers/SupplierFilters";
import { DeleteSupplierDialog }  from "@/components/suppliers/DeleteSupplierDialog";
import { Button }                from "@/components/ui/Button";
import { ErrorMessage }          from "@/components/ui/Feedback";
import { GET_SUPPLIERS }         from "@/lib/graphql/operations/supplier";
import type { Supplier, SuppliersFilterInput } from "@/types/supplier";

const DEFAULT_FILTER: SuppliersFilterInput = {};

export default function SuppliersPage() {
  const [filter,   setFilter]   = useState<SuppliersFilterInput>(DEFAULT_FILTER);
  const [page,     setPage]     = useState(1);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  const { data, loading, error } = useQuery(GET_SUPPLIERS, {
    variables: { filter, pagination: { page, limit: 20 } },
  });

  function handleFilterChange(f: SuppliersFilterInput) {
    setFilter(f);
    setPage(1);
  }

  return (
    <ProtectedRoute permission="read:suppliers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
            <p className="mt-1 text-sm text-gray-500">
              {data?.suppliers?.pageInfo.totalCount ?? 0} suppliers registered
            </p>
          </div>
          <RoleGate permission="create:suppliers">
            <Link href="/suppliers/new">
              <Button>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New supplier
              </Button>
            </Link>
          </RoleGate>
        </div>

        <SupplierFilters
          filter={filter}
          onChange={handleFilterChange}
          onReset={() => { setFilter(DEFAULT_FILTER); setPage(1); }}
        />

        {error ? (
          <ErrorMessage message={error.message} />
        ) : (
          <SupplierTable
            data={data?.suppliers}
            loading={loading}
            onPageChange={setPage}
            onDelete={setToDelete}
          />
        )}

        <DeleteSupplierDialog
          supplier={toDelete}
          onClose={() => setToDelete(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
