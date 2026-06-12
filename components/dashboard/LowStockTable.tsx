"use client";

import Link from "next/link";
import type { LowStockProduct } from "@/types/dashboard";

interface LowStockTableProps { data: LowStockProduct[] }

export function LowStockTable({ data }: LowStockTableProps) {
  if (!data.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        All products are adequately stocked.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Stock</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Reorder at</th>
            <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((p) => {
            const pct      = Math.min((p.totalQuantity / Math.max(p.reorderPoint, 1)) * 100, 100);
            const isZero   = p.totalQuantity === 0;
            const barColor = isZero ? "bg-rose-500" : pct < 50 ? "bg-amber-400" : "bg-yellow-300";

            return (
              <tr key={p.productId} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-gray-900 truncate max-w-[160px]">{p.name}</div>
                  <div className="font-mono text-xs text-gray-400">{p.sku}</div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`tabular-nums font-semibold ${isZero ? "text-rose-600" : "text-amber-600"}`}>
                    {p.totalQuantity}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">
                  {p.reorderPoint}
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-gray-100 px-4 py-2.5">
        <Link href="/inventory?lowStock=true" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          View all low stock →
        </Link>
      </div>
    </div>
  );
}
