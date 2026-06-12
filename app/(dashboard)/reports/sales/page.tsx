"use client";

import { useState, useMemo }       from "react";
import { useQuery }                 from "@apollo/client";
import { ProtectedRoute }           from "@/components/auth/ProtectedRoute";
import { ReportFilters }            from "@/components/reports/ReportFilters";
import { ReportTable, type ColDef } from "@/components/reports/ReportTable";
import { ReportStatBar }            from "@/components/reports/ReportStatBar";
import { ExportButtons }            from "@/components/reports/ExportButtons";
import { ErrorMessage }             from "@/components/ui/Feedback";
import { Badge }                    from "@/components/ui/Badge";
import { GET_SALES_REPORT }         from "@/lib/graphql/operations/report";
import type { SalesReportRow }      from "@/types/report";

const STATUS_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  DRAFT:             "default",
  CONFIRMED:         "info",
  PROCESSING:        "warning",
  PARTIALLY_SHIPPED: "warning",
  SHIPPED:           "info",
  DELIVERED:         "success",
  CANCELLED:         "danger",
  RETURNED:          "danger",
};

const COLS: ColDef<SalesReportRow>[] = [
  { key: "soNumber",      header: "SO #",       render: (r) => <span className="font-mono text-xs font-medium text-blue-600">{r.soNumber}</span> },
  { key: "customerName",  header: "Customer",   render: (r) => <span className="font-medium text-gray-900">{r.customerName}</span> },
  { key: "warehouse",     header: "Warehouse"  },
  { key: "status",        header: "Status",    render: (r) => {
    const label = r.status.charAt(0) + r.status.slice(1).toLowerCase().replace(/_/g," ");
    return <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{label}</Badge>;
  }},
  { key: "orderDate",     header: "Order Date",  render: (r) => new Date(r.orderDate).toLocaleDateString() },
  { key: "deliveredDate", header: "Delivered",   render: (r) => r.deliveredDate ? new Date(r.deliveredDate).toLocaleDateString() : "—" },
  { key: "itemCount",     header: "Items",       align: "right" },
  { key: "subtotal",      header: "Subtotal",    align: "right", render: (r) => `₹${Number(r.subtotal).toFixed(2)}`  },
  { key: "taxAmount",     header: "Tax",         align: "right", render: (r) => `₹${Number(r.taxAmount).toFixed(2)}` },
  { key: "discountAmount",header: "Discount",    align: "right", render: (r) => `₹${Number(r.discountAmount).toFixed(2)}` },
  { key: "totalAmount",   header: "Total",       align: "right", render: (r) => <span className="font-semibold text-gray-900">₹{Number(r.totalAmount).toFixed(2)}</span> },
];

const EXPORT_HEADERS = ["SO #","Customer","Warehouse","Status","Order Date","Delivered","Items","Subtotal","Tax","Discount","Total"];

const SO_STATUSES = ["DRAFT","CONFIRMED","PROCESSING","PARTIALLY_SHIPPED","SHIPPED","DELIVERED","CANCELLED","RETURNED"];

export default function SalesReportPage() {
  return (
    <ProtectedRoute permission="read:reports">
      <SalesReportContent />
    </ProtectedRoute>
  );
}

function SalesReportContent() {
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

  const { data, loading, error } = useQuery(GET_SALES_REPORT, {
    variables: { filter },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.salesReport;
  const rows: SalesReportRow[] = result?.rows ?? [];

  const exportRows = rows.map((r) => [
    r.soNumber, r.customerName, r.warehouse, r.status,
    new Date(r.orderDate).toLocaleDateString(),
    r.deliveredDate ? new Date(r.deliveredDate).toLocaleDateString() : "",
    r.itemCount, r.subtotal, r.taxAmount, r.discountAmount, r.totalAmount,
  ]);

  function reset() { setSearch(""); setDateFrom(""); setDateTo(""); setStatus(""); }

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
          <p className="mt-0.5 text-sm text-gray-500">Sales orders, revenue, tax and discount summary</p>
        </div>
        <ExportButtons
          filename="sales-report"
          sheetName="Sales"
          headers={EXPORT_HEADERS}
          rows={exportRows}
          disabled={loading}
        />
      </div>

      {result && (
        <ReportStatBar stats={[
          { label: "Total Orders",   value: result.orderCount,   accent: "blue"    },
          { label: "Total Revenue",  value: `₹${Number(result.totalRevenue).toLocaleString(undefined,{minimumFractionDigits:2})}`,  accent: "emerald" },
          { label: "Total Tax",      value: `₹${Number(result.totalTax).toLocaleString(undefined,{minimumFractionDigits:2})}`,      accent: "violet"  },
          { label: "Total Discount", value: `₹${Number(result.totalDiscount).toLocaleString(undefined,{minimumFractionDigits:2})}`, accent: "amber"   },
        ]} />
      )}

      <ReportFilters
        search={search} dateFrom={dateFrom} dateTo={dateTo}
        extras={[
          { key: "status", label: "Status", type: "select", placeholder: "All statuses",
            options: SO_STATUSES.map((s) => ({ value: s, label: s.charAt(0)+s.slice(1).toLowerCase().replace(/_/g," ") })) },
        ]}
        extraVals={{ status }}
        onSearch={setSearch} onDateFrom={setDateFrom} onDateTo={setDateTo}
        onExtra={(k, v) => { if (k === "status") setStatus(v); }}
        onReset={reset}
      />

      <ReportTable<SalesReportRow>
        cols={COLS}
        rows={rows}
        loading={loading}
        keyFn={(r) => r.orderId}
      />
    </div>
  );
}
