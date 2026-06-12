"use client";

import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { InventoryTransactionsFilterInput, TransactionType } from "@/types/inventory";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "PURCHASE_RECEIPT", label: "Purchase receipt" },
  { value: "SALES_ISSUE",      label: "Sales issue"      },
  { value: "TRANSFER_IN",      label: "Transfer in"      },
  { value: "TRANSFER_OUT",     label: "Transfer out"     },
  { value: "ADJUSTMENT_IN",    label: "Adjustment in"    },
  { value: "ADJUSTMENT_OUT",   label: "Adjustment out"   },
  { value: "RETURN_IN",        label: "Return in"        },
  { value: "RETURN_OUT",       label: "Return out"       },
  { value: "DAMAGE_WRITE_OFF", label: "Damage write-off" },
];

interface TransactionFiltersProps {
  filter:   InventoryTransactionsFilterInput;
  onChange: (f: InventoryTransactionsFilterInput) => void;
  onReset:  () => void;
}

export function TransactionFilters({ filter, onChange, onReset }: TransactionFiltersProps) {
  const hasActive = !!(filter.search || filter.type || filter.dateFrom || filter.dateTo);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <Input
          placeholder="Search product, SKU, ref…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>
      <div className="w-48">
        <Select
          placeholder="All types"
          value={filter.type ?? ""}
          options={TYPE_OPTIONS}
          onChange={(e) => onChange({ ...filter, type: (e.target.value as TransactionType) || undefined })}
        />
      </div>
      <div className="w-40">
        <Input
          type="date"
          label="From"
          value={filter.dateFrom ? filter.dateFrom.slice(0, 10) : ""}
          onChange={(e) => onChange({ ...filter, dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        />
      </div>
      <div className="w-40">
        <Input
          type="date"
          label="To"
          value={filter.dateTo ? filter.dateTo.slice(0, 10) : ""}
          onChange={(e) => onChange({ ...filter, dateTo: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : undefined })}
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>Clear filters</Button>
      )}
    </div>
  );
}
