"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { GET_OPEN_ALERT_COUNT } from "@/lib/graphql/operations/alert";

export function AlertBadge() {
  const { data } = useQuery(GET_OPEN_ALERT_COUNT, {
    fetchPolicy:     "cache-and-network",
    pollInterval:    60_000, // refresh every 60 s
  });

  const count: number = data?.openAlertCount ?? 0;

  return (
    <Link
      href="/alerts"
      className="relative inline-flex items-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      title={count > 0 ? `${count} open alert${count === 1 ? "" : "s"}` : "No open alerts"}
    >
      {/* Bell icon */}
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
