import type { PrismaClient, Role } from "@prisma/client";

// ─── JWT ──────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub:   string;
  email: string;
  role:  Role;
  iat?:  number;
  exp?:  number;
}

// ─── Session user (stored client-side) ───────────────────────────────────────

export interface AuthUser {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      Role;
  isActive:  boolean;
  createdAt?: string;
}

// ─── GraphQL context ──────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  email:  string;
  role:   Role;
}

export interface GraphQLContext {
  auth:      AuthContext | null;
  prisma:    PrismaClient;
  ipAddress: string | null;
  userAgent: string | null;
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export type PermissionAction =
  | "create" | "read" | "update" | "delete" | "manage";

export type PermissionResource =
  | "users" | "products" | "categories"
  | "warehouses" | "suppliers"
  | "inventory" | "orders" | "reports";

export type Permission = `${PermissionAction}:${PermissionResource}`;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "manage:users", "manage:products", "manage:categories",
    "manage:warehouses", "manage:suppliers",
    "manage:inventory", "manage:orders", "manage:reports",
  ],
  ADMIN: [
    "create:users", "read:users", "update:users",
    "manage:products", "manage:categories", "manage:warehouses",
    "manage:suppliers", "manage:inventory", "manage:orders", "read:reports",
  ],
  WAREHOUSE_MANAGER: [
    "read:users",
    "read:products", "update:products",
    "manage:warehouses", "manage:inventory",
    "read:orders", "update:orders", "read:reports",
  ],
  INVENTORY_CLERK: [
    "read:products", "read:categories",
    "read:warehouses",
    "create:inventory", "read:inventory", "update:inventory",
    "read:orders", "update:orders",
  ],
  VIEWER: [
    "read:products", "read:categories",
    "read:warehouses", "read:suppliers",
    "read:inventory", "read:orders", "read:reports",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms   = ROLE_PERMISSIONS[role] ?? [];
  const resource = permission.split(":")[1] as PermissionResource;
  return perms.includes(permission) || perms.includes(`manage:${resource}` as Permission);
}
