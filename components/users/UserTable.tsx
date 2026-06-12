"use client";

import { Badge }      from "@/components/ui/Badge";
import { Button }     from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Spinner }    from "@/components/ui/Spinner";
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/Table";
import type { AuthUser } from "@/components/providers/AuthProvider";

const ROLE_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  SUPER_ADMIN:       "danger",
  ADMIN:             "warning",
  WAREHOUSE_MANAGER: "info",
  INVENTORY_CLERK:   "success",
  VIEWER:            "default",
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:       "Super Admin",
  ADMIN:             "Admin",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  INVENTORY_CLERK:   "Inventory Clerk",
  VIEWER:            "Viewer",
};

interface UserTableProps {
  nodes:        AuthUser[];
  loading:      boolean;
  totalCount:   number;
  totalPages:   number;
  currentPage:  number;
  hasNext:      boolean;
  hasPrev:      boolean;
  currentUserId:string;
  onPageChange: (p: number) => void;
  onEditRole:   (user: AuthUser) => void;
  onToggleActive:(user: AuthUser) => void;
}

export function UserTable({
  nodes, loading, totalCount, totalPages, currentPage,
  hasNext, hasPrev, currentUserId, onPageChange, onEditRole, onToggleActive,
}: UserTableProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!nodes.length) return <EmptyState title="No users found" description="Try adjusting your filters." />;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((user) => (
            <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
              <TableCell>
                <div className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
              <TableCell>
                <Badge variant={ROLE_VARIANT[user.role] ?? "default"}>
                  {ROLE_LABEL[user.role] ?? user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    Inactive
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                {user.id !== currentUserId && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => onEditRole(user)}
                      title="Change role"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => onToggleActive(user)}
                      title={user.isActive ? "Deactivate" : "Activate"}
                      className={user.isActive ? "text-red-400 hover:text-red-600" : "text-emerald-500 hover:text-emerald-700"}
                    >
                      {user.isActive ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span> —{" "}
            <span className="font-medium">{totalCount}</span> users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => onPageChange(currentPage - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
