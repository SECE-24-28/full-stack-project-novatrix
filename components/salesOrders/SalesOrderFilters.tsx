"use client";

import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { SalesOrdersFilterInput, SalesOrderStatus } from "@/types/salesOrder";

const STATUS_OPTIONS = [
  { value: "CONFIRMED",  label: "Pending"    },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED",    label: "Shipped"    },
  { value: "DELIVERED",  label: "Delivered"  },
  { value: "CANCELLED",  label: "Cancelled"  },
];

interface SalesOrderFiltersProps {
  filter:   SalesOrdersFilterInput;
  onChange: (f: SalesOrdersFilterInput) => void;
  onReset:  () => void;
}

export function SalesOrderFilters({ filter, onChange, onReset }: SalesOrderFiltersProps) {
  const hasActive = !!(filter.search || filter.status);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search SO number, customer…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>
      <div className="w-44">
        <Select
          placeholder="All statuses"
          value={filter.status ?? ""}
          options={STATUS_OPTIONS}
          onChange={(e) => onChange({ ...filter, status: (e.target.value as SalesOrderStatus) || undefined })}
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>Clear filters</Button>
      )}
    </div>
  );
}
