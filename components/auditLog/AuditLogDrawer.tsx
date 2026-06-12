"use client";

import { useEffect } from "react";
import { useQuery }  from "@apollo/client";
import { GET_AUDIT_LOG } from "@/lib/graphql/operations/auditLog";
import { Spinner }   from "@/components/ui/Spinner";
import type { AuditLogEntry } from "@/types/auditLog";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100   text-blue-700",
  DELETE: "bg-rose-100   text-rose-700",
  LOGIN:  "bg-violet-100 text-violet-700",
  LOGOUT: "bg-gray-100   text-gray-600",
  EXPORT: "bg-amber-100  text-amber-700",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:       "text-rose-600",
  ADMIN:             "text-amber-600",
  WAREHOUSE_MANAGER: "text-blue-600",
  INVENTORY_CLERK:   "text-emerald-600",
  VIEWER:            "text-gray-500",
};

interface AuditLogDrawerProps {
  entryId: string | null;
  onClose: () => void;
}

function JsonDiff({ label, data, color }: { label: string; data: unknown; color: string }) {
  if (data == null) return null;
  const entries = Object.entries(data as Record<string, unknown>);
  if (!entries.length) return null;
  return (
    <div>
      <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 font-mono text-xs">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2 py-0.5">
            <span className="w-32 flex-shrink-0 text-gray-400">{k}</span>
            <span className="break-all text-gray-800">{JSON.stringify(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="w-28 flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-gray-800 break-all">{value}</span>
    </div>
  );
}

export function AuditLogDrawer({ entryId, onClose }: AuditLogDrawerProps) {
  const { data, loading } = useQuery(GET_AUDIT_LOG, {
    variables:  { id: entryId },
    skip:       !entryId,
    fetchPolicy: "cache-first",
  });

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const log: AuditLogEntry | undefined = data?.auditLog;
  const actionCls = log ? (ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-600") : "";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Audit Entry Detail</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex h-48 items-center justify-center">
              <Spinner size="md" />
            </div>
          )}

          {!loading && log && (
            <div className="space-y-6">
              {/* Action + Resource */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${actionCls}`}>
                  {log.action}
                </span>
                <span className="text-lg font-bold text-gray-900">{log.resource}</span>
              </div>

              {/* Core fields */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-1">
                <DetailField label="Entry ID"    value={<span className="font-mono text-xs">{log.id}</span>} />
                <DetailField label="Entity ID"   value={log.resourceId
                  ? <span className="font-mono text-xs">{log.resourceId}</span>
                  : <span className="italic text-gray-400">—</span>}
                />
                <DetailField label="Timestamp"   value={new Date(log.createdAt).toLocaleString()} />
                <DetailField label="IP Address"  value={log.ipAddress  ?? "—"} />
                <DetailField label="User Agent"  value={
                  <span className="text-xs text-gray-500 break-words">{log.userAgent ?? "—"}</span>
                } />
              </div>

              {/* User */}
              {log.user && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-1">
                  <DetailField label="Name"  value={`${log.user.firstName} ${log.user.lastName}`} />
                  <DetailField label="Email" value={log.user.email} />
                  <DetailField label="Role"  value={
                    <span className={`font-semibold ${ROLE_COLORS[log.user.role] ?? "text-gray-700"}`}>
                      {log.user.role.replace(/_/g, " ")}
                    </span>
                  } />
                </div>
              )}

              {/* Data diff */}
              {(log.oldValues != null || log.newValues != null) && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Changes</p>
                  <JsonDiff label="Before" data={log.oldValues} color="text-rose-500" />
                  <JsonDiff label="After"  data={log.newValues} color="text-emerald-600" />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
