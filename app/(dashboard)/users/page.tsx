"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ProtectedRoute }  from "@/components/auth/ProtectedRoute";
import { UserTable }       from "@/components/users/UserTable";
import { UserFilters }     from "@/components/users/UserFilters";
import { ChangeRoleModal } from "@/components/users/ChangeRoleModal";
import { ErrorMessage }    from "@/components/ui/Feedback";
import {
  GET_USERS,
  ACTIVATE_USER_MUTATION,
  DEACTIVATE_USER_MUTATION,
} from "@/lib/graphql/operations/auth";
import { useAuth }         from "@/components/providers/AuthProvider";
import type { AuthUser }   from "@/components/providers/AuthProvider";
import type { Role }       from "@prisma/client";

export default function UsersPage() {
  return (
    <ProtectedRoute permission="read:users">
      <UsersContent />
    </ProtectedRoute>
  );
}

function UsersContent() {
  const { user: me } = useAuth();

  const [search,   setSearch]   = useState("");
  const [role,     setRole]     = useState("");
  const [isActive, setIsActive] = useState("");
  const [page,     setPage]     = useState(1);
  const [editUser, setEditUser] = useState<AuthUser | null>(null);

  const filter = {
    ...(search   ? { search }                         : {}),
    ...(role     ? { role: role as Role }             : {}),
    ...(isActive ? { isActive: isActive === "true" }  : {}),
  };

  const { data, loading, error } = useQuery(GET_USERS, {
    variables:   { filter, pagination: { page, limit: 20 } },
    fetchPolicy: "cache-and-network",
  });

  const refetchOpts = { refetchQueries: [GET_USERS] };

  const [activateUser]   = useMutation(ACTIVATE_USER_MUTATION,   refetchOpts);
  const [deactivateUser] = useMutation(DEACTIVATE_USER_MUTATION, refetchOpts);

  const handleToggleActive = useCallback((user: AuthUser) => {
    if (user.isActive) {
      deactivateUser({ variables: { userId: user.id } });
    } else {
      activateUser({ variables: { userId: user.id } });
    }
  }, [activateUser, deactivateUser]);

  const handleReset = useCallback(() => {
    setSearch(""); setRole(""); setIsActive(""); setPage(1);
  }, []);

  const users = data?.users?.nodes ?? [];
  const pageInfo = data?.users?.pageInfo;

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="mt-1 text-sm text-gray-500">
            {pageInfo?.totalCount ?? 0} user{pageInfo?.totalCount !== 1 ? "s" : ""} registered
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total",             value: pageInfo?.totalCount ?? 0,            color: "bg-blue-50 text-blue-700 border-blue-100"     },
          { label: "Admins",            value: null,                                  color: "bg-amber-50 text-amber-700 border-amber-100"   },
          { label: "Warehouse Managers",value: null,                                  color: "bg-cyan-50 text-cyan-700 border-cyan-100"      },
          { label: "Active",            value: users.filter((u: AuthUser) => u.isActive).length,   color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Inactive",          value: users.filter((u: AuthUser) => !u.isActive).length,  color: "bg-gray-50 text-gray-600 border-gray-100"          },
        ]
          .filter((s) => s.value !== null)
          .map((s) => (
            <div key={s.label} className={`rounded-lg border px-4 py-2.5 ${s.color}`}>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
      </div>

      {/* Filters */}
      <UserFilters
        search={search}   onSearch={(v) => { setSearch(v);   setPage(1); }}
        role={role}       onRole={(v)   => { setRole(v);     setPage(1); }}
        isActive={isActive} onStatus={(v) => { setIsActive(v); setPage(1); }}
        onReset={handleReset}
      />

      {/* Table */}
      <UserTable
        nodes={users}
        loading={loading && !data}
        totalCount={pageInfo?.totalCount  ?? 0}
        totalPages={pageInfo?.totalPages  ?? 1}
        currentPage={pageInfo?.currentPage ?? 1}
        hasNext={pageInfo?.hasNextPage    ?? false}
        hasPrev={pageInfo?.hasPreviousPage ?? false}
        currentUserId={me?.id ?? ""}
        onPageChange={setPage}
        onEditRole={setEditUser}
        onToggleActive={handleToggleActive}
      />

      {/* Change role modal */}
      <ChangeRoleModal
        user={editUser}
        onClose={() => setEditUser(null)}
      />
    </div>
  );
}
