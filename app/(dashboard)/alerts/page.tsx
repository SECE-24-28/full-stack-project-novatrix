"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { ProtectedRoute }  from "@/components/auth/ProtectedRoute";
import { AlertSummary }    from "@/components/alerts/AlertSummary";
import { AlertFilters }    from "@/components/alerts/AlertFilters";
import { AlertTable }      from "@/components/alerts/AlertTable";
import { ErrorMessage }    from "@/components/ui/Feedback";
import {
  GET_STOCK_ALERTS,
  GET_ALERT_SUMMARY,
} from "@/lib/graphql/operations/alert";
import type { AlertsFilterInput, AlertStatus } from "@/types/alert";

const DEFAULT_FILTER: AlertsFilterInput = { status: "OPEN" };

export default function AlertsPage() {
  return (
    <ProtectedRoute permission="read:inventory">
      <AlertsContent />
    </ProtectedRoute>
  );
}

function AlertsContent() {
  const [filter, setFilter] = useState<AlertsFilterInput>(DEFAULT_FILTER);
  const [page,   setPage]   = useState(1);

  // Summary counts (independent of current filter)
  const { data: summaryData, loading: summaryLoading } = useQuery(GET_ALERT_SUMMARY, {
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000,
  });

  const { data, loading, error } = useQuery(GET_STOCK_ALERTS, {
    variables:   { filter, pagination: { page, limit: 20 } },
    fetchPolicy: "cache-and-network",
  });

  function handleFilterChange(f: AlertsFilterInput) {
    setFilter(f);
    setPage(1);
  }

  function handleStatusFilter(status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | undefined) {
    handleFilterChange({ ...filter, status });
  }

  const open         = summaryData?.open?.pageInfo?.totalCount         ?? 0;
  const acknowledged = summaryData?.acknowledged?.pageInfo?.totalCount ?? 0;
  const resolved     = summaryData?.resolved?.pageInfo?.totalCount     ?? 0;
  const total        = summaryData?.all?.pageInfo?.totalCount          ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Stock Alerts</h2>
        <p className="mt-1 text-sm text-gray-500">
          Automatically generated when products fall below minimum stock levels.
        </p>
      </div>

      {/* ── Summary cards (act as quick-filters) ── */}
      <AlertSummary
        open={open}
        acknowledged={acknowledged}
        resolved={resolved}
        total={total}
        loading={summaryLoading}
        activeStatus={filter.status}
        onFilter={handleStatusFilter}
      />

      {/* ── Filters ── */}
      <AlertFilters
        filter={filter}
        onChange={handleFilterChange}
        onReset={() => { setFilter(DEFAULT_FILTER); setPage(1); }}
      />

      {/* ── Table ── */}
      {error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <AlertTable
          data={data?.stockAlerts}
          loading={loading}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
