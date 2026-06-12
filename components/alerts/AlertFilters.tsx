"use client";

import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { AlertsFilterInput, AlertType, AlertStatus } from "@/types/alert";

const TYPE_OPTIONS = [
  { value: "LOW_STOCK",          label: "Low stock"          },
  { value: "OUT_OF_STOCK",       label: "Out of stock"       },
  { value: "OVERSTOCK",          label: "Overstock"          },
  { value: "EXPIRY_APPROACHING", label: "Expiry approaching" },
];

const STATUS_OPTIONS = [
  { value: "OPEN",         label: "Open"         },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "RESOLVED",     label: "Resolved"     },
];

interface AlertFiltersProps {
  filter:   AlertsFilterInput;
  onChange: (f: AlertsFilterInput) => void;
  onReset:  () => void;
}

export function AlertFilters({ filter, onChange, onReset }: AlertFiltersProps) {
  const hasActive = !!(filter.search || filter.type || filter.status);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <Input
          placeholder="Search product, SKU…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>
      <div className="w-44">
        <Select
          placeholder="All types"
          value={filter.type ?? ""}
          options={TYPE_OPTIONS}
          onChange={(e) => onChange({ ...filter, type: (e.target.value as AlertType) || undefined })}
        />
      </div>
      <div className="w-44">
        <Select
          placeholder="All statuses"
          value={filter.status ?? ""}
          options={STATUS_OPTIONS}
          onChange={(e) => onChange({ ...filter, status: (e.target.value as AlertStatus) || undefined })}
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>Clear filters</Button>
      )}
    </div>
  );
}
