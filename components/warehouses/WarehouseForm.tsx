"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { createWarehouseSchema, updateWarehouseSchema } from "@/lib/validators/warehouse";
import {
  CREATE_WAREHOUSE, UPDATE_WAREHOUSE, GET_WAREHOUSES,
} from "@/lib/graphql/operations/warehouse";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Warehouse } from "@/types/warehouse";
import type { WarehouseStatus } from "@prisma/client";

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  name: string; code: string; address: string; city: string; country: string;
  phone: string; email: string; capacity: string; status: WarehouseStatus;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const DEFAULTS: FormState = {
  name: "", code: "", address: "", city: "", country: "",
  phone: "", email: "", capacity: "", status: "ACTIVE",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE",            label: "Active"            },
  { value: "INACTIVE",          label: "Inactive"          },
  { value: "UNDER_MAINTENANCE", label: "Under maintenance" },
];

function warehouseToForm(w: Warehouse): FormState {
  return {
    name:     w.name,
    code:     w.code,
    address:  w.address  ?? "",
    city:     w.city     ?? "",
    country:  w.country  ?? "",
    phone:    w.phone    ?? "",
    email:    w.email    ?? "",
    capacity: w.capacity != null ? String(w.capacity) : "",
    status:   w.status,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WarehouseForm({ warehouse }: { warehouse?: Warehouse }) {
  const router    = useRouter();
  const isEditing = !!warehouse;

  const [form,        setForm]        = useState<FormState>(warehouse ? warehouseToForm(warehouse) : DEFAULTS);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => { if (warehouse) setForm(warehouseToForm(warehouse)); }, [warehouse]);

  const [createWarehouse, { loading: creating }] = useMutation(CREATE_WAREHOUSE, {
    refetchQueries: [GET_WAREHOUSES],
    onCompleted:    (d) => router.push(`/warehouses/${d.createWarehouse.id}`),
    onError:        (e) => setServerError(e.graphQLErrors[0]?.message ?? e.message),
  });

  const [updateWarehouse, { loading: updating }] = useMutation(UPDATE_WAREHOUSE, {
    refetchQueries: [GET_WAREHOUSES],
    onCompleted:    () => router.push(`/warehouses/${warehouse!.id}`),
    onError:        (e) => setServerError(e.graphQLErrors[0]?.message ?? e.message),
  });

  const loading = creating || updating;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((p) => ({ ...p, [name]: undefined }));
  }

  function buildInput() {
    return {
      name:     form.name.trim(),
      code:     form.code.trim().toUpperCase(),
      address:  form.address.trim()  || undefined,
      city:     form.city.trim()     || undefined,
      country:  form.country.trim()  || undefined,
      phone:    form.phone.trim()    || undefined,
      email:    form.email.trim()    || undefined,
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
      status:   form.status,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const payload = isEditing ? { ...buildInput(), id: warehouse!.id } : buildInput();
    const schema  = isEditing ? updateWarehouseSchema : createWarehouseSchema;
    const result  = schema.safeParse(payload);

    if (!result.success) {
      const fe = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const mapped: FormErrors = {};
      for (const [k, v] of Object.entries(fe)) {
        if (v?.[0]) mapped[k as keyof FormState] = v[0];
      }
      setErrors(mapped);
      return;
    }

    if (isEditing) {
      updateWarehouse({ variables: { input: payload } });
    } else {
      createWarehouse({ variables: { input: payload } });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Warehouse identity</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Warehouse name *" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. London Distribution Centre" />
          <Input label="Code *" name="code" value={form.code} onChange={handleChange} error={errors.code} placeholder="e.g. LDC-01" className="uppercase" hint="Unique identifier — letters, numbers, hyphens only." />
          <Input label="Capacity (units)" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} error={errors.capacity} hint="Leave blank for unlimited." />
          <Select label="Status" name="status" value={form.status} options={STATUS_OPTIONS} onChange={handleChange} />
        </CardContent>
      </Card>

      {/* ── Location ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Location</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Street address" name="address" value={form.address} onChange={handleChange} error={errors.address} placeholder="123 Industrial Way" />
          </div>
          <Input label="City"    name="city"    value={form.city}    onChange={handleChange} error={errors.city}    placeholder="London"         />
          <Input label="Country" name="country" value={form.country} onChange={handleChange} error={errors.country} placeholder="United Kingdom" />
        </CardContent>
      </Card>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+44 20 0000 0000" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="warehouse@company.com" />
        </CardContent>
      </Card>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {isEditing ? "Save changes" : "Create warehouse"}
        </Button>
      </div>
    </form>
  );
}
