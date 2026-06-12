"use client";

import { useState } from "react";
import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import { Input }      from "@/components/ui/Input";
import { Select }     from "@/components/ui/Select";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import type {
  ProductStockOverview,
  ProductStockConnection,
  ProductStockFilterInput,
} from "@/types/inventory";

// ─── Filters ──────────────────────────────────────────────────────────────────

const STOCK_LEVEL_OPTIONS = [
  { value: "",           label: "All stock levels" },
  { value: "lowStock",   label: "Low stock"        },
  { value: "outOfStock", label: "Out of stock"     },
];

interface StockOverviewFiltersProps {
  filter:   ProductStockFilterInput;
  onChange: (f: ProductStockFilterInput) => void;
  onReset:  () => void;
}

export function StockOverviewFilters({ filter, onChange, onReset }: StockOverviewFiltersProps) {
  const levelValue = filter.outOfStock ? "outOfStock" : filter.lowStock ? "lowStock" : "";
  const hasActive  = !!(filter.search || filter.lowStock || filter.outOfStock);

  function handleLevel(value: string) {
    onChange({
      ...filter,
      lowStock:   value === "lowStock",
      outOfStock: value === "outOfStock",
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search product, SKU…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>
      <div className="w-48">
        <Select
          value={levelValue}
          options={STOCK_LEVEL_OPTIONS}
          onChange={(e) => handleLevel(e.target.value)}
          placeholder="All stock levels"
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>Clear filters</Button>
      )}
    </div>
  );
}

// ─── Expandable row ───────────────────────────────────────────────────────────

function ProductStockRow({ row }: { row: ProductStockOverview }) {
  const [expanded, setExpanded] = useState(false);
  const isLow  = row.totalQuantity > 0 && row.totalQuantity <= row.reorderPoint;
  const isZero = row.totalQuantity === 0;

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => row.stockByWarehouse.length > 0 && setExpanded((p) => !p)}
      >
        <TableCell>
          {row.stockByWarehouse.length > 0 && (
            <svg
              className={`inline h-4 w-4 text-gray-400 transition-transform mr-1 ${expanded ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <span className="font-medium text-gray-900">{row.name}</span>
        </TableCell>
        <TableCell className="font-mono text-xs text-gray-500">{row.sku}</TableCell>
        <TableCell className="text-sm text-gray-500">{row.unitOfMeasure}</TableCell>
        <TableCell className="text-right tabular-nums">
          <span className={isZero ? "font-semibold text-red-600" : isLow ? "font-semibold text-yellow-600" : "text-gray-900"}>
            {row.totalQuantity.toLocaleString()}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm text-gray-500">
          {row.totalReserved.toLocaleString()}
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm font-medium text-gray-900">
          {row.totalAvailable.toLocaleString()}
        </TableCell>
        <TableCell className="text-right tabular-nums text-xs text-gray-400">
          {row.reorderPoint.toLocaleString()}
        </TableCell>
        <TableCell>
          {isZero  && <Badge variant="danger">Out of stock</Badge>}
          {isLow   && !isZero && <Badge variant="warning">Low stock</Badge>}
          {!isLow  && !isZero && <Badge variant="success">In stock</Badge>}
        </TableCell>
      </TableRow>

      {/* Per-warehouse breakdown */}
      {expanded && row.stockByWarehouse.map((s) => (
        <TableRow key={s.warehouseId} className="bg-gray-50">
          <TableCell className="pl-10 text-sm text-gray-600" colSpan={1}>
            {s.warehouseName}
            <span className="ml-1 font-mono text-xs text-gray-400">({s.warehouseCode})</span>
          </TableCell>
          <TableCell />
          <TableCell />
          <TableCell className="text-right tabular-nums text-sm text-gray-700">
            {s.quantity.toLocaleString()}
          </TableCell>
          <TableCell className="text-right tabular-nums text-sm text-gray-500">
            {s.reservedQty.toLocaleString()}
          </TableCell>
          <TableCell className="text-right tabular-nums text-sm text-gray-700">
            {s.availableQty.toLocaleString()}
          </TableCell>
          <TableCell />
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  pageInfo,
  onPageChange,
}: {
  pageInfo:     ProductStockConnection["pageInfo"];
  onPageChange: (p: number) => void;
}) {
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
        <Button variant="outline" size="sm" disabled={!pageInfo.hasPreviousPage} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!pageInfo.hasNextPage} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StockOverviewTableProps {
  data:         ProductStockConnection | undefined;
  loading:      boolean;
  onPageChange: (p: number) => void;
}

export function StockOverviewTable({ data, loading, onPageChange }: StockOverviewTableProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!data?.nodes.length) {
    return <EmptyState title="No products found" description="Try adjusting your filters." />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>UoM</TableHead>
            <TableHead className="text-right">Total qty</TableHead>
            <TableHead className="text-right">Reserved</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Reorder at</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.nodes.map((row) => (
            <ProductStockRow key={row.productId} row={row} />
          ))}
        </TableBody>
      </Table>
      <PaginationBar pageInfo={data.pageInfo} onPageChange={onPageChange} />
    </div>
  );
}
