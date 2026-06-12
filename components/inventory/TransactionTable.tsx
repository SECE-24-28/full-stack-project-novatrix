"use client";

import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import type {
  InventoryTransaction,
  InventoryTransactionConnection,
  TransactionType,
} from "@/types/inventory";

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_VARIANT: Record<TransactionType, "success" | "danger" | "info" | "warning" | "default"> = {
  PURCHASE_RECEIPT: "success",
  RETURN_IN:        "success",
  TRANSFER_IN:      "success",
  ADJUSTMENT_IN:    "success",
  SALES_ISSUE:      "danger",
  RETURN_OUT:       "danger",
  TRANSFER_OUT:     "warning",
  ADJUSTMENT_OUT:   "warning",
  DAMAGE_WRITE_OFF: "danger",
};

const TYPE_LABEL: Record<TransactionType, string> = {
  PURCHASE_RECEIPT: "Purchase receipt",
  SALES_ISSUE:      "Sales issue",
  TRANSFER_IN:      "Transfer in",
  TRANSFER_OUT:     "Transfer out",
  ADJUSTMENT_IN:    "Adjustment in",
  ADJUSTMENT_OUT:   "Adjustment out",
  RETURN_IN:        "Return in",
  RETURN_OUT:       "Return out",
  DAMAGE_WRITE_OFF: "Damage write-off",
};

const INCOMING: TransactionType[] = [
  "PURCHASE_RECEIPT", "TRANSFER_IN", "ADJUSTMENT_IN", "RETURN_IN",
];

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  pageInfo,
  onPageChange,
}: {
  pageInfo:     InventoryTransactionConnection["pageInfo"];
  onPageChange: (p: number) => void;
}) {
  const { currentPage, totalPages, totalCount } = pageInfo;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span> &mdash;{" "}
        <span className="font-medium">{totalCount}</span> transactions
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

interface TransactionTableProps {
  data:         InventoryTransactionConnection | undefined;
  loading:      boolean;
  onPageChange: (p: number) => void;
}

export function TransactionTable({ data, loading, onPageChange }: TransactionTableProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!data?.nodes.length) {
    return <EmptyState title="No transactions found" description="Stock movements will appear here as inventory changes." />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Route</TableHead>
            <TableHead className="text-right">Before</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">After</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.nodes.map((txn: InventoryTransaction) => {
            const isIn  = INCOMING.includes(txn.type);
            const delta = txn.quantityAfter - txn.quantityBefore;
            const warehouseRoute = txn.sourceWarehouse && txn.destWarehouse
              ? `${txn.sourceWarehouse.code} → ${txn.destWarehouse.code}`
              : txn.sourceWarehouse
              ? txn.sourceWarehouse.name
              : txn.destWarehouse
              ? txn.destWarehouse.name
              : "—";

            return (
              <TableRow key={txn.id}>
                <TableCell className="whitespace-nowrap text-xs text-gray-500">
                  <div>{new Date(txn.createdAt).toLocaleDateString()}</div>
                  <div className="text-gray-400">{new Date(txn.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={TYPE_VARIANT[txn.type]}>{TYPE_LABEL[txn.type]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-gray-900">{txn.product.name}</div>
                  <div className="font-mono text-xs text-gray-400">{txn.product.sku}</div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{warehouseRoute}</TableCell>
                <TableCell className="text-right tabular-nums text-sm text-gray-500">
                  {txn.quantityBefore.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`tabular-nums text-sm font-semibold ${isIn ? "text-green-600" : "text-red-600"}`}>
                    {isIn ? "+" : ""}{delta.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm font-medium text-gray-900">
                  {txn.quantityAfter.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-500">
                  {txn.reference ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {txn.performedBy.firstName} {txn.performedBy.lastName[0]}.
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
