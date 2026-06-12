import type { Warehouse } from "@/types/warehouse";

interface StatCardProps {
  label:    string;
  value:    React.ReactNode;
  sub?:     string;
  accent?:  "blue" | "green" | "yellow" | "red" | "gray";
  children?: React.ReactNode;
}

function StatCard({ label, value, sub, accent = "blue", children }: StatCardProps) {
  const ring = {
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red:    "bg-red-50 text-red-700",
    gray:   "bg-gray-50 text-gray-700",
  }[accent];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${ring.split(" ")[1]}`}>{value}</p>
      {sub     && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      {children}
    </div>
  );
}

interface CapacityBarProps {
  used:  number;
  total: number;
  pct:   number;
}

function CapacityBar({ used, total, pct }: CapacityBarProps) {
  const colour =
    pct >= 90 ? "bg-red-500"
    : pct >= 70 ? "bg-yellow-400"
    : "bg-blue-500";

  return (
    <div className="mt-3 space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-2 rounded-full transition-all ${colour}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-xs text-gray-400">{used.toLocaleString()} / {total.toLocaleString()} units used</p>
    </div>
  );
}

interface WarehouseStatsProps {
  warehouse: Warehouse;
}

export function WarehouseStats({ warehouse }: WarehouseStatsProps) {
  const { capacityStats: cs, summary: s } = warehouse;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* Capacity */}
      <StatCard
        label="Capacity utilisation"
        value={cs.utilisationPct != null ? `${cs.utilisationPct}%` : "Unlimited"}
        sub={cs.totalCapacity ? `${cs.availableCapacity?.toLocaleString()} units free` : undefined}
        accent={
          cs.utilisationPct == null ? "gray"
          : cs.utilisationPct >= 90 ? "red"
          : cs.utilisationPct >= 70 ? "yellow"
          : "blue"
        }
      >
        {cs.totalCapacity != null && cs.utilisationPct != null && (
          <CapacityBar used={cs.usedCapacity} total={cs.totalCapacity} pct={cs.utilisationPct} />
        )}
      </StatCard>

      {/* Total units */}
      <StatCard
        label="Units in stock"
        value={s.totalUnits.toLocaleString()}
        sub={`across ${s.totalProducts} products`}
        accent="green"
      />

      {/* Low stock */}
      <StatCard
        label="Low stock alerts"
        value={s.lowStockCount}
        sub="products at / below reorder point"
        accent={s.lowStockCount > 0 ? "yellow" : "green"}
      />

      {/* Zones */}
      <StatCard
        label="Storage zones"
        value={s.zoneCount}
        sub="active zones configured"
        accent="gray"
      />
    </div>
  );
}
