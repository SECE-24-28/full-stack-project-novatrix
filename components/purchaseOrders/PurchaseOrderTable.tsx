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
import type { PurchaseOrder, PurchaseOrderConnection, PurchaseOrderStatus } from "@/types/purchaseOrder";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<PurchaseOrderStatus, "default" | "info" | "success" | "warning" | "danger"> = {
  DRAFT:              "default",
  SUBMITTED:          "info",
  APPROVED:           "warning",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED:           "success",
  CANCELLED:          "danger",
};

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT:              "Draft",
  SUBMITTED:          "Pending",
  APPROVED:           "Approved",
  PARTIALLY_RECEIVED: "Partial",
  RECEIVED:           "Delivered",
  CANCELLED:          "Cancelled",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationBarProps {
  pageInfo:     PurchaseOrderConnection["pageInfo"];
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

interface PurchaseOrderTableProps {
  data:         PurchaseOrderConnection | undefined;
  loading:      boolean;
  onPageChange: (page: number) => void;
}

export function PurchaseOrderTable({ data, loading, onPageChange }: PurchaseOrderTableProps) {
  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!data?.nodes.length) {
    return <EmptyState title="No purchase orders found" description="Try adjusting your filters or create a new purchase order." />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.nodes.map((po: PurchaseOrder) => (
            <TableRow key={po.id}>
              <TableCell className="font-mono text-xs font-medium text-gray-700">
                {po.poNumber}
              </TableCell>
              <TableCell className="text-sm text-gray-700">{po.supplier.name}</TableCell>
              <TableCell className="text-sm text-gray-600">{po.warehouse.name}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(po.orderDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell className="tabular-nums text-sm text-gray-600">
                {po.items.length}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm font-medium">
                ₹{Number(po.totalAmount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[po.status]}>
                  {STATUS_LABEL[po.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/purchase-orders/${po.id}`}>
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
