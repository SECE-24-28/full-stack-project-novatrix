"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { RecentOrder } from "@/types/dashboard";

const PO_STATUS_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  DRAFT:              "default",
  SUBMITTED:          "info",
  APPROVED:           "warning",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED:           "success",
  CANCELLED:          "danger",
};

const SO_STATUS_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  DRAFT:            "default",
  CONFIRMED:        "info",
  PROCESSING:       "warning",
  PARTIALLY_SHIPPED:"warning",
  SHIPPED:          "info",
  DELIVERED:        "success",
  CANCELLED:        "danger",
  RETURNED:         "danger",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Pending", CONFIRMED: "Pending",
  RECEIVED:  "Delivered", DELIVERED: "Delivered",
};

interface RecentOrdersTableProps { data: RecentOrder[] }

export function RecentOrdersTable({ data }: RecentOrdersTableProps) {
  if (!data.length) {
    return <div className="flex items-center justify-center py-8 text-sm text-gray-400">No orders yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Party</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
            <th className="hidden px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((order) => {
            const isPO     = order.type === "PO";
            const href     = isPO ? `/purchase-orders/${order.id}` : `/sales-orders/${order.id}`;
            const variant  = isPO
              ? (PO_STATUS_VARIANT[order.status] ?? "default")
              : (SO_STATUS_VARIANT[order.status] ?? "default");
            const label    = STATUS_LABEL[order.status] ?? order.status.charAt(0) + order.status.slice(1).toLowerCase().replace(/_/g, " ");

            return (
              <tr key={`${order.type}-${order.id}`} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <Link href={href} className="group flex items-center gap-2">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide
                      ${isPO ? "bg-violet-100 text-violet-700" : "bg-cyan-100 text-cyan-700"}`}>
                      {order.type}
                    </span>
                    <span className="font-mono text-xs font-medium text-gray-700 group-hover:text-blue-600">
                      {order.number}
                    </span>
                  </Link>
                </td>
                <td className="max-w-[120px] truncate px-4 py-2.5 text-gray-600">{order.party}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={variant}>{label}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">
                  ₹{Number(order.totalAmount).toFixed(2)}
                </td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums text-xs text-gray-400 sm:table-cell">
                  {new Date(order.date).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-4 border-t border-gray-100 px-4 py-2.5">
        <Link href="/purchase-orders" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          All purchase orders →
        </Link>
        <Link href="/sales-orders" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          All sales orders →
        </Link>
      </div>
    </div>
  );
}
