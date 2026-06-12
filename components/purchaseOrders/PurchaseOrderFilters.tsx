"use client";

import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { PurchaseOrdersFilterInput, PurchaseOrderStatus } from "@/types/purchaseOrder";

const STATUS_OPTIONS = [
  { value: "SUBMITTED",          label: "Pending"   },
  { value: "APPROVED",           label: "Approved"  },
  { value: "PARTIALLY_RECEIVED", label: "Partial"   },
  { value: "RECEIVED",           label: "Delivered" },
  { value: "CANCELLED",          label: "Cancelled" },
];

interface PurchaseOrderFiltersProps {
  filter:   PurchaseOrdersFilterInput;
  onChange: (f: PurchaseOrdersFilterInput) => void;
  onReset:  () => void;
}

export function PurchaseOrderFilters({ filter, onChange, onReset }: PurchaseOrderFiltersProps) {
  const hasActive = !!(filter.search || filter.status);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search PO number, supplier…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>
      <div className="w-44">
        <Select
          placeholder="All statuses"
          value={filter.status ?? ""}
          options={STATUS_OPTIONS}
          onChange={(e) => onChange({ ...filter, status: (e.target.value as PurchaseOrderStatus) || undefined })}
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>Clear filters</Button>
      )}
    </div>
  );
}
