"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { createSupplierSchema, updateSupplierSchema } from "@/lib/validators/supplier";
import { CREATE_SUPPLIER, UPDATE_SUPPLIER, GET_SUPPLIERS } from "@/lib/graphql/operations/supplier";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Supplier } from "@/types/supplier";
import type { SupplierStatus } from "@prisma/client";

type FormState = {
  name:         string;
  code:         string;
  contactName:  string;
  email:        string;
  phone:        string;
  address:      string;
  city:         string;
  country:      string;
  gstNumber:    string;
  status:       SupplierStatus;
  paymentTerms: string;
  notes:        string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const DEFAULT_FORM: FormState = {
  name: "", code: "", contactName: "", email: "", phone: "",
  address: "", city: "", country: "", gstNumber: "",
  status: "ACTIVE", paymentTerms: "30", notes: "",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE",      label: "Active"      },
  { value: "INACTIVE",    label: "Inactive"    },
  { value: "BLACKLISTED", label: "Blacklisted" },
];

function supplierToForm(s: Supplier): FormState {
  return {
    name:         s.name,
    code:         s.code,
    contactName:  s.contactName  ?? "",
    email:        s.email        ?? "",
    phone:        s.phone        ?? "",
    address:      s.address      ?? "",
    city:         s.city         ?? "",
    country:      s.country      ?? "",
    gstNumber:    s.gstNumber    ?? "",
    status:       s.status,
    paymentTerms: String(s.paymentTerms),
    notes:        s.notes        ?? "",
  };
}

function formToInput(form: FormState) {
  return {
    name:         form.name.trim(),
    code:         form.code.trim().toUpperCase(),
    contactName:  form.contactName.trim()  || undefined,
    email:        form.email.trim()        || undefined,
    phone:        form.phone.trim()        || undefined,
    address:      form.address.trim()      || undefined,
    city:         form.city.trim()         || undefined,
    country:      form.country.trim()      || undefined,
    gstNumber:    form.gstNumber.trim()    || undefined,
    status:       form.status,
    paymentTerms: parseInt(form.paymentTerms, 10),
    notes:        form.notes.trim()        || undefined,
  };
}

interface SupplierFormProps {
  supplier?: Supplier;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router    = useRouter();
  const isEditing = !!supplier;

  const [form,        setForm]        = useState<FormState>(supplier ? supplierToForm(supplier) : DEFAULT_FORM);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (supplier) setForm(supplierToForm(supplier));
  }, [supplier]);

  const [createSupplier, { loading: creating }] = useMutation(CREATE_SUPPLIER, {
    refetchQueries: [GET_SUPPLIERS],
    onCompleted:    () => router.push("/suppliers"),
    onError:        (err) => setServerError(err.graphQLErrors[0]?.message ?? err.message),
  });

  const [updateSupplier, { loading: updating }] = useMutation(UPDATE_SUPPLIER, {
    refetchQueries: [GET_SUPPLIERS],
    onCompleted:    () => router.push(`/suppliers/${supplier!.id}`),
    onError:        (err) => setServerError(err.graphQLErrors[0]?.message ?? err.message),
  });

  const loading = creating || updating;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const schema  = isEditing ? updateSupplierSchema : createSupplierSchema;
    const payload = isEditing ? { ...formToInput(form), id: supplier!.id } : formToInput(form);
    const result  = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const mapped: FormErrors = {};
      for (const [key, msgs] of Object.entries(fieldErrors)) {
        if (msgs?.[0]) mapped[key as keyof FormState] = msgs[0];
      }
      setErrors(mapped);
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    const input = formToInput(form);
    if (isEditing) {
      updateSupplier({ variables: { input: { ...input, id: supplier!.id } } });
    } else {
      createSupplier({ variables: { input } });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ── Basic info ── */}
      <Card>
        <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Supplier name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Acme Supplies Ltd."
          />
          <Input
            label="Supplier code *"
            name="code"
            value={form.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="e.g. ACME-001"
            className="uppercase"
          />
          <Input
            label="Contact name"
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            error={errors.contactName}
            placeholder="Primary contact person"
          />
          <Input
            label="GST number"
            name="gstNumber"
            value={form.gstNumber}
            onChange={handleChange}
            error={errors.gstNumber}
            placeholder="e.g. 22AAAAA0000A1Z5"
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={handleChange}
          />
          <Input
            label="Payment terms (days)"
            name="paymentTerms"
            type="number"
            min="0"
            max="365"
            step="1"
            value={form.paymentTerms}
            onChange={handleChange}
            error={errors.paymentTerms}
            hint="Number of days before payment is due."
          />
        </CardContent>
      </Card>

      {/* ── Contact ── */}
      <Card>
        <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="supplier@example.com"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="+91 98765 43210"
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              error={errors.address}
              placeholder="Street address"
            />
          </div>
          <Input
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            error={errors.city}
            placeholder="Mumbai"
          />
          <Input
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            error={errors.country}
            placeholder="India"
          />
        </CardContent>
      </Card>

      {/* ── Notes ── */}
      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Optional notes about this supplier…"
          />
        </CardContent>
      </Card>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? "Save changes" : "Create supplier"}
        </Button>
      </div>
    </form>
  );
}
