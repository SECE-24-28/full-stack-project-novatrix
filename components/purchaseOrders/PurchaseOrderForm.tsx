"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CREATE_PURCHASE_ORDER, GET_PURCHASE_ORDERS } from "@/lib/graphql/operations/purchaseOrder";
import { GET_SUPPLIERS }  from "@/lib/graphql/operations/supplier";
import { GET_WAREHOUSES } from "@/lib/graphql/operations/warehouse";
import { GET_PRODUCTS }   from "@/lib/graphql/operations/product";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  productId:  string;
  orderedQty: string;
  unitCost:   string;
}

const EMPTY_LINE: LineItem = { productId: "", orderedQty: "1", unitCost: "" };

interface FormState {
  supplierId:   string;
  warehouseId:  string;
  expectedDate: string;
  notes:        string;
  items:        LineItem[];
}

type FormErrors = {
  supplierId?:  string;
  warehouseId?: string;
  items?:       string;
  lines?:       Array<Partial<Record<keyof LineItem, string>>>;
};

const DEFAULT_FORM: FormState = {
  supplierId: "", warehouseId: "", expectedDate: "", notes: "",
  items: [{ ...EMPTY_LINE }],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseOrderForm() {
  const router = useRouter();
  const [form,        setForm]        = useState<FormState>(DEFAULT_FORM);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const { data: supplierData } = useQuery(GET_SUPPLIERS, {
    variables: { pagination: { page: 1, limit: 200 } },
    fetchPolicy: "cache-first",
  });
  const { data: warehouseData } = useQuery(GET_WAREHOUSES, {
    variables: { filter: { status: "ACTIVE" }, pagination: { page: 1, limit: 200 } },
    fetchPolicy: "cache-first",
  });
  const { data: productData } = useQuery(GET_PRODUCTS, {
    variables: { filter: { status: "ACTIVE" }, pagination: { page: 1, limit: 500 } },
    fetchPolicy: "cache-first",
  });

  const supplierOptions  = (supplierData?.suppliers?.nodes  ?? []).map((s: { id: string; name: string; code: string }) => ({ value: s.id, label: `${s.name} (${s.code})` }));
  const warehouseOptions = (warehouseData?.warehouses?.nodes ?? []).map((w: { id: string; name: string; code: string }) => ({ value: w.id, label: `${w.name} (${w.code})` }));
  const productOptions   = (productData?.products?.nodes    ?? []).map((p: { id: string; name: string; sku: string }) => ({ value: p.id, label: `${p.name} — ${p.sku}` }));
  const productCostMap   = new Map<string, string>(
    (productData?.products?.nodes ?? []).map((p: { id: string; costPrice: string }) => [p.id, p.costPrice] as [string, string])
  );

  const [createPO, { loading }] = useMutation(CREATE_PURCHASE_ORDER, {
    refetchQueries: [GET_PURCHASE_ORDERS],
    onCompleted: (d) => router.push(`/purchase-orders/${d.createPurchaseOrder.id}`),
    onError:     (err) => setServerError(err.graphQLErrors[0]?.message ?? err.message),
  });

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleLineChange(index: number, field: keyof LineItem, value: string) {
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "productId" && value) {
          const cost = productCostMap.get(value);
          if (cost) updated.unitCost = cost;
        }
        return updated;
      });
      return { ...prev, items };
    });
    setErrors((prev) => {
      const lines = (prev.lines ?? []).map((l, i) =>
        i === index ? { ...l, [field]: undefined } : l
      );
      return { ...prev, lines };
    });
  }

  function addLine() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_LINE }] }));
  }

  function removeLine(index: number) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    setErrors((prev) => ({ ...prev, lines: (prev.lines ?? []).filter((_, i) => i !== index) }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.supplierId)  errs.supplierId  = "Please select a supplier.";
    if (!form.warehouseId) errs.warehouseId = "Please select a warehouse.";

    const lineErrors = form.items.map((line) => {
      const e: Partial<Record<keyof LineItem, string>> = {};
      if (!line.productId)                                    e.productId  = "Select a product.";
      if (!line.orderedQty || Number(line.orderedQty) < 1)   e.orderedQty = "Min qty is 1.";
      if (line.unitCost === "" || Number(line.unitCost) < 0) e.unitCost   = "Enter a valid cost.";
      return e;
    });

    if (lineErrors.some((e) => Object.keys(e).length > 0)) errs.lines = lineErrors;

    const ids = form.items.map((i) => i.productId).filter(Boolean);
    if (new Set(ids).size !== ids.length) errs.items = "Duplicate products are not allowed.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    createPO({
      variables: {
        input: {
          supplierId:   form.supplierId,
          warehouseId:  form.warehouseId,
          expectedDate: form.expectedDate || undefined,
          notes:        form.notes.trim() || undefined,
          items: form.items.map((line) => ({
            productId:  line.productId,
            orderedQty: parseInt(line.orderedQty, 10),
            unitCost:   parseFloat(line.unitCost),
          })),
        },
      },
    });
  }

  const subtotal = form.items.reduce((sum, line) => {
    return sum + (parseInt(line.orderedQty, 10) || 0) * (parseFloat(line.unitCost) || 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ── Order details ── */}
      <Card>
        <CardHeader><CardTitle>Order details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Supplier *"
            name="supplierId"
            value={form.supplierId}
            options={supplierOptions}
            onChange={handleField}
            error={errors.supplierId}
            placeholder="Select supplier"
          />
          <Select
            label="Destination warehouse *"
            name="warehouseId"
            value={form.warehouseId}
            options={warehouseOptions}
            onChange={handleField}
            error={errors.warehouseId}
            placeholder="Select warehouse"
          />
          <Input
            label="Expected delivery date"
            name="expectedDate"
            type="date"
            value={form.expectedDate}
            onChange={handleField}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleField}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Optional notes…"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Line items ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {errors.items && (
            <p className="px-6 pb-2 text-xs text-red-600">{errors.items}</p>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-3 border-b border-gray-100 bg-gray-50 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="col-span-5">Product</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-3">Unit cost</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-gray-100">
            {form.items.map((line, i) => {
              const lineErr  = errors.lines?.[i] ?? {};
              const lineTotal = (parseInt(line.orderedQty, 10) || 0) * (parseFloat(line.unitCost) || 0);
              return (
                <div key={i} className="grid grid-cols-12 items-start gap-3 px-6 py-3">
                  <div className="col-span-5">
                    <Select
                      value={line.productId}
                      options={productOptions}
                      onChange={(e) => handleLineChange(i, "productId", e.target.value)}
                      error={lineErr.productId}
                      placeholder="Select product"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number" min="1" step="1"
                      value={line.orderedQty}
                      onChange={(e) => handleLineChange(i, "orderedQty", e.target.value)}
                      error={lineErr.orderedQty}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number" min="0" step="0.0001"
                      value={line.unitCost}
                      onChange={(e) => handleLineChange(i, "unitCost", e.target.value)}
                      error={lineErr.unitCost}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1 pt-2 text-right text-sm font-medium text-gray-800">
                    ₹{lineTotal.toFixed(2)}
                  </div>
                  <div className="col-span-1 pt-1">
                    {form.items.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => removeLine(i)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtotal */}
          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Order subtotal</p>
              <p className="text-2xl font-bold text-gray-900">₹{subtotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>Create purchase order</Button>
      </div>
    </form>
  );
}
