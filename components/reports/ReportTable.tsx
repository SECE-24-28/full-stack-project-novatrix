"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface ColDef<T> {
  key:       keyof T | string;
  header:    string;
  render?:   (row: T) => React.ReactNode;
  align?:    "left" | "right" | "center";
  sortable?: boolean;
  className?:string;
}

interface ReportTableProps<T> {
  cols:     ColDef<T>[];
  rows:     T[];
  loading?: boolean;
  keyFn:    (row: T) => string;
}

type SortDir = "asc" | "desc";

export function ReportTable<T extends Record<string, unknown>>({
  cols, rows, loading, keyFn,
}: ReportTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const an = Number(av), bn = Number(bv);
      const cmp = !isNaN(an) && !isNaN(bn)
        ? an - bn
        : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const alignClass = { left: "text-left", right: "text-right", center: "text-center" };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              {cols.map((c) => (
                <div key={String(c.key)} className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400 shadow-sm">
        No records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {cols.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => col.sortable !== false && handleSort(String(col.key))}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
                  alignClass[col.align ?? "left"],
                  col.sortable !== false && "cursor-pointer select-none hover:text-gray-700",
                  col.className,
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable !== false && sortKey === String(col.key) && (
                    <span className="text-blue-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((row) => (
            <tr key={keyFn(row)} className="hover:bg-gray-50 transition-colors">
              {cols.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-2.5 text-gray-700",
                    alignClass[col.align ?? "left"],
                    col.className,
                  )}
                >
                  {col.render ? col.render(row) : (row[col.key as keyof T] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
