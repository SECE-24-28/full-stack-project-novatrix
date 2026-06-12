"use client";

import { use } from "react";
import { useQuery } from "@apollo/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SupplierForm }   from "@/components/suppliers/SupplierForm";
import { PageLoader }     from "@/components/ui/Spinner";
import { ErrorMessage }   from "@/components/ui/Feedback";
import { GET_SUPPLIER }   from "@/lib/graphql/operations/supplier";
import type { Supplier }  from "@/types/supplier";

interface Props { params: Promise<{ id: string }> }

export default function EditSupplierPage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="update:suppliers">
      <EditSupplierContent id={id} />
    </ProtectedRoute>
  );
}

function EditSupplierContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_SUPPLIER, { variables: { id } });
  const supplier: Supplier | undefined = data?.supplier;

  if (loading) return <PageLoader />;
  if (error || !supplier) return <ErrorMessage message={error?.message ?? "Supplier not found."} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit supplier</h2>
        <p className="mt-1 font-mono text-sm text-gray-500">{supplier.code} — {supplier.name}</p>
      </div>
      <SupplierForm supplier={supplier} />
    </div>
  );
}
