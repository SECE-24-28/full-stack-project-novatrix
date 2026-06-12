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
import { GET_INVENTORY_REPORT }      from "@/lib/graphql/operations/report";
import type { InventoryReportRow }   from "@/types/report";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  ACTIVE:       "success",
  INACTIVE:     "default",
  DISCONTINUED: "danger",
};

const COLS: ColDef<InventoryReportRow>[] = [
  { key: "sku",           header: "SKU",       render: (r) => <span className="font-mono text-xs text-gray-500">{r.sku}</span> },
  { key: "name",          header: "Product",   render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { key: "category",      header: "Category"  },
  { key: "supplier",      header: "Supplier"  },
  { key: "warehouseName", header: "Warehouse" },
  { key: "quantity",      header: "Qty",       align: "right" },
  { key: "reservedQty",   header: "Reserved",  align: "right" },
  { key: "availableQty",  header: "Available", align: "right",
    render: (r) => (
      <span className={r.availableQty <= 0 ? "font-semibold text-rose-600" : r.availableQty <= r.reorderPoint ? "font-semibold text-amber-600" : "text-gray-700"}>
        {r.availableQty}
      </span>
    ),
  },
  { key: "reorderPoint",  header: "Reorder",  align: "right" },
  { key: "costPrice",     header: "Cost",     align: "right", render: (r) => `₹${Number(r.costPrice).toFixed(2)}`  },
  { key: "sellingPrice",  header: "Sell",     align: "right", render: (r) => `₹${Number(r.sellingPrice).toFixed(2)}` },
  { key: "stockValue",    header: "Value",    align: "right", render: (r) => <span className="font-medium">₹{Number(r.stockValue).toFixed(2)}</span> },
  { key: "status",        header: "Status",   render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge> },
];

const EXPORT_HEADERS = ["SKU","Product","Category","Supplier","Warehouse","Qty","Reserved","Available","Reorder Pt","Cost Price","Sell Price","Stock Value","Status"];

export default function InventoryReportPage() {
  return (
    <ProtectedRoute permission="read:reports">
      <InventoryReportContent />
    </ProtectedRoute>
  );
}

function InventoryReportContent() {
  const [search,      setSearch]      = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [status,      setStatus]      = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const filter = useMemo(() => ({
    ...(search      ? { search }      : {}),
    ...(status      ? { status }      : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(dateFrom    ? { dateFrom: new Date(dateFrom) } : {}),
    ...(dateTo      ? { dateTo:   new Date(dateTo)   } : {}),
  }), [search, status, warehouseId, dateFrom, dateTo]);

  const { data, loading, error } = useQuery(GET_INVENTORY_REPORT, {
    variables: { filter },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.inventoryReport;
  const rows: InventoryReportRow[] = result?.rows ?? [];

  const exportRows = rows.map((r) => [
    r.sku, r.name, r.category, r.supplier, r.warehouseName,
    r.quantity, r.reservedQty, r.availableQty, r.reorderPoint,
    r.costPrice, r.sellingPrice, r.stockValue, r.status,
  ]);

  function reset() { setSearch(""); setDateFrom(""); setDateTo(""); setStatus(""); setWarehouseId(""); }

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Report</h2>
          <p className="mt-0.5 text-sm text-gray-500">Stock levels, values, and availability across all warehouses</p>
        </div>
        <ExportButtons
          filename="inventory-report"
          sheetName="Inventory"
          headers={EXPORT_HEADERS}
          rows={exportRows}
          disabled={loading}
        />
      </div>

      {/* Stats */}
      {result && (
        <ReportStatBar stats={[
          { label: "Total Rows",    value: result.totalRows,                            accent: "blue"    },
          { label: "Stock Value",   value: `₹${Number(result.totalValue).toLocaleString(undefined,{minimumFractionDigits:2})}`, accent: "emerald" },
          { label: "Low Stock",     value: result.lowStockCount,                        accent: "amber"   },
          { label: "Out of Stock",  value: result.outOfStockCount,                      accent: "rose"    },
        ]} />
      )}

      {/* Filters */}
      <ReportFilters
        search={search} dateFrom={dateFrom} dateTo={dateTo}
        extras={[
          { key: "status", label: "Status", type: "select", placeholder: "All statuses",
            options: [{ value:"ACTIVE",label:"Active"},{ value:"INACTIVE",label:"Inactive"},{ value:"DISCONTINUED",label:"Discontinued"}] },
        ]}
        extraVals={{ status, warehouseId }}
        onSearch={setSearch} onDateFrom={setDateFrom} onDateTo={setDateTo}
        onExtra={(k, v) => { if (k === "status") setStatus(v); if (k === "warehouseId") setWarehouseId(v); }}
        onReset={reset}
      />

      {/* Table */}
      <ReportTable<InventoryReportRow>
        cols={COLS}
        rows={rows}
        loading={loading}
        keyFn={(r) => `${r.productId}-${r.warehouseCode}`}
      />
    </div>
  );
}
