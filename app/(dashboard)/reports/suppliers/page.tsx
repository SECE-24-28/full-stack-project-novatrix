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
import { GET_SUPPLIER_REPORT }       from "@/lib/graphql/operations/report";
import type { SupplierReportRow }    from "@/types/report";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  ACTIVE:      "success",
  INACTIVE:    "default",
  BLACKLISTED: "danger",
};

const COLS: ColDef<SupplierReportRow>[] = [
  { key: "code",          header: "Code",     render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
  { key: "name",          header: "Supplier", render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { key: "contactName",   header: "Contact"  },
  { key: "email",         header: "Email",    render: (r) => <span className="text-xs text-blue-600">{r.email}</span> },
  { key: "country",       header: "Country"  },
  { key: "status",        header: "Status",   render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge> },
  { key: "paymentTerms",  header: "Terms",    align: "right", render: (r) => `${r.paymentTerms}d` },
  { key: "productCount",  header: "Products", align: "right" },
  { key: "totalOrders",   header: "Orders",   align: "right" },
  { key: "totalSpend",    header: "Total Spend", align: "right",
    render: (r) => <span className="font-semibold text-gray-900">₹{Number(r.totalSpend).toLocaleString(undefined,{minimumFractionDigits:2})}</span> },
  { key: "lastOrderDate", header: "Last Order",
    render: (r) => r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString() : "—" },
];

const EXPORT_HEADERS = ["Code","Supplier","Contact","Email","Phone","Country","Status","Payment Terms","Products","Orders","Total Spend","Last Order"];

export default function SupplierReportPage() {
  return (
    <ProtectedRoute permission="read:reports">
      <SupplierReportContent />
    </ProtectedRoute>
  );
}

function SupplierReportContent() {
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

  const { data, loading, error } = useQuery(GET_SUPPLIER_REPORT, {
    variables: { filter },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.supplierReport;
  const rows: SupplierReportRow[] = result?.rows ?? [];

  const exportRows = rows.map((r) => [
    r.code, r.name, r.contactName, r.email, r.phone, r.country,
    r.status, `${r.paymentTerms}d`, r.productCount,
    r.totalOrders, r.totalSpend,
    r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString() : "",
  ]);

  function reset() { setSearch(""); setDateFrom(""); setDateTo(""); setStatus(""); }

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Report</h2>
          <p className="mt-0.5 text-sm text-gray-500">Supplier performance, spend, and order history</p>
        </div>
        <ExportButtons
          filename="supplier-report"
          sheetName="Suppliers"
          headers={EXPORT_HEADERS}
          rows={exportRows}
          disabled={loading}
        />
      </div>

      {result && (
        <ReportStatBar stats={[
          { label: "Total Suppliers", value: result.totalRows,  accent: "blue"    },
          { label: "Active",          value: result.activeCount, accent: "emerald" },
          { label: "Total Spend",     value: `₹${Number(result.totalSpend).toLocaleString(undefined,{minimumFractionDigits:2})}`, accent: "violet" },
        ]} />
      )}

      <ReportFilters
        search={search} dateFrom={dateFrom} dateTo={dateTo}
        extras={[
          { key: "status", label: "Status", type: "select", placeholder: "All statuses",
            options: [{ value:"ACTIVE",label:"Active"},{ value:"INACTIVE",label:"Inactive"},{ value:"BLACKLISTED",label:"Blacklisted"}] },
        ]}
        extraVals={{ status }}
        onSearch={setSearch} onDateFrom={setDateFrom} onDateTo={setDateTo}
        onExtra={(k, v) => { if (k === "status") setStatus(v); }}
        onReset={reset}
      />

      <ReportTable<SupplierReportRow>
        cols={COLS}
        rows={rows}
        loading={loading}
        keyFn={(r) => r.supplierId}
      />
    </div>
  );
}
