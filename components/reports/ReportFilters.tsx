"use client";

import { useCallback, useRef } from "react";
import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface FilterField {
  key:         string;
  label:       string;
  type:        "select";
  options:     { value: string; label: string }[];
  placeholder: string;
}

interface ReportFiltersProps {
  search:     string;
  dateFrom:   string;
  dateTo:     string;
  extras?:    FilterField[];
  extraVals?: Record<string, string>;
  onSearch:   (v: string) => void;
  onDateFrom: (v: string) => void;
  onDateTo:   (v: string) => void;
  onExtra?:   (key: string, val: string) => void;
  onReset:    () => void;
}

export function ReportFilters({
  search, dateFrom, dateTo, extras = [], extraVals = {},
  onSearch, onDateFrom, onDateTo, onExtra, onReset,
}: ReportFiltersProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(v), 350);
  }, [onSearch]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="min-w-[200px] flex-1">
          <Input
            label="Search"
            placeholder="Search…"
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div className="w-40">
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFrom(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => onDateTo(e.target.value)}
          />
        </div>

        {/* Dynamic selects */}
        {extras.map((f) => (
          <div key={f.key} className="w-44">
            <Select
              label={f.label}
              options={f.options}
              placeholder={f.placeholder}
              value={extraVals[f.key] ?? ""}
              onChange={(e) => onExtra?.(f.key, e.target.value)}
            />
          </div>
        ))}

        <Button variant="outline" size="md" onClick={onReset} className="self-end">
          Reset
        </Button>
      </div>
    </div>
  );
}
