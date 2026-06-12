"use client";

import { use } from "react";
import { useQuery } from "@apollo/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WarehouseForm }  from "@/components/warehouses/WarehouseForm";
import { PageLoader }     from "@/components/ui/Spinner";
import { ErrorMessage }   from "@/components/ui/Feedback";
import { GET_WAREHOUSE }  from "@/lib/graphql/operations/warehouse";
import type { Warehouse } from "@/types/warehouse";

interface Props { params: Promise<{ id: string }> }

export default function EditWarehousePage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="update:warehouses">
      <EditWarehouseContent id={id} />
    </ProtectedRoute>
  );
}

function EditWarehouseContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_WAREHOUSE, { variables: { id } });
  const warehouse: Warehouse | undefined = data?.warehouse;

  if (loading) return <PageLoader />;
  if (error || !warehouse) return <ErrorMessage message={error?.message ?? "Warehouse not found."} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit warehouse</h2>
        <p className="mt-1 font-mono text-sm text-gray-500">{warehouse.code} — {warehouse.name}</p>
      </div>
      <WarehouseForm warehouse={warehouse} />
    </div>
  );
}
