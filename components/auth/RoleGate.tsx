"use client";

import type { Role } from "@prisma/client";
import type { Permission } from "@/types/auth";
import { useAuth } from "@/components/providers/AuthProvider";

interface RoleGateProps {
  children: React.ReactNode;
  /** Show children only when user has ALL of these permissions. */
  permission?: Permission;
  /** Show children only when user has one of these roles. */
  roles?: Role[];
  /** Rendered when the condition is NOT met (optional). */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on the current user's role / permission.
 * Does NOT redirect — use <ProtectedRoute> for that.
 *
 * @example
 * <RoleGate permission="manage:users">
 *   <DeleteUserButton />
 * </RoleGate>
 */
export function RoleGate({ children, permission, roles, fallback = null }: RoleGateProps) {
  const { isAuthenticated, hasPermission, hasRole } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;
  if (permission && !hasPermission(permission)) return <>{fallback}</>;
  if (roles && !hasRole(...roles)) return <>{fallback}</>;

  return <>{children}</>;
}
