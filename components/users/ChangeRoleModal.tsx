"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Modal }   from "@/components/ui/Modal";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { UPDATE_USER_ROLE_MUTATION, GET_USERS } from "@/lib/graphql/operations/auth";
import type { AuthUser } from "@/components/providers/AuthProvider";
import type { Role }     from "@prisma/client";

const ROLE_OPTIONS = [
  { value: "ADMIN",             label: "Admin"             },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "INVENTORY_CLERK",   label: "Inventory Clerk"   },
  { value: "VIEWER",            label: "Viewer"            },
];

interface ChangeRoleModalProps {
  user:    AuthUser | null;
  onClose: () => void;
}

export function ChangeRoleModal({ user, onClose }: ChangeRoleModalProps) {
  const [role, setRole] = useState<string>(user?.role ?? "VIEWER");

  const [updateRole, { loading, error }] = useMutation(UPDATE_USER_ROLE_MUTATION, {
    refetchQueries: [GET_USERS],
    onCompleted:    onClose,
  });

  if (!user) return null;

  return (
    <Modal open={!!user} onClose={onClose} title="Change user role">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Changing role for <span className="font-medium">{user.firstName} {user.lastName}</span>
        </p>

        <Select
          label="New role"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(e) => setRole(e.target.value)}
        />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.graphQLErrors[0]?.message ?? error.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            loading={loading}
            onClick={() => updateRole({ variables: { input: { userId: user.id, role: role as Role } } })}
          >
            Save role
          </Button>
        </div>
      </div>
    </Modal>
  );
}
