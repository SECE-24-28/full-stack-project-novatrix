"use client";

import { useMutation } from "@apollo/client";
import { Button } from "@/components/ui/Button";
import { Modal }  from "@/components/ui/Modal";
import { DELETE_WAREHOUSE, GET_WAREHOUSES } from "@/lib/graphql/operations/warehouse";
import type { WarehouseListItem } from "@/types/warehouse";

interface Props {
  warehouse: WarehouseListItem | null;
  onClose:   () => void;
}

export function DeleteWarehouseDialog({ warehouse, onClose }: Props) {
  const [deleteWarehouse, { loading, error }] = useMutation(DELETE_WAREHOUSE, {
    refetchQueries: [GET_WAREHOUSES],
    onCompleted:    onClose,
  });

  if (!warehouse) return null;

  return (
    <Modal open={!!warehouse} onClose={onClose} title="Delete warehouse" description="This cannot be undone.">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-semibold">{warehouse.name}</span>{" "}
          (<code className="rounded bg-gray-100 px-1 text-xs">{warehouse.code}</code>)?
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          ⚠ All zones and stock records will be deleted. Warehouses with active inventory cannot be deleted.
        </div>
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
            onClick={() => deleteWarehouse({ variables: { id: warehouse.id } })}
          >
            Delete warehouse
          </Button>
        </div>
      </div>
    </Modal>
  );
}
