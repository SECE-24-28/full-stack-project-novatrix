"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGate }       from "@/components/auth/RoleGate";
import { Badge }          from "@/components/ui/Badge";
import { Button }         from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader }     from "@/components/ui/Spinner";
import { ErrorMessage }   from "@/components/ui/Feedback";
import { GET_PRODUCT }    from "@/lib/graphql/operations/product";
import type { Product }   from "@/types/product";

const STATUS_VARIANT = {
  ACTIVE:       "success",
  INACTIVE:     "warning",
  DISCONTINUED: "danger",
} as const;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2.5 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

interface Props { params: Promise<{ id: string }> }

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);

  return (
    <ProtectedRoute permission="read:products">
      <ProductDetailContent id={id} />
    </ProtectedRoute>
  );
}

function ProductDetailContent({ id }: { id: string }) {
  const { data, loading, error } = useQuery(GET_PRODUCT, { variables: { id } });
  const product: Product | undefined = data?.product;

  if (loading) return <PageLoader />;
  if (error || !product) return <ErrorMessage message={error?.message ?? "Product not found."} />;

  const margin = product.costPrice
    ? (((Number(product.sellingPrice) - Number(product.costPrice)) / Number(product.costPrice)) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <Badge variant={STATUS_VARIANT[product.status] ?? "default"}>
              {product.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-gray-500">{product.sku}</p>
        </div>

        <div className="flex gap-2">
          <RoleGate permission="update:products">
            <Link href={`/products/${id}/edit`}>
              <Button variant="outline">Edit product</Button>
            </Link>
          </RoleGate>
          <Link href="/products">
            <Button variant="ghost">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Cost price"    value={`$${Number(product.costPrice).toFixed(4)}`} />
                <DetailRow label="Selling price" value={`$${Number(product.sellingPrice).toFixed(4)}`} />
                {margin && <DetailRow label="Gross margin" value={`${margin}%`} />}
              </dl>
            </CardContent>
          </Card>

          {/* Product details */}
          <Card>
            <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Category"       value={product.category.name} />
                <DetailRow label="Supplier"       value={product.supplier?.name} />
                <DetailRow label="Unit of measure" value={product.unitOfMeasure} />
                <DetailRow label="Barcode"        value={product.barcode} />
                <DetailRow label="Weight"         value={product.weight ? `${product.weight} kg` : null} />
                <DetailRow label="Created"        value={new Date(product.createdAt).toLocaleDateString()} />
                <DetailRow label="Last updated"   value={new Date(product.updatedAt).toLocaleDateString()} />
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Stock summary */}
          <Card>
            <CardHeader><CardTitle>Stock summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total quantity",     value: product.stockSummary.totalQuantity, },
                { label: "Reserved",           value: product.stockSummary.reservedQty,   },
                { label: "Available",          value: product.stockSummary.availableQty,  color: product.stockSummary.availableQty <= product.reorderPoint ? "text-yellow-600 font-bold" : "text-green-600 font-bold" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={`text-lg tabular-nums ${color ?? ""}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reorder info */}
          <Card>
            <CardHeader><CardTitle>Reorder settings</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Reorder point"    value={product.reorderPoint} />
                <DetailRow label="Reorder quantity" value={product.reorderQuantity} />
              </dl>
              {product.stockSummary.availableQty <= product.reorderPoint && product.stockSummary.availableQty > 0 && (
                <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  ⚠ Stock is at or below the reorder point.
                </div>
              )}
              {product.stockSummary.availableQty === 0 && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  ✕ Out of stock.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
