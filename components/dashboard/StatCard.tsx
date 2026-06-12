"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label:     string;
  value:     number | string;
  sub?:      string;
  href?:     string;
  accent?:   "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan" | "orange" | "teal";
  icon:      React.ReactNode;
  alert?:    boolean;
}

const ACCENT = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",   ring: "ring-blue-100"   },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600", ring: "ring-violet-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600",ring: "ring-emerald-100"},
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",  ring: "ring-amber-100"  },
  rose:    { bg: "bg-rose-50",    text: "text-rose-600",   ring: "ring-rose-100"   },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-600",   ring: "ring-cyan-100"   },
  orange:  { bg: "bg-orange-50",  text: "text-orange-600", ring: "ring-orange-100" },
  teal:    { bg: "bg-teal-50",    text: "text-teal-600",   ring: "ring-teal-100"   },
};

export function StatCard({ label, value, sub, href, accent = "blue", icon, alert }: StatCardProps) {
  const colors = ACCENT[accent];
  const card = (
    <div className={cn(
      "relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow",
      href && "hover:shadow-md cursor-pointer",
      alert && "border-rose-200 bg-rose-50/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">{label}</p>
          <p className={cn(
            "mt-1.5 text-3xl font-bold tabular-nums tracking-tight",
            alert ? "text-rose-600" : "text-gray-900"
          )}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="mt-1 truncate text-xs text-gray-400">{sub}</p>}
        </div>
        <span className={cn(
          "flex-shrink-0 rounded-xl p-2.5 ring-1",
          colors.bg, colors.text, colors.ring
        )}>
          {icon}
        </span>
      </div>
      {alert && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
      )}
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
