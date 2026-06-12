"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import {
  ACKNOWLEDGE_ALERT,
  RESOLVE_ALERT,
  BULK_RESOLVE_ALERTS,
  GET_STOCK_ALERTS,
  GET_OPEN_ALERT_COUNT,
} from "@/lib/graphql/operations/alert";
import type { StockAlert, StockAlertConnection, AlertType, AlertStatus } from "@/types/alert";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_VARIANT: Record<AlertType, "danger" | "warning" | "info" | "default"> = {
  OUT_OF_STOCK:       "danger",
  LOW_STOCK:          "warning",
  OVERSTOCK:          "info",
  EXPIRY_APPROACHING: "warning",
};

const TYPE_LABEL: Record<AlertType, string> = {
  OUT_OF_STOCK:       "Out of stock",
  LOW_STOCK:          "Low stock",
  OVERSTOCK:          "Overstock",
  EXPIRY_APPROACHING: "Expiry soon",
};

const STATUS_VARIANT: Record<AlertStatus, "danger" | "warning" | "success" | "default"> = {
  OPEN:         "danger",
  ACKNOWLEDGED: "warning",
  RESOLVED:     "success",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  pageInfo,
  onPageChange,
}: {
  pageInfo:     StockAlertConnection["pageInfo"];
  onPageChange: (p: number) => void;
}) {
  const { currentPage, totalPages, totalCount } = pageInfo;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span> &mdash;{" "}
        <span className="font-medium">{totalCount}</span> alerts
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

// ─── Row actions ─────────────────────────────────────────────────────────────

function AlertRowActions({ alert }: { alert: StockAlert }) {
  const refetchQueries = [GET_STOCK_ALERTS, GET_OPEN_ALERT_COUNT];

  const [acknowledge, { loading: acking }] = useMutation(ACKNOWLEDGE_ALERT, { refetchQueries });
  const [resolve,     { loading: resolving }] = useMutation(RESOLVE_ALERT,  { refetchQueries });

  if (alert.status === "RESOLVED") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {alert.status === "OPEN" && (
        <Button
          variant="outline" size="sm"
          loading={acking}
          onClick={() => acknowledge({ variables: { id: alert.id } })}
        >
          Acknowledge
        </Button>
      )}
      <Button
        variant="ghost" size="sm"
        loading={resolving}
        onClick={() => resolve({ variables: { id: alert.id } })}
        className="text-green-600 hover:bg-green-50"
      >
        Resolve
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AlertTableProps {
  data:         StockAlertConnection | undefined;
  loading:      boolean;
  onPageChange: (p: number) => void;
}

export function AlertTable({ data, loading, onPageChange }: AlertTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [bulkResolve, { loading: bulkResolving }] = useMutation(BULK_RESOLVE_ALERTS, {
    refetchQueries: [GET_STOCK_ALERTS, GET_OPEN_ALERT_COUNT],
    onCompleted:    () => setSelected(new Set()),
  });

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!data?.nodes.length) {
    return (
      <EmptyState
        title="No alerts found"
        description="Stock alerts will appear here when products fall below their reorder point."
      />
    );
  }

  const actionable      = data.nodes.filter((a) => a.status !== "RESOLVED");
  const allSelected     = actionable.length > 0 && actionable.every((a) => selected.has(a.id));
  const someSelected    = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(actionable.map((a) => a.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Bulk action toolbar */}
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-gray-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
          <Button
            size="sm"
            variant="primary"
            loading={bulkResolving}
            onClick={() => bulkResolve({ variables: { ids: Array.from(selected) } })}
          >
            Resolve selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
            </TableHead>
            <TableHead>Alert type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Current qty</TableHead>
            <TableHead className="text-right">Threshold</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Triggered</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-48">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.nodes.map((alert: StockAlert) => (
            <TableRow
              key={alert.id}
              className={alert.status === "RESOLVED" ? "opacity-50" : ""}
            >
              <TableCell>
                {alert.status !== "RESOLVED" && (
                  <input
                    type="checkbox"
                    checked={selected.has(alert.id)}
                    onChange={() => toggleOne(alert.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                )}
              </TableCell>
              <TableCell>
                <Badge variant={TYPE_VARIANT[alert.type]}>
                  {TYPE_LABEL[alert.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-gray-900">{alert.product.name}</div>
                <div className="font-mono text-xs text-gray-400">{alert.product.sku}</div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className={
                  alert.type === "OUT_OF_STOCK"
                    ? "font-bold text-red-600"
                    : alert.type === "LOW_STOCK"
                    ? "font-semibold text-yellow-600"
                    : "text-gray-900"
                }>
                  {alert.currentQuantity}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm text-gray-500">
                {alert.threshold ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[alert.status]}>
                  {alert.status.charAt(0) + alert.status.slice(1).toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-gray-500">
                {new Date(alert.createdAt).toLocaleDateString()}{" "}
                {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-gray-500" title={alert.message ?? undefined}>
                {alert.message ?? "—"}
              </TableCell>
              <TableCell>
                <AlertRowActions alert={alert} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar pageInfo={data.pageInfo} onPageChange={onPageChange} />
    </div>
  );
}
