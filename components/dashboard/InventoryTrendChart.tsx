"use client";

import { useState } from "react";
import type { InventoryTrendPoint } from "@/types/dashboard";

const W = 600, H = 260, PAD = { top: 20, right: 16, bottom: 44, left: 52 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top  - PAD.bottom;

function toPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function toArea(points: { x: number; y: number }[], baseline: number) {
  if (!points.length) return "";
  const path = toPath(points);
  return `${path} L${points[points.length - 1]!.x.toFixed(1)},${baseline} L${points[0]!.x.toFixed(1)},${baseline} Z`;
}

interface InventoryTrendChartProps { data: InventoryTrendPoint[] }

export function InventoryTrendChart({ data }: InventoryTrendChartProps) {
  const [tipIdx, setTipIdx] = useState<number | null>(null);

  if (!data.length) return <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">No data yet</div>;

  const allVals  = data.flatMap((d) => [d.incoming, d.outgoing]);
  const maxVal   = Math.max(...allVals, 1);
  const yTicks   = 4;
  const tickStep = maxVal / yTicks;
  const baseline = PAD.top + CH;

  const toXY = (idx: number, val: number) => ({
    x: PAD.left + (idx / (data.length - 1 || 1)) * CW,
    y: PAD.top  + CH - (val / maxVal) * CH,
  });

  const inPts  = data.map((d, i) => toXY(i, d.incoming));
  const outPts = data.map((d, i) => toXY(i, d.outgoing));

  return (
    <div className="relative">
      {/* Legend */}
      <div className="mb-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Incoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400" />Outgoing
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 260 }}>
        <defs>
          <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"    />
          </linearGradient>
          <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f43f5e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Grid */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y   = PAD.top + CH - (i / yTicks) * CH;
          const val = i * tickStep;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                stroke={i === 0 ? "#d1d5db" : "#f3f4f6"} strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                className="fill-gray-400" style={{ fontSize: 10 }}>
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={toArea(inPts,  baseline)} fill="url(#inGrad)"  />
        <path d={toArea(outPts, baseline)} fill="url(#outGrad)" />

        {/* Lines */}
        <path d={toPath(inPts)}  fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={toPath(outPts)} fill="none" stroke="#f43f5e" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* X labels + hover zones */}
        {data.map((d, i) => {
          const x  = PAD.left + (i / (data.length - 1 || 1)) * CW;
          const iP = inPts[i]!;
          const oP = outPts[i]!;
          return (
            <g key={i}>
              <rect x={x - 20} y={PAD.top} width={40} height={CH + 20}
                fill="transparent"
                onMouseEnter={() => setTipIdx(i)}
                onMouseLeave={() => setTipIdx(null)}
              />
              {tipIdx === i && (
                <>
                  <line x1={x} x2={x} y1={PAD.top} y2={baseline} stroke="#d1d5db" strokeWidth={1} strokeDasharray="3,3" />
                  {/* Incoming dot */}
                  <circle cx={iP.x} cy={iP.y} r={4} fill="white" stroke="#10b981" strokeWidth={2} />
                  {/* Outgoing dot */}
                  <circle cx={oP.x} cy={oP.y} r={4} fill="white" stroke="#f43f5e" strokeWidth={2} />
                  {/* Tooltip */}
                  <rect x={Math.min(x - 46, W - PAD.right - 96)} y={PAD.top + 4}
                    width={94} height={52} rx={6}
                    fill="white" stroke="#e5e7eb" strokeWidth={1}
                    style={{ filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))" }}
                  />
                  <text x={Math.min(x - 46, W - PAD.right - 96) + 47} y={PAD.top + 20}
                    textAnchor="middle" className="fill-gray-500 font-medium" style={{ fontSize: 10 }}>
                    {d.month} {d.year}
                  </text>
                  <text x={Math.min(x - 46, W - PAD.right - 96) + 47} y={PAD.top + 34}
                    textAnchor="middle" style={{ fontSize: 10, fill: "#10b981" }}>
                    +{d.incoming.toLocaleString()}
                  </text>
                  <text x={Math.min(x - 46, W - PAD.right - 96) + 47} y={PAD.top + 47}
                    textAnchor="middle" style={{ fontSize: 10, fill: "#f43f5e" }}>
                    -{d.outgoing.toLocaleString()}
                  </text>
                </>
              )}
              <text x={x} y={H - PAD.bottom + 14} textAnchor="middle"
                className="fill-gray-400" style={{ fontSize: 10 }}>
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
