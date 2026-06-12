"use client";

import { useState, useMemo }        from "react";
import { useQuery }                  from "@apollo/client";
import { ProtectedRoute }            from "@/components/auth/ProtectedRoute";
import { ReportFilters }             from "@/components/reports/ReportFilters";
import { ReportTable, type ColDef }  from "@/components/reports/ReportTable";
import { ReportStatBar }             from "@/components/reports/ReportStatBar";
import { ExportButtons }             from "@/components/reports/ExportButtons";
import { ErrorMessage }              from "@/components/ui/Feedback";
import { Badge }                     from "@/components/ui/Badge";
import { GET_WAREHOUSE_REPORT }      from "@/lib/graphql/operations/report";
import type { WarehouseReportRow }   from "@/types/report";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  ACTIVE:             "success",
  INACTIVE:           "default",
  UNDER_MAINTENANCE:  "warning",
};

function UtilBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-400" : pct >= 40 ? "bg-blue-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="tabular-nums text-xs text-gray-500">{pct.toFixed(1)}%</span>
    </div>
  );
}

const COLS: ColDef<WarehouseReportRow>[] = [
  { key: "code",           header: "Code",      render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
  { key: "name",           header: "Warehouse", render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { key: "city",           header: "City"      },
  { key: "country",        header: "Country"   },
  { key: "status",         header: "Status",   render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status.replace(/_/g," ")}</Badge> },
  { key: "capacity",       header: "Capacity", align: "right", render: (r) => r.capacity?.toLocaleString() ?? "—" },
  { key: "usedUnits",      header: "Used",     align: "right", render: (r) => r.usedUnits.toLocaleString() },
  { key: "utilisationPct", header: "Utilization", render: (r) => <UtilBar pct={r.utilisationPct} /> },
  { key: "totalProducts",  header: "Products", align: "right" },
  { key: "zoneCount",      header: "Zones",    align: "right" },
  { key: "stockValue",     header: "Stock Value", align: "right",
    render: (r) => <span className="font-semibold text-gray-900">₹{Number(r.stockValue).toLocaleString(undefined,{minimumFractionDigits:2})}</span> },
  { key: "inboundOrders",  header: "PO",  align: "right" },
  { key: "outboundOrders", header: "SO",  align: "right" },
];

const EXPORT_HEADERS = ["Code","Warehouse","City","Country","Status","Capacity","Used Units","Utilization %","Products","Zones","Stock Value","Inbound PO","Outbound SO"];

export default function WarehouseReportPage() {
  return (
    <ProtectedRoute permission="read:reports">
      <WarehouseReportContent />
    </ProtectedRoute>
  );
}

function WarehouseReportContent() {
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [status,   setStatus]   = useState("");

  const filter = useMemo(() => ({
    ...(search   ? { search }   : {}),
    ...(status   ? { status }   : {}),
    ...(dateFrom ? { dateFrom: new Date(dateFrom) } : {}),
    ...(dateTo   ? { dateTo:   new Date(dateTo)   } : {}),
  }), [search, status, dateFrom, dateTo]);

  const { data, loading, error } = useQuery(GET_WAREHOUSE_REPORT, {
    variables: { filter },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.warehouseReport;
  const rows: WarehouseReportRow[] = result?.rows ?? [];

  const exportRows = rows.map((r) => [
    r.code, r.name, r.city, r.country, r.status,
    r.capacity ?? "", r.usedUnits, r.utilisationPct,
    r.totalProducts, r.zoneCount, r.stockValue,
    r.inboundOrders, r.outboundOrders,
  ]);

  function reset() { setSearch(""); setDateFrom(""); setDateTo(""); setStatus(""); }

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Warehouse Report</h2>
          <p className="mt-0.5 text-sm text-gray-500">Capacity utilization, stock value, and order activity per warehouse</p>
        </div>
        <ExportButtons
          filename="warehouse-report"
          sheetName="Warehouses"
          headers={EXPORT_HEADERS}
          rows={exportRows}
          disabled={loading}
        />
      </div>

      {result && (
        <ReportStatBar stats={[
          { label: "Warehouses",   value: result.totalRows,                      accent: "blue"    },
          { label: "Total Stock",  value: result.totalStock.toLocaleString(),     accent: "emerald" },
          { label: "Avg Util",     value: `${result.avgUtil.toFixed(1)}%`,        accent: "violet"  },
        ]} />
      )}

      <ReportFilters
        search={search} dateFrom={dateFrom} dateTo={dateTo}
        extras={[
          { key: "status", label: "Status", type: "select", placeholder: "All statuses",
            options: [
              { value:"ACTIVE",label:"Active"},
              { value:"INACTIVE",label:"Inactive"},
              { value:"UNDER_MAINTENANCE",label:"Under Maintenance"},
            ],
          },
        ]}
        extraVals={{ status }}
        onSearch={setSearch} onDateFrom={setDateFrom} onDateTo={setDateTo}
        onExtra={(k, v) => { if (k === "status") setStatus(v); }}
        onReset={reset}
      />

      <ReportTable<WarehouseReportRow>
        cols={COLS}
        rows={rows}
        loading={loading}
        keyFn={(r) => r.warehouseId}
      />
    </div>
  );
}
