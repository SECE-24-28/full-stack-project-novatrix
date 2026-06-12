"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import type { Permission } from "@/types/auth";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageLoader } from "@/components/ui/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Redirect here when unauthenticated (default: /login).
   */
  redirectTo?: string;
  /**
   * If set, the user must have at least one of these roles.
   */
  roles?: Role[];
  /**
   * If set, the user must have this permission.
   */
  permission?: Permission;
  /**
   * Rendered instead of children when the user fails the role/permission check.
   * Defaults to a redirect to /dashboard.
   */
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  roles,
  permission,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set("callbackUrl", pathname);
      router.replace(url.pathname + url.search);
      return;
    }

    // Role check
    if (roles && !hasRole(...roles)) {
      if (!fallback) router.replace("/dashboard");
    }

    // Permission check
    if (permission && !hasPermission(permission)) {
      if (!fallback) router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, roles, permission, pathname, router, redirectTo, fallback, hasRole, hasPermission]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;

  // Role or permission denied — render fallback or null (redirect handled above)
  if (roles && !hasRole(...roles))           return fallback ? <>{fallback}</> : null;
  if (permission && !hasPermission(permission)) return fallback ? <>{fallback}</> : null;

  return <>{children}</>;
}
