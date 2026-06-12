"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGate }       from "@/components/auth/RoleGate";
import { ProductTable }   from "@/components/products/ProductTable";
import { ProductFilters } from "@/components/products/ProductFilters";
import { DeleteProductDialog } from "@/components/products/DeleteProductDialog";
import { Button }     from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/Feedback";
import { GET_PRODUCTS } from "@/lib/graphql/operations/product";
import type { Product, ProductsFilterInput } from "@/types/product";

const DEFAULT_FILTER: ProductsFilterInput = {};

export default function ProductsPage() {
  const [filter,  setFilter]  = useState<ProductsFilterInput>(DEFAULT_FILTER);
  const [page,    setPage]    = useState(1);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      filter,
      pagination: { page, limit: 20 },
    },
  });

  function handleFilterChange(f: ProductsFilterInput) {
    setFilter(f);
    setPage(1);
  }

  return (
    <ProtectedRoute permission="read:products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
            <p className="mt-1 text-sm text-gray-500">
              {data?.products?.pageInfo.totalCount ?? 0} products in catalogue
            </p>
          </div>
          <RoleGate permission="create:products">
            <Link href="/products/new">
              <Button>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New product
              </Button>
            </Link>
          </RoleGate>
        </div>

        {/* Filters */}
        <ProductFilters
          filter={filter}
          onChange={handleFilterChange}
          onReset={() => { setFilter(DEFAULT_FILTER); setPage(1); }}
        />

        {/* Table / Error */}
        {error ? (
          <ErrorMessage message={error.message} />
        ) : (
          <ProductTable
            data={data?.products}
            loading={loading}
            onPageChange={setPage}
            onDelete={setToDelete}
          />
        )}

        {/* Delete dialog */}
        <DeleteProductDialog
          product={toDelete}
          onClose={() => setToDelete(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
