"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery }              from "@apollo/client";
import { ProtectedRoute }        from "@/components/auth/ProtectedRoute";
import { AuditLogFilters }       from "@/components/auditLog/AuditLogFilters";
import { AuditLogTable }         from "@/components/auditLog/AuditLogTable";
import { AuditLogDrawer }        from "@/components/auditLog/AuditLogDrawer";
import { AuditLogStats }         from "@/components/auditLog/AuditLogStats";
import { ErrorMessage }          from "@/components/ui/Feedback";
import { Button }                from "@/components/ui/Button";
import {
  GET_AUDIT_LOGS,
  GET_AUDIT_LOG_STATS,
  GET_AUDIT_LOG_RESOURCES,
} from "@/lib/graphql/operations/auditLog";
import type { AuditLogEntry, AuditLogStats as StatsType } from "@/types/auditLog";

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  return (
    <ProtectedRoute permission="manage:reports">
      <AuditLogContent />
    </ProtectedRoute>
  );
}

function AuditLogContent() {
  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search,   setSearch]   = useState("");
  const [action,   setAction]   = useState("");
  const [resource, setResource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(1);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [showStats,   setShowStats]   = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const filter = useMemo(() => ({
    ...(search   ? { search }   : {}),
    ...(action   ? { action }   : {}),
    ...(resource ? { resource } : {}),
    ...(dateFrom ? { dateFrom: new Date(dateFrom) } : {}),
    ...(dateTo   ? { dateTo:   new Date(dateTo)   } : {}),
  }), [search, action, resource, dateFrom, dateTo]);

  const { data, loading, error } = useQuery(GET_AUDIT_LOGS, {
    variables:   { filter, pagination: { page, limit: PAGE_SIZE } },
    fetchPolicy: "cache-and-network",
  });

  const { data: statsData, loading: statsLoading } = useQuery(GET_AUDIT_LOG_STATS, {
    skip: !showStats,
    fetchPolicy: "cache-first",
  });

  const { data: resourcesData } = useQuery(GET_AUDIT_LOG_RESOURCES, {
    fetchPolicy: "cache-first",
  });

  const logs: AuditLogEntry[]     = data?.auditLogs?.nodes ?? [];
  const pageInfo                  = data?.auditLogs?.pageInfo;
  const stats: StatsType | null   = statsData?.auditLogStats ?? null;
  const resources: string[]       = resourcesData?.auditLogResources ?? [];

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((entry: AuditLogEntry) => {
    setSelectedId((prev) => prev === entry.id ? null : entry.id);
  }, []);

  const handleReset = useCallback(() => {
    setSearch(""); setAction(""); setResource("");
    setDateFrom(""); setDateTo(""); setPage(1);
  }, []);

  const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
    setter(v); setPage(1);
  }, []);

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Complete record of all system actions — who did what and when
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStats((s) => !s)}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {showStats ? "Hide Stats" : "Show Stats"}
        </Button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      {showStats && (
        statsLoading
          ? <div className="grid grid-cols-2 gap-4">
              {[0,1].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
          : stats && <AuditLogStats stats={stats} />
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <AuditLogFilters
        search={search} action={action} resource={resource}
        dateFrom={dateFrom} dateTo={dateTo} resources={resources}
        onSearch={handleFilterChange(setSearch)}
        onAction={handleFilterChange(setAction)}
        onResource={handleFilterChange(setResource)}
        onDateFrom={handleFilterChange(setDateFrom)}
        onDateTo={handleFilterChange(setDateTo)}
        onReset={handleReset}
      />

      {/* ── Result count ───────────────────────────────────────────────────── */}
      {pageInfo && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {pageInfo.totalCount.toLocaleString()} entr{pageInfo.totalCount !== 1 ? "ies" : "y"} found
            {pageInfo.totalPages > 1 && ` — page ${pageInfo.currentPage} of ${pageInfo.totalPages}`}
          </span>
          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <AuditLogTable
        rows={logs}
        loading={loading && !data}
        onSelect={handleSelect}
        selected={selectedId}
      />

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!pageInfo.hasPreviousPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pageInfo.totalPages, 7) }, (_, i) => {
              const tp   = pageInfo.totalPages;
              const cp   = pageInfo.currentPage;
              let   pageNum: number;

              if (tp <= 7)             pageNum = i + 1;
              else if (cp <= 4)        pageNum = i + 1;
              else if (cp >= tp - 3)   pageNum = tp - 6 + i;
              else                     pageNum = cp - 3 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                    pageNum === cp
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!pageInfo.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      {selectedId && (
        <AuditLogDrawer
          entryId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
