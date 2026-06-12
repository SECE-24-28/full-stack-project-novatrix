"use client";

import { cn } from "@/lib/utils";

interface AlertSummaryProps {
  open:         number;
  acknowledged: number;
  resolved:     number;
  total:        number;
  loading:      boolean;
  onFilter:     (status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | undefined) => void;
  activeStatus: string | undefined;
}

interface CardProps {
  label:    string;
  value:    number;
  accent:   string;
  active:   boolean;
  onClick:  () => void;
  loading:  boolean;
}

function SummaryCard({ label, value, accent, active, onClick, loading }: CardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-5 text-left transition-all",
        active
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      )}
    >
      <p className="text-sm text-gray-500">{label}</p>
      {loading ? (
        <div className="mt-1 h-8 w-16 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className={cn("mt-1 text-3xl font-bold tabular-nums", accent)}>{value}</p>
      )}
    </button>
  );
}

export function AlertSummary({
  open, acknowledged, resolved, total, loading, onFilter, activeStatus,
}: AlertSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <SummaryCard
        label="Total alerts"
        value={total}
        accent="text-gray-900"
        active={activeStatus === undefined}
        onClick={() => onFilter(undefined)}
        loading={loading}
      />
      <SummaryCard
        label="Open"
        value={open}
        accent={open > 0 ? "text-red-600" : "text-gray-900"}
        active={activeStatus === "OPEN"}
        onClick={() => onFilter("OPEN")}
        loading={loading}
      />
      <SummaryCard
        label="Acknowledged"
        value={acknowledged}
        accent={acknowledged > 0 ? "text-yellow-600" : "text-gray-900"}
        active={activeStatus === "ACKNOWLEDGED"}
        onClick={() => onFilter("ACKNOWLEDGED")}
        loading={loading}
      />
      <SummaryCard
        label="Resolved"
        value={resolved}
        accent="text-green-600"
        active={activeStatus === "RESOLVED"}
        onClick={() => onFilter("RESOLVED")}
        loading={loading}
      />
    </div>
  );
}
