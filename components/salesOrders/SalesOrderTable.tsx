"use client";

import Link from "next/link";
import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import type { SalesOrder, SalesOrderConnection, SalesOrderStatus } from "@/types/salesOrder";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<SalesOrderStatus, "default" | "info" | "success" | "warning" | "danger"> = {
  DRAFT:            "default",
  CONFIRMED:        "info",
  PROCESSING:       "warning",
  PARTIALLY_SHIPPED:"warning",
  SHIPPED:          "info",
  DELIVERED:        "success",
  CANCELLED:        "danger",
  RETURNED:         "danger",
};

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  DRAFT:            "Draft",
  CONFIRMED:        "Pending",
  PROCESSING:       "Processing",
  PARTIALLY_SHIPPED:"Partial",
  SHIPPED:          "Shipped",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
  RETURNED:         "Returned",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  pageInfo,
  onPageChange,
}: {
  pageInfo:     SalesOrderConnection["pageInfo"];
  onPageChange: (page: number) => void;
}) {
  const { currentPage, totalPages, totalCount } = pageInfo;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span> &mdash;{" "}
        <span className="font-medium">{totalCount}</span> orders
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

// ─── Main table ───────────────────────────────────────────────────────────────

interface SalesOrderTableProps {
  data:         SalesOrderConnection | undefined;
  loading:      boolean;
  onPageChange: (page: number) => void;
}

export function SalesOrderTable({ data, loading, onPageChange }: SalesOrderTableProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!data?.nodes.length) {
    return <EmptyState title="No sales orders found" description="Try adjusting your filters or create a new sales order." />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SO Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.nodes.map((so: SalesOrder) => (
            <TableRow key={so.id}>
              <TableCell className="font-mono text-xs font-medium text-gray-700">
                {so.soNumber}
              </TableCell>
              <TableCell className="text-sm text-gray-700">{so.customerName}</TableCell>
              <TableCell className="text-sm text-gray-600">{so.warehouse.name}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(so.orderDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {so.requiredDate ? new Date(so.requiredDate).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell className="tabular-nums text-sm text-gray-600">
                {so.items.length}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm font-medium">
                ₹{Number(so.totalAmount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[so.status]}>
                  {STATUS_LABEL[so.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/sales-orders/${so.id}`}>
                  <Button variant="ghost" size="icon" title="View">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar pageInfo={data.pageInfo} onPageChange={onPageChange} />
    </div>
  );
}
