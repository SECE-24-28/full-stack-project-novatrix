"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ProtectedRoute }   from "@/components/auth/ProtectedRoute";
import { RoleGate }         from "@/components/auth/RoleGate";
import { WarehouseStats }   from "@/components/warehouses/WarehouseStats";
import { ZoneManager }      from "@/components/warehouses/ZoneManager";
import { StockAssignment }  from "@/components/warehouses/StockAssignment";
import { Badge }            from "@/components/ui/Badge";
import { Button }           from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader }       from "@/components/ui/Spinner";
import { ErrorMessage }     from "@/components/ui/Feedback";
import { GET_WAREHOUSE }    from "@/lib/graphql/operations/warehouse";
import type { Warehouse }   from "@/types/warehouse";

const STATUS_VARIANT = {
  ACTIVE:            "success",
  INACTIVE:          "default",
  UNDER_MAINTENANCE: "warning",
} as const;

type Tab = "stock" | "zones" | "info";

interface Props { params: Promise<{ id: string }> }

export default function WarehouseDashboardPage({ params }: Props) {
  const { id } = use(params);
  return (
    <ProtectedRoute permission="read:warehouses">
      <WarehouseDashboard id={id} />
    </ProtectedRoute>
  );
}

function WarehouseDashboard({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>("stock");
  const { data, loading, error } = useQuery(GET_WAREHOUSE, { variables: { id } });
  const warehouse: Warehouse | undefined = data?.warehouse;

  if (loading) return <PageLoader />;
  if (error || !warehouse) return <ErrorMessage message={error?.message ?? "Warehouse not found."} />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{warehouse.name}</h2>
            <Badge variant={STATUS_VARIANT[warehouse.status] ?? "default"}>
              {warehouse.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="mt-0.5 font-mono text-sm text-gray-500">{warehouse.code}</p>
          {(warehouse.city || warehouse.country) && (
            <p className="mt-1 text-sm text-gray-500">
              {[warehouse.address, warehouse.city, warehouse.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <RoleGate permission="update:warehouses">
            <Link href={`/warehouses/${id}/edit`}>
              <Button variant="outline">Edit warehouse</Button>
            </Link>
          </RoleGate>
          <Link href="/warehouses">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </div>

      {/* ── KPI stats ───────────────────────────────────────────────────── */}
      <WarehouseStats warehouse={warehouse} />

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {(["stock", "zones", "info"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors capitalize ${
                  tab === t
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "stock" ? "Inventory" : t === "zones" ? "Zones" : "Details"}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {/* ── Inventory tab ──────────────────────────────────────────────── */}
          {tab === "stock" && (
            <StockAssignment warehouseId={id} zones={warehouse.zones} />
          )}

          {/* ── Zones tab ──────────────────────────────────────────────────── */}
          {tab === "zones" && (
            <Card>
              <CardHeader>
                <CardTitle>Storage zones</CardTitle>
              </CardHeader>
              <CardContent>
                <RoleGate
                  permission="manage:warehouses"
                  fallback={
                    <ul className="space-y-2">
                      {warehouse.zones.map((z) => (
                        <li key={z.id} className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5">
                          <Badge variant="info">{z.code}</Badge>
                          <span className="text-sm text-gray-800">{z.name}</span>
                        </li>
                      ))}
                      {warehouse.zones.length === 0 && (
                        <li className="text-sm text-gray-400">No zones configured.</li>
                      )}
                    </ul>
                  }
                >
                  <ZoneManager warehouseId={id} zones={warehouse.zones} />
                </RoleGate>
              </CardContent>
            </Card>
          )}

          {/* ── Details tab ────────────────────────────────────────────────── */}
          {tab === "info" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>General</CardTitle></CardHeader>
                <CardContent>
                  <dl className="space-y-2.5">
                    {[
                      ["Name",      warehouse.name],
                      ["Code",      warehouse.code],
                      ["Status",    warehouse.status.replace(/_/g, " ")],
                      ["Capacity",  warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : "Unlimited"],
                      ["Created",   new Date(warehouse.createdAt).toLocaleDateString()],
                      ["Updated",   new Date(warehouse.updatedAt).toLocaleDateString()],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-gray-100 py-1.5 last:border-0">
                        <dt className="text-sm text-gray-500">{label}</dt>
                        <dd className="text-sm font-medium text-gray-900">{value ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Contact &amp; location</CardTitle></CardHeader>
                <CardContent>
                  <dl className="space-y-2.5">
                    {[
                      ["Address", warehouse.address],
                      ["City",    warehouse.city],
                      ["Country", warehouse.country],
                      ["Phone",   warehouse.phone],
                      ["Email",   warehouse.email],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-gray-100 py-1.5 last:border-0">
                        <dt className="text-sm text-gray-500">{label}</dt>
                        <dd className="text-sm font-medium text-gray-900">{value ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
