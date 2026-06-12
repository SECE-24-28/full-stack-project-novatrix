const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500",
  UPDATE: "bg-blue-500",
  DELETE: "bg-rose-500",
  LOGIN:  "bg-violet-500",
  LOGOUT: "bg-gray-400",
  EXPORT: "bg-amber-500",
};

interface StatsData {
  total:      number;
  byAction:   { label: string; count: number }[];
  byResource: { label: string; count: number }[];
}

export function AuditLogStats({ stats }: { stats: StatsData }) {
  const maxAction   = Math.max(...stats.byAction.map((s)   => s.count), 1);
  const maxResource = Math.max(...stats.byResource.map((s) => s.count), 1);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* By action */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">By Action</h3>
          <span className="text-xs text-gray-400">{stats.total.toLocaleString()} total</span>
        </div>
        <div className="space-y-2.5">
          {stats.byAction.map((item) => {
            const pct = Math.round((item.count / maxAction) * 100);
            const bar = ACTION_COLORS[item.label] ?? "bg-gray-400";
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="tabular-nums text-gray-400">{item.count.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By resource */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">By Resource</h3>
        <div className="space-y-2.5">
          {stats.byResource.map((item) => {
            const pct = Math.round((item.count / maxResource) * 100);
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="tabular-nums text-gray-400">{item.count.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
