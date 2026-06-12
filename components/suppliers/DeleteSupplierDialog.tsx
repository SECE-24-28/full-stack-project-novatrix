"use client";

import { useMutation } from "@apollo/client";
import { Button } from "@/components/ui/Button";
import { Modal }  from "@/components/ui/Modal";
import { DELETE_SUPPLIER, GET_SUPPLIERS } from "@/lib/graphql/operations/supplier";
import type { Supplier } from "@/types/supplier";

interface DeleteSupplierDialogProps {
  supplier: Supplier | null;
  onClose:  () => void;
}

export function DeleteSupplierDialog({ supplier, onClose }: DeleteSupplierDialogProps) {
  const [deleteSupplier, { loading, error }] = useMutation(DELETE_SUPPLIER, {
    refetchQueries: [GET_SUPPLIERS],
    onCompleted:    onClose,
  });

  if (!supplier) return null;

  return (
    <Modal open={!!supplier} onClose={onClose} title="Delete supplier" description="This action cannot be undone.">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{supplier.name}</span>{" "}
          (<span className="font-mono text-xs">{supplier.code}</span>)?
        </p>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.graphQLErrors[0]?.message ?? error.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="destructive"
            loading={loading}
            onClick={() => deleteSupplier({ variables: { id: supplier.id } })}
          >
            Delete supplier
          </Button>
        </div>
      </div>
    </Modal>
  );
}
