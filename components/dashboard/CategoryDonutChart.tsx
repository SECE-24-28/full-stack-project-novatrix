"use client";

import type { CategoryDistributionItem } from "@/types/dashboard";

const COLORS = [
  "#3b82f6","#8b5cf6","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#f97316","#6366f1",
];

const SIZE = 200, CX = SIZE / 2, CY = SIZE / 2, R = 76, INNER = 46;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, inner: number, startDeg: number, endDeg: number) {
  const gap   = Math.min(1.5, (endDeg - startDeg) * 0.05);
  const s     = startDeg + gap;
  const e     = endDeg   - gap;
  if (e <= s) return "";
  const large  = e - s > 180 ? 1 : 0;
  const o1 = polarToXY(cx, cy, r,     s);
  const o2 = polarToXY(cx, cy, r,     e);
  const i1 = polarToXY(cx, cy, inner, e);
  const i2 = polarToXY(cx, cy, inner, s);
  return [
    `M${o1.x.toFixed(2)},${o1.y.toFixed(2)}`,
    `A${r},${r} 0 ${large} 1 ${o2.x.toFixed(2)},${o2.y.toFixed(2)}`,
    `L${i1.x.toFixed(2)},${i1.y.toFixed(2)}`,
    `A${inner},${inner} 0 ${large} 0 ${i2.x.toFixed(2)},${i2.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

interface CategoryDonutChartProps { data: CategoryDistributionItem[] }

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  if (!data.length) {
    return <div className="flex h-48 items-center justify-center text-sm text-gray-400">No category data</div>;
  }

  const total  = data.reduce((s, d) => s + d.productCount, 0);
  let   cursor = 0;

  const slices = data.map((d, i) => {
    const pct   = d.productCount / total;
    const deg   = pct * 360;
    const start = cursor;
    cursor += deg;
    return { ...d, pct, start, end: cursor, color: COLORS[i % COLORS.length]! };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* Donut */}
      <div className="flex-shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
          {slices.map((s) => (
            <path
              key={s.categoryId}
              d={slicePath(CX, CY, R, INNER, s.start, s.end)}
              fill={s.color}
              className="transition-opacity duration-150 hover:opacity-80"
            />
          ))}
          {/* Centre label */}
          <text x={CX} y={CY - 6} textAnchor="middle" className="fill-gray-900" style={{ fontSize: 22, fontWeight: 700 }}>
            {total}
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 11 }}>
            products
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 sm:flex-col">
        {slices.map((s) => (
          <div key={s.categoryId} className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="truncate text-xs text-gray-600 max-w-[120px]">{s.categoryName}</span>
            <span className="ml-auto text-xs font-medium text-gray-400 tabular-nums">
              {s.productCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
