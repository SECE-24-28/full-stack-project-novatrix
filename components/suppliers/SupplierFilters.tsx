"use client";

import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { SuppliersFilterInput } from "@/types/supplier";
import type { SupplierStatus } from "@prisma/client";

const STATUS_OPTIONS = [
  { value: "ACTIVE",      label: "Active"      },
  { value: "INACTIVE",    label: "Inactive"    },
  { value: "BLACKLISTED", label: "Blacklisted" },
];

interface SupplierFiltersProps {
  filter:   SuppliersFilterInput;
  onChange: (filter: SuppliersFilterInput) => void;
  onReset:  () => void;
}

export function SupplierFilters({ filter, onChange, onReset }: SupplierFiltersProps) {
  const hasActiveFilters = !!(filter.search || filter.status);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search name, code, email…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>
      <div className="w-44">
        <Select
          placeholder="All statuses"
          value={filter.status ?? ""}
          options={STATUS_OPTIONS}
          onChange={(e) => onChange({ ...filter, status: (e.target.value as SupplierStatus) || undefined })}
        />
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
