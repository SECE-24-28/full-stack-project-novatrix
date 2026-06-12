"use client";

import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN",       label: "Super Admin"       },
  { value: "ADMIN",             label: "Admin"             },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "INVENTORY_CLERK",   label: "Inventory Clerk"   },
  { value: "VIEWER",            label: "Viewer"            },
];

const STATUS_OPTIONS = [
  { value: "true",  label: "Active"   },
  { value: "false", label: "Inactive" },
];

interface UserFiltersProps {
  search:    string;
  role:      string;
  isActive:  string;
  onSearch:  (v: string) => void;
  onRole:    (v: string) => void;
  onStatus:  (v: string) => void;
  onReset:   () => void;
}

export function UserFilters({ search, role, isActive, onSearch, onRole, onStatus, onReset }: UserFiltersProps) {
  const hasActive = !!(search || role || isActive);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          placeholder="All roles"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(e) => onRole(e.target.value)}
        />
      </div>
      <div className="w-36">
        <Select
          placeholder="All statuses"
          value={isActive}
          options={STATUS_OPTIONS}
          onChange={(e) => onStatus(e.target.value)}
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
