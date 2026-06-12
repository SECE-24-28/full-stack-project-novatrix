"use client";

import { useMutation } from "@apollo/client";
import { Button }  from "@/components/ui/Button";
import { Modal }   from "@/components/ui/Modal";
import { DELETE_PRODUCT, GET_PRODUCTS } from "@/lib/graphql/operations/product";
import type { Product } from "@/types/product";

interface DeleteProductDialogProps {
  product:   Product | null;
  onClose:   () => void;
}

export function DeleteProductDialog({ product, onClose }: DeleteProductDialogProps) {
  const [deleteProduct, { loading, error }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [GET_PRODUCTS],
    onCompleted:    onClose,
  });

  if (!product) return null;

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Delete product"
      description="This action cannot be undone."
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{product.name}</span>
          {" "}(<span className="font-mono text-xs">{product.sku}</span>)?
        </p>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.graphQLErrors[0]?.message ?? error.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={loading}
            onClick={() => deleteProduct({ variables: { id: product.id } })}
          >
            Delete product
          </Button>
        </div>
      </div>
    </Modal>
  );
}
