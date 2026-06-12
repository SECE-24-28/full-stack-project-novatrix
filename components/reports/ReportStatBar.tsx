interface StatItem {
  label: string;
  value: string | number;
  accent?: "blue" | "emerald" | "amber" | "rose" | "violet";
}

const ACCENT_CLASSES = {
  blue:    "bg-blue-50 text-blue-700 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber:   "bg-amber-50 text-amber-700 border-amber-100",
  rose:    "bg-rose-50 text-rose-700 border-rose-100",
  violet:  "bg-violet-50 text-violet-700 border-violet-100",
};

export function ReportStatBar({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((s) => {
        const cls = ACCENT_CLASSES[s.accent ?? "blue"];
        return (
          <div key={s.label} className={`rounded-lg border px-4 py-2.5 ${cls}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}
