"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLogout } from "@/hooks/useLogout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertBadge } from "@/components/alerts/AlertBadge";

const ROLE_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  SUPER_ADMIN:       "danger",
  ADMIN:             "warning",
  WAREHOUSE_MANAGER: "info",
  INVENTORY_CLERK:   "success",
  VIEWER:            "default",
};

interface HeaderProps { title: string; }

export function Header({ title }: HeaderProps) {
  const { user }            = useAuth();
  const { logout, loading } = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      {user && (
        <div className="flex items-center gap-3">
          <AlertBadge />
          <Badge variant={ROLE_VARIANT[user.role] ?? "default"}>
            {user.role.replace(/_/g, " ")}
          </Badge>
          <span className="text-sm text-gray-600">
            {user.firstName} {user.lastName}
          </span>
          <Button variant="ghost" size="sm" onClick={logout} loading={loading}>
            Sign out
          </Button>
        </div>
      )}
    </header>
  );
}
