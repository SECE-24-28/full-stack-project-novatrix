"use client";

import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/types/auditLog";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100   text-blue-700",
  DELETE: "bg-rose-100   text-rose-700",
  LOGIN:  "bg-violet-100 text-violet-700",
  LOGOUT: "bg-gray-100   text-gray-600",
  EXPORT: "bg-amber-100  text-amber-700",
};

const RESOURCE_STYLES: Record<string, string> = {
  Product:        "bg-cyan-50    text-cyan-700    border-cyan-100",
  Warehouse:      "bg-teal-50    text-teal-700    border-teal-100",
  WarehouseZone:  "bg-teal-50    text-teal-600    border-teal-100",
  Supplier:       "bg-violet-50  text-violet-700  border-violet-100",
  PurchaseOrder:  "bg-emerald-50 text-emerald-700 border-emerald-100",
  SalesOrder:     "bg-orange-50  text-orange-700  border-orange-100",
  InventoryStock: "bg-blue-50    text-blue-700    border-blue-100",
  User:           "bg-pink-50    text-pink-700    border-pink-100",
  Category:       "bg-indigo-50  text-indigo-700  border-indigo-100",
};

interface AuditLogTableProps {
  rows:      AuditLogEntry[];
  loading:   boolean;
  onSelect:  (entry: AuditLogEntry) => void;
  selected?: string | null;
}

export function AuditLogTable({ rows, loading, onSelect, selected }: AuditLogTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-5 py-3 last:border-0">
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
            <div className="h-5 w-24 animate-pulse rounded  bg-gray-100" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-28 animate-pulse rounded  bg-gray-100" />
            <div className="h-4 w-32 animate-pulse rounded  bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400 shadow-sm">
        No audit log entries found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Resource</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Entity ID</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">IP Address</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((log) => {
            const isSelected = selected === log.id;
            const actionCls  = ACTION_STYLES[log.action]   ?? "bg-gray-100 text-gray-600";
            const resourceCls= RESOURCE_STYLES[log.resource] ?? "bg-gray-50 text-gray-600 border-gray-100";

            return (
              <tr
                key={log.id}
                onClick={() => onSelect(log)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-blue-50/40",
                  isSelected && "bg-blue-50"
                )}
              >
                {/* Action badge */}
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", actionCls)}>
                    {log.action}
                  </span>
                </td>

                {/* Resource badge */}
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium", resourceCls)}>
                    {log.resource}
                  </span>
                </td>

                {/* Entity ID */}
                <td className="px-5 py-3">
                  {log.resourceId ? (
                    <span className="font-mono text-xs text-gray-400" title={log.resourceId}>
                      {log.resourceId.length > 16 ? `…${log.resourceId.slice(-12)}` : log.resourceId}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* User */}
                <td className="px-5 py-3">
                  {log.user ? (
                    <div>
                      <p className="font-medium text-gray-800">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{log.user.email}</p>
                    </div>
                  ) : (
                    <span className="text-xs italic text-gray-400">System</span>
                  )}
                </td>

                {/* IP */}
                <td className="px-5 py-3 font-mono text-xs text-gray-400">
                  {log.ipAddress ?? "—"}
                </td>

                {/* Timestamp */}
                <td className="px-5 py-3 text-xs text-gray-500">
                  <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                  <div className="text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
