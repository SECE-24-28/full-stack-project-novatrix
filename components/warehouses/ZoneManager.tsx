"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Input }  from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge }  from "@/components/ui/Badge";
import { Modal }  from "@/components/ui/Modal";
import { CREATE_ZONE, UPDATE_ZONE, DELETE_ZONE, GET_WAREHOUSE } from "@/lib/graphql/operations/warehouse";
import type { WarehouseZone } from "@/types/warehouse";

// ─── Zone row ─────────────────────────────────────────────────────────────────

function ZoneRow({
  zone,
  warehouseId,
  onEdit,
  onDelete,
}: {
  zone:        WarehouseZone;
  warehouseId: string;
  onEdit:      (z: WarehouseZone) => void;
  onDelete:    (z: WarehouseZone) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Badge variant="info">{zone.code}</Badge>
        <span className="text-sm font-medium text-gray-800">{zone.name}</span>
        {zone.description && <span className="hidden text-xs text-gray-400 sm:inline">{zone.description}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{zone.stockCount} SKU{zone.stockCount !== 1 ? "s" : ""}</span>
        <Button variant="ghost" size="sm" onClick={() => onEdit(zone)}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(zone)} className="text-red-500 hover:text-red-700">Delete</Button>
      </div>
    </div>
  );
}

// ─── Zone form ────────────────────────────────────────────────────────────────

interface ZoneFormState { name: string; code: string; description: string; }
type ZoneFormErrors = Partial<Record<keyof ZoneFormState, string>>;

function ZoneForm({
  warehouseId,
  zone,
  onDone,
}: {
  warehouseId: string;
  zone?:       WarehouseZone;
  onDone:      () => void;
}) {
  const isEdit = !!zone;
  const [form,   setForm]   = useState<ZoneFormState>({ name: zone?.name ?? "", code: zone?.code ?? "", description: zone?.description ?? "" });
  const [errors, setErrors] = useState<ZoneFormErrors>({});
  const [serverError, setServerError] = useState("");

  const refetch = [{ query: GET_WAREHOUSE, variables: { id: warehouseId } }];

  const [createZone, { loading: creating }] = useMutation(CREATE_ZONE, {
    refetchQueries: refetch, onCompleted: onDone,
    onError: (e) => setServerError(e.graphQLErrors[0]?.message ?? e.message),
  });
  const [updateZone, { loading: updating }] = useMutation(UPDATE_ZONE, {
    refetchQueries: refetch, onCompleted: onDone,
    onError: (e) => setServerError(e.graphQLErrors[0]?.message ?? e.message),
  });

  const loading = creating || updating;

  function validate() {
    const errs: ZoneFormErrors = {};
    if (!form.name.trim()) errs.name = "Zone name is required.";
    if (!form.code.trim()) errs.code = "Zone code is required.";
    else if (!/^[A-Z0-9_-]+$/i.test(form.code)) errs.code = "Code may only contain letters, numbers, hyphens and underscores.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (isEdit) {
      updateZone({ variables: { input: { id: zone!.id, name: form.name.trim(), code: form.code.trim().toUpperCase(), description: form.description.trim() || undefined } } });
    } else {
      createZone({ variables: { input: { warehouseId, name: form.name.trim(), code: form.code.trim().toUpperCase(), description: form.description.trim() || undefined } } });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Zone name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={errors.name} placeholder="e.g. Aisle A" />
        <Input label="Code *"      value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} error={errors.code} placeholder="e.g. AISLE-A" className="uppercase" />
      </div>
      <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional notes…" />
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" loading={loading}>{isEdit ? "Save" : "Add zone"}</Button>
      </div>
    </form>
  );
}

// ─── Delete confirm ────────────────────────────────────────────────────────────

function DeleteZoneDialog({
  zone,
  warehouseId,
  onClose,
}: {
  zone:        WarehouseZone;
  warehouseId: string;
  onClose:     () => void;
}) {
  const [deleteZone, { loading, error }] = useMutation(DELETE_ZONE, {
    refetchQueries: [{ query: GET_WAREHOUSE, variables: { id: warehouseId } }],
    onCompleted:    onClose,
  });

  return (
    <Modal open onClose={onClose} title="Delete zone" description="This cannot be undone.">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Delete zone <span className="font-semibold">{zone.name}</span> (<code>{zone.code}</code>)?
        </p>
        {error && <p className="text-sm text-red-600">{error.graphQLErrors[0]?.message ?? error.message}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" loading={loading} onClick={() => deleteZone({ variables: { id: zone.id } })}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ZoneManagerProps {
  warehouseId: string;
  zones:       WarehouseZone[];
}

export function ZoneManager({ warehouseId, zones }: ZoneManagerProps) {
  const [showForm,    setShowForm]    = useState(false);
  const [editingZone, setEditingZone] = useState<WarehouseZone | null>(null);
  const [deletingZone,setDeletingZone]= useState<WarehouseZone | null>(null);

  return (
    <div className="space-y-3">
      {/* Zone list */}
      {zones.length === 0 && !showForm && (
        <p className="rounded-md border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
          No zones configured yet. Add your first zone below.
        </p>
      )}

      {zones.map((z) =>
        editingZone?.id === z.id ? (
          <div key={z.id} className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <ZoneForm warehouseId={warehouseId} zone={z} onDone={() => setEditingZone(null)} />
          </div>
        ) : (
          <ZoneRow
            key={z.id}
            zone={z}
            warehouseId={warehouseId}
            onEdit={(zone) => { setShowForm(false); setEditingZone(zone); }}
            onDelete={setDeletingZone}
          />
        )
      )}

      {/* Add zone inline form */}
      {showForm && !editingZone && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <ZoneForm warehouseId={warehouseId} onDone={() => setShowForm(false)} />
        </div>
      )}

      {!showForm && !editingZone && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add zone
        </Button>
      )}

      {/* Delete confirmation */}
      {deletingZone && (
        <DeleteZoneDialog zone={deletingZone} warehouseId={warehouseId} onClose={() => setDeletingZone(null)} />
      )}
    </div>
  );
}
