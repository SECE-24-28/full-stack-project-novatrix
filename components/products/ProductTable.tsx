"use client";

import Link from "next/link";
import { Badge }       from "@/components/ui/Badge";
import { Button }      from "@/components/ui/Button";
import { EmptyState }  from "@/components/ui/Feedback";
import { Spinner }     from "@/components/ui/Spinner";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import { RoleGate } from "@/components/auth/RoleGate";
import type { Product, ProductConnection } from "@/types/product";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_VARIANT = {
  ACTIVE:       "success",
  INACTIVE:     "warning",
  DISCONTINUED: "danger",
} as const;

// ─── Pagination bar ───────────────────────────────────────────────────────────

interface PaginationBarProps {
  pageInfo:  ProductConnection["pageInfo"];
  onPageChange: (page: number) => void;
}

function PaginationBar({ pageInfo, onPageChange }: PaginationBarProps) {
  const { currentPage, totalPages, totalCount } = pageInfo;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span> &mdash;{" "}
        <span className="font-medium">{totalCount}</span> products
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline" size="sm"
          disabled={!pageInfo.hasPreviousPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline" size="sm"
          disabled={!pageInfo.hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────

interface ProductTableProps {
  data:         ProductConnection | undefined;
  loading:      boolean;
  onPageChange: (page: number) => void;
  onDelete:     (product: Product) => void;
}

export function ProductTable({ data, loading, onPageChange, onDelete }: ProductTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data?.nodes.length) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your filters or create a new product."
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Reorder At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.nodes.map((product) => {
            const isLowStock =
              product.stockSummary.availableQty > 0 &&
              product.stockSummary.availableQty <= product.reorderPoint;
            const isOutOfStock = product.stockSummary.availableQty === 0;

            return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-xs text-gray-500">
                  {product.sku}
                </TableCell>

                <TableCell>
                  <Link
                    href={`/products/${product.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {product.name}
                  </Link>
                  {product.barcode && (
                    <p className="text-xs text-gray-400">{product.barcode}</p>
                  )}
                </TableCell>

                <TableCell className="text-sm text-gray-600">
                  {product.category.name}
                </TableCell>

                <TableCell className="text-right tabular-nums text-sm">
                  ₹{Number(product.costPrice).toFixed(2)}
                </TableCell>

                <TableCell className="text-right tabular-nums text-sm font-medium">
                  ₹{Number(product.sellingPrice).toFixed(2)}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  <span className={isOutOfStock ? "text-red-600 font-semibold" : isLowStock ? "text-yellow-600 font-semibold" : ""}>
                    {product.stockSummary.availableQty}
                  </span>
                  {product.stockSummary.reservedQty > 0 && (
                    <span className="ml-1 text-xs text-gray-400">
                      ({product.stockSummary.reservedQty} reserved)
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right tabular-nums text-sm text-gray-500">
                  {product.reorderPoint}
                </TableCell>

                <TableCell>
                  <Badge variant={STATUS_VARIANT[product.status] ?? "default"}>
                    {product.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/products/${product.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                    </Link>

                    <RoleGate permission="delete:products">
                      <Button
                        variant="ghost" size="icon"
                        title="Delete"
                        onClick={() => onDelete(product)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </RoleGate>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <PaginationBar pageInfo={data.pageInfo} onPageChange={onPageChange} />
    </div>
  );
}
