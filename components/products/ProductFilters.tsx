"use client";

import { useQuery } from "@apollo/client";
import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { GET_CATEGORIES } from "@/lib/graphql/operations/product";
import type { ProductsFilterInput } from "@/types/product";
import type { ProductStatus } from "@prisma/client";

interface ProductFiltersProps {
  filter:    ProductsFilterInput;
  onChange:  (filter: ProductsFilterInput) => void;
  onReset:   () => void;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE",       label: "Active"       },
  { value: "INACTIVE",     label: "Inactive"     },
  { value: "DISCONTINUED", label: "Discontinued" },
];

export function ProductFilters({ filter, onChange, onReset }: ProductFiltersProps) {
  const { data } = useQuery(GET_CATEGORIES, {
    variables:   { pagination: { page: 1, limit: 100 } },
    fetchPolicy: "cache-first",
  });

  const categoryOptions = (data?.categories?.nodes ?? []).map(
    (c: { id: string; name: string }) => ({ value: c.id, label: c.name })
  );

  const hasActiveFilters = !!(filter.search || filter.status || filter.categoryId);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search name, SKU, barcode…"
          value={filter.search ?? ""}
          onChange={(e) => onChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>

      <div className="w-44">
        <Select
          placeholder="All statuses"
          value={filter.status ?? ""}
          options={STATUS_OPTIONS}
          onChange={(e) => onChange({ ...filter, status: (e.target.value as ProductStatus) || undefined })}
        />
      </div>

      <div className="w-48">
        <Select
          placeholder="All categories"
          value={filter.categoryId ?? ""}
          options={categoryOptions}
          onChange={(e) => onChange({ ...filter, categoryId: e.target.value || undefined })}
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
