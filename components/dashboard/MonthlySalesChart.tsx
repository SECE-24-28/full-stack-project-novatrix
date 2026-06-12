"use client";

import { useState } from "react";
import type { MonthlySalesPoint } from "@/types/dashboard";

const W = 600, H = 260, PAD = { top: 20, right: 16, bottom: 44, left: 56 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top  - PAD.bottom;

interface TooltipState { x: number; y: number; point: MonthlySalesPoint }

interface MonthlySalesChartProps { data: MonthlySalesPoint[] }

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  if (!data.length) return <EmptyChart label="No sales data yet" />;

  const revenues  = data.map((d) => Number(d.revenue));
  const maxRev    = Math.max(...revenues, 1);
  const barW      = Math.max(CW / data.length - 6, 8);
  const barGap    = CW / data.length;

  // Y-axis ticks
  const yTicks = 5;
  const tickStep = maxRev / yTicks;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 260 }}>
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = PAD.top + CH - (i / yTicks) * CH;
          const val = i * tickStep;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                stroke={i === 0 ? "#d1d5db" : "#f3f4f6"} strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                className="fill-gray-400" style={{ fontSize: 10 }}>
                {val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(0)}`}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const rev    = Number(d.revenue);
          const barH   = Math.max((rev / maxRev) * CH, rev > 0 ? 3 : 0);
          const x      = PAD.left + i * barGap + (barGap - barW) / 2;
          const y      = PAD.top + CH - barH;
          const isHov  = tip?.point === d;

          return (
            <g key={i}
              onMouseEnter={(e) => setTip({ x: x + barW / 2, y, point: d })}
              onMouseLeave={() => setTip(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={barH} rx={4}
                fill={isHov ? "#2563eb" : "#3b82f6"}
                opacity={isHov ? 1 : 0.85}
                className="transition-all duration-150"
              />
              {/* X label */}
              <text
                x={x + barW / 2} y={H - PAD.bottom + 14}
                textAnchor="middle" className="fill-gray-400"
                style={{ fontSize: 10 }}
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tip && (
          <g>
            <rect
              x={Math.min(tip.x - 44, W - PAD.right - 92)}
              y={Math.max(tip.y - 52, 4)}
              width={88} height={44} rx={6}
              fill="white" stroke="#e5e7eb" strokeWidth={1}
              style={{ filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))" }}
            />
            <text
              x={Math.min(tip.x, W - PAD.right - 48) + 0}
              y={Math.max(tip.y - 52, 4) + 16}
              textAnchor="middle"
              className="fill-gray-900 font-semibold"
              style={{ fontSize: 11 }}
            >
              ${Number(tip.point.revenue).toLocaleString()}
            </text>
            <text
              x={Math.min(tip.x, W - PAD.right - 48) + 0}
              y={Math.max(tip.y - 52, 4) + 32}
              textAnchor="middle"
              className="fill-gray-400"
              style={{ fontSize: 10 }}
            >
              {tip.point.salesOrders} order{tip.point.salesOrders !== 1 ? "s" : ""}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">{label}</div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-[260px] animate-pulse rounded-lg bg-gray-50" />
  );
}
