"use client";

import type { WarehouseUtilizationItem } from "@/types/dashboard";

interface WarehouseUtilizationChartProps { data: WarehouseUtilizationItem[] }

function utilizationColor(pct: number): string {
  if (pct >= 90) return "bg-rose-500";
  if (pct >= 70) return "bg-amber-400";
  if (pct >= 40) return "bg-blue-500";
  return "bg-emerald-500";
}

function utilizationTextColor(pct: number): string {
  if (pct >= 90) return "text-rose-600";
  if (pct >= 70) return "text-amber-600";
  if (pct >= 40) return "text-blue-600";
  return "text-emerald-600";
}

export function WarehouseUtilizationChart({ data }: WarehouseUtilizationChartProps) {
  if (!data.length) {
    return <div className="flex h-48 items-center justify-center text-sm text-gray-400">No warehouse data</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((wh) => {
        const pct     = wh.capacity ? wh.utilisationPct : null;
        const barPct  = pct ?? 0;
        const color   = utilizationColor(barPct);
        const txtColor= utilizationTextColor(barPct);

        return (
          <div key={wh.warehouseId}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-700">{wh.warehouseName}</span>
                <span className="hidden font-mono text-xs text-gray-400 sm:inline">({wh.warehouseCode})</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="tabular-nums text-xs text-gray-400">
                  {wh.usedUnits.toLocaleString()}
                  {wh.capacity ? ` / ${wh.capacity.toLocaleString()} units` : " units"}
                </span>
                {pct !== null && (
                  <span className={`w-10 text-right text-xs font-semibold tabular-nums ${txtColor}`}>
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.min(barPct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Under 40%</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"    />40–70%</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400"   />70–90%</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"    />Over 90%</span>
      </div>
    </div>
  );
}
