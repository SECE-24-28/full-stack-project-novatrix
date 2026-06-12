import { cn } from "@/lib/utils";

interface ChartCardProps {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
  className?: string;
  action?:   React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-gray-100" />
      <div className="h-[260px] animate-pulse rounded-lg bg-gray-50" />
    </div>
  );
}
