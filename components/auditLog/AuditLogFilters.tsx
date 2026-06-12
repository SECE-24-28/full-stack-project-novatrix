"use client";

import { useRef, useCallback } from "react";
import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create"  },
  { value: "UPDATE", label: "Update"  },
  { value: "DELETE", label: "Delete"  },
  { value: "LOGIN",  label: "Login"   },
  { value: "LOGOUT", label: "Logout"  },
  { value: "EXPORT", label: "Export"  },
];

interface AuditLogFiltersProps {
  search:    string;
  action:    string;
  resource:  string;
  dateFrom:  string;
  dateTo:    string;
  resources: string[];
  onSearch:   (v: string) => void;
  onAction:   (v: string) => void;
  onResource: (v: string) => void;
  onDateFrom: (v: string) => void;
  onDateTo:   (v: string) => void;
  onReset:    () => void;
}

export function AuditLogFilters({
  search, action, resource, dateFrom, dateTo, resources,
  onSearch, onAction, onResource, onDateFrom, onDateTo, onReset,
}: AuditLogFiltersProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(v), 350);
  }, [onSearch]);

  const resourceOptions = resources.map((r) => ({ value: r, label: r }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            label="Search"
            placeholder="User, resource, entity ID…"
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="w-36">
          <Select
            label="Action"
            options={ACTION_OPTIONS}
            placeholder="All actions"
            value={action}
            onChange={(e) => onAction(e.target.value)}
          />
        </div>

        <div className="w-44">
          <Select
            label="Resource"
            options={resourceOptions}
            placeholder="All resources"
            value={resource}
            onChange={(e) => onResource(e.target.value)}
          />
        </div>

        <div className="w-40">
          <Input label="From" type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} />
        </div>

        <div className="w-40">
          <Input label="To" type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} />
        </div>

        <Button variant="outline" size="md" onClick={onReset} className="self-end">
          Reset
        </Button>
      </div>
    </div>
  );
}
