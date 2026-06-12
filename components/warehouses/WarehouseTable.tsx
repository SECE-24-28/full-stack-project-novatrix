"use client";

import Link from "next/link";
import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { RoleGate }   from "@/components/auth/RoleGate";
import type { WarehouseConnection, WarehouseListItem } from "@/types/warehouse";

const STATUS_VARIANT = {
  ACTIVE:            "success",
  INACTIVE:          "default",
  UNDER_MAINTENANCE: "warning",
} as const;

function UtilisationBar({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-gray-400">Unlimited</span>;
  const colour = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-400" : "bg-blue-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${colour}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="tabular-nums text-xs text-gray-600">{pct}%</span>
    </div>
  );
}

function PaginationBar({ pageInfo, onPageChange }: {
  pageInfo: WarehouseConnection["pageInfo"];
  onPageChange: (p: number) => void;
}) {
  if (pageInfo.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Page <b>{pageInfo.currentPage}</b> of <b>{pageInfo.totalPages}</b> — <b>{pageInfo.totalCount}</b> warehouses
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!pageInfo.hasPreviousPage} onClick={() => onPageChange(pageInfo.currentPage - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={!pageInfo.hasNextPage}     onClick={() => onPageChange(pageInfo.currentPage + 1)}>Next</Button>
      </div>
    </div>
  );
}

interface WarehouseTableProps {
  data:         WarehouseConnection | undefined;
  loading:      boolean;
  onPageChange: (p: number) => void;
  onDelete:     (w: WarehouseListItem) => void;
}

export function WarehouseTable({ data, loading, onPageChange, onDelete }: WarehouseTableProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!data?.nodes.length) return <EmptyState title="No warehouses found" description="Create your first warehouse to get started." />;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead className="text-right">Units</TableHead>
            <TableHead>Utilisation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.nodes.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="font-mono text-xs text-gray-500">{w.code}</TableCell>

              <TableCell>
                <Link href={`/warehouses/${w.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                  {w.name}
                </Link>
                {w.zones.length > 0 && (
                  <p className="text-xs text-gray-400">{w.zones.length} zone{w.zones.length !== 1 ? "s" : ""}</p>
                )}
              </TableCell>

              <TableCell className="text-sm text-gray-600">
                {[w.city, w.country].filter(Boolean).join(", ") || "—"}
              </TableCell>

              <TableCell className="text-right tabular-nums">{w.summary.totalProducts}</TableCell>
              <TableCell className="text-right tabular-nums">{w.summary.totalUnits.toLocaleString()}</TableCell>

              <TableCell>
                <UtilisationBar pct={w.capacityStats.utilisationPct} />
              </TableCell>

              <TableCell>
                <Badge variant={STATUS_VARIANT[w.status] ?? "default"}>
                  {w.status.replace(/_/g, " ")}
                </Badge>
                {w.summary.lowStockCount > 0 && (
                  <p className="mt-0.5 text-xs text-yellow-600">{w.summary.lowStockCount} low stock</p>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/warehouses/${w.id}/edit`}>
                    <Button variant="ghost" size="icon" title="Edit">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                  </Link>
                  <RoleGate permission="delete:warehouses">
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDelete(w)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </RoleGate>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationBar pageInfo={data.pageInfo} onPageChange={onPageChange} />
    </div>
  );
}
