"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProductForm }    from "@/components/products/ProductForm";
import { Button }         from "@/components/ui/Button";
import { PageLoader }     from "@/components/ui/Spinner";
import { ErrorMessage }   from "@/components/ui/Feedback";
import { GET_PRODUCT }    from "@/lib/graphql/operations/product";
import type { Product }   from "@/types/product";

interface Props { params: Promise<{ id: string }> }

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="update:products">
      <EditProductContent id={id} />
    </ProtectedRoute>
  );
}

function EditProductContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_PRODUCT, { variables: { id } });
  const product: Product | undefined = data?.product;

  if (loading) return <PageLoader />;
  if (error || !product) return <ErrorMessage message={error?.message ?? "Product not found."} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit product</h2>
          <p className="mt-1 text-sm text-gray-500">
            Editing <span className="font-mono font-medium">{product.sku}</span> — {product.name}
          </p>
        </div>
        <Link href={`/products/${id}`}>
          <Button variant="ghost">Cancel</Button>
        </Link>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
