"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute }         from "@/components/auth/ProtectedRoute";
import { RoleGate }               from "@/components/auth/RoleGate";
import { WarehouseTable }         from "@/components/warehouses/WarehouseTable";
import { DeleteWarehouseDialog }  from "@/components/warehouses/DeleteWarehouseDialog";
import { Button }      from "@/components/ui/Button";
import { Input }       from "@/components/ui/Input";
import { Select }      from "@/components/ui/Select";
import { ErrorMessage } from "@/components/ui/Feedback";
import { GET_WAREHOUSES } from "@/lib/graphql/operations/warehouse";
import type { WarehousesFilterInput, WarehouseListItem } from "@/types/warehouse";
import type { WarehouseStatus } from "@prisma/client";

const STATUS_OPTIONS = [
  { value: "ACTIVE",            label: "Active"            },
  { value: "INACTIVE",          label: "Inactive"          },
  { value: "UNDER_MAINTENANCE", label: "Under maintenance" },
];

export default function WarehousesPage() {
  const [filter,   setFilter]   = useState<WarehousesFilterInput>({});
  const [page,     setPage]     = useState(1);
  const [toDelete, setToDelete] = useState<WarehouseListItem | null>(null);

  const { data, loading, error } = useQuery(GET_WAREHOUSES, {
    variables: { filter, pagination: { page, limit: 20 } },
  });

  function handleFilterChange(patch: Partial<WarehousesFilterInput>) {
    setFilter((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  return (
    <ProtectedRoute permission="read:warehouses">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Warehouses</h2>
            <p className="mt-1 text-sm text-gray-500">
              {data?.warehouses?.pageInfo.totalCount ?? 0} warehouse{data?.warehouses?.pageInfo.totalCount !== 1 ? "s" : ""} configured
            </p>
          </div>
          <RoleGate permission="create:warehouses">
            <Link href="/warehouses/new">
              <Button>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New warehouse
              </Button>
            </Link>
          </RoleGate>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-60">
            <Input
              placeholder="Search name, code, city…"
              value={filter.search ?? ""}
              onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
            />
          </div>
          <div className="w-44">
            <Select
              placeholder="All statuses"
              value={filter.status ?? ""}
              options={STATUS_OPTIONS}
              onChange={(e) => handleFilterChange({ status: (e.target.value as WarehouseStatus) || undefined })}
            />
          </div>
          {(filter.search || filter.status) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilter({}); setPage(1); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
        {error ? (
          <ErrorMessage message={error.message} />
        ) : (
          <WarehouseTable
            data={data?.warehouses}
            loading={loading}
            onPageChange={setPage}
            onDelete={setToDelete}
          />
        )}

        <DeleteWarehouseDialog warehouse={toDelete} onClose={() => setToDelete(null)} />
      </div>
    </ProtectedRoute>
  );
}
