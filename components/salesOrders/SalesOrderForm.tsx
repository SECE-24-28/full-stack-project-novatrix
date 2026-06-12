"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CREATE_SALES_ORDER, GET_SALES_ORDERS } from "@/lib/graphql/operations/salesOrder";
import { GET_WAREHOUSES } from "@/lib/graphql/operations/warehouse";
import { GET_PRODUCTS }   from "@/lib/graphql/operations/product";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  productId:   string;
  orderedQty:  string;
  unitPrice:   string;
  discountPct: string;
}

const EMPTY_LINE: LineItem = { productId: "", orderedQty: "1", unitPrice: "", discountPct: "0" };

interface FormState {
  warehouseId:     string;
  customerName:    string;
  customerEmail:   string;
  customerPhone:   string;
  shippingAddress: string;
  requiredDate:    string;
  notes:           string;
  items:           LineItem[];
}

type FormErrors = {
  warehouseId?:  string;
  customerName?: string;
  customerEmail?: string;
  items?:        string;
  lines?:        Array<Partial<Record<keyof LineItem, string>>>;
};

const DEFAULT_FORM: FormState = {
  warehouseId: "", customerName: "", customerEmail: "",
  customerPhone: "", shippingAddress: "", requiredDate: "", notes: "",
  items: [{ ...EMPTY_LINE }],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesOrderForm() {
  const router = useRouter();
  const [form,        setForm]        = useState<FormState>(DEFAULT_FORM);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const { data: warehouseData } = useQuery(GET_WAREHOUSES, {
    variables: { filter: { status: "ACTIVE" }, pagination: { page: 1, limit: 200 } },
    fetchPolicy: "cache-first",
  });
  const { data: productData } = useQuery(GET_PRODUCTS, {
    variables: { filter: { status: "ACTIVE" }, pagination: { page: 1, limit: 500 } },
    fetchPolicy: "cache-first",
  });

  const warehouseOptions = (warehouseData?.warehouses?.nodes ?? []).map(
    (w: { id: string; name: string; code: string }) => ({ value: w.id, label: `${w.name} (${w.code})` })
  );
  const productOptions = (productData?.products?.nodes ?? []).map(
    (p: { id: string; name: string; sku: string }) => ({ value: p.id, label: `${p.name} — ${p.sku}` })
  );
  const productPriceMap = new Map<string, string>(
    (productData?.products?.nodes ?? []).map(
      (p: { id: string; sellingPrice: string }) => [p.id, p.sellingPrice] as [string, string]
    )
  );

  const [createSO, { loading }] = useMutation(CREATE_SALES_ORDER, {
    refetchQueries: [GET_SALES_ORDERS],
    onCompleted: (d) => router.push(`/sales-orders/${d.createSalesOrder.id}`),
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
          const price = productPriceMap.get(value);
          if (price) updated.unitPrice = price;
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
    if (!form.warehouseId)  errs.warehouseId  = "Please select a warehouse.";
    if (!form.customerName.trim()) errs.customerName = "Customer name is required.";
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      errs.customerEmail = "Invalid email address.";
    }

    const lineErrors = form.items.map((line) => {
      const e: Partial<Record<keyof LineItem, string>> = {};
      if (!line.productId)                                    e.productId  = "Select a product.";
      if (!line.orderedQty || Number(line.orderedQty) < 1)   e.orderedQty = "Min qty is 1.";
      if (line.unitPrice === "" || Number(line.unitPrice) < 0) e.unitPrice = "Enter a valid price.";
      if (Number(line.discountPct) < 0 || Number(line.discountPct) > 100) e.discountPct = "0–100%";
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
    createSO({
      variables: {
        input: {
          warehouseId:     form.warehouseId,
          customerName:    form.customerName.trim(),
          customerEmail:   form.customerEmail.trim() || undefined,
          customerPhone:   form.customerPhone.trim() || undefined,
          shippingAddress: form.shippingAddress.trim() || undefined,
          requiredDate:    form.requiredDate || undefined,
          notes:           form.notes.trim() || undefined,
          items: form.items.map((line) => ({
            productId:   line.productId,
            orderedQty:  parseInt(line.orderedQty, 10),
            unitPrice:   parseFloat(line.unitPrice),
            discountPct: parseFloat(line.discountPct) || 0,
          })),
        },
      },
    });
  }

  const { subtotal, discount, total } = form.items.reduce(
    (acc, line) => {
      const qty  = parseInt(line.orderedQty, 10) || 0;
      const price = parseFloat(line.unitPrice)   || 0;
      const disc  = parseFloat(line.discountPct) || 0;
      const gross = qty * price;
      acc.subtotal += gross;
      acc.discount += gross * (disc / 100);
      acc.total    += gross * (1 - disc / 100);
      return acc;
    },
    { subtotal: 0, discount: 0, total: 0 }
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ── Customer & order details ── */}
      <Card>
        <CardHeader><CardTitle>Customer details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Warehouse *"
            name="warehouseId"
            value={form.warehouseId}
            options={warehouseOptions}
            onChange={handleField}
            error={errors.warehouseId}
            placeholder="Select warehouse"
          />
          <Input
            label="Customer name *"
            name="customerName"
            value={form.customerName}
            onChange={handleField}
            error={errors.customerName}
            placeholder="Full name or company"
          />
          <Input
            label="Email"
            name="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={handleField}
            error={errors.customerEmail}
            placeholder="customer@example.com"
          />
          <Input
            label="Phone"
            name="customerPhone"
            value={form.customerPhone}
            onChange={handleField}
            placeholder="+1 555 000 0000"
          />
          <Input
            label="Required date"
            name="requiredDate"
            type="date"
            value={form.requiredDate}
            onChange={handleField}
          />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Shipping address</label>
            <textarea
              name="shippingAddress"
              value={form.shippingAddress}
              onChange={handleField}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Optional shipping address…"
            />
          </div>
          <div className="sm:col-span-2">
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
          {errors.items && <p className="px-6 pb-2 text-xs text-red-600">{errors.items}</p>}

          <div className="grid grid-cols-12 gap-3 border-b border-gray-100 bg-gray-50 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="col-span-4">Product</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Unit price</div>
            <div className="col-span-2">Discount %</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-gray-100">
            {form.items.map((line, i) => {
              const lineErr   = errors.lines?.[i] ?? {};
              const qty       = parseInt(line.orderedQty, 10) || 0;
              const price     = parseFloat(line.unitPrice)    || 0;
              const disc      = parseFloat(line.discountPct)  || 0;
              const lineTotal = qty * price * (1 - disc / 100);
              return (
                <div key={i} className="grid grid-cols-12 items-start gap-3 px-6 py-3">
                  <div className="col-span-4">
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
                  <div className="col-span-2">
                    <Input
                      type="number" min="0" step="0.0001"
                      value={line.unitPrice}
                      onChange={(e) => handleLineChange(i, "unitPrice", e.target.value)}
                      error={lineErr.unitPrice}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number" min="0" max="100" step="0.01"
                      value={line.discountPct}
                      onChange={(e) => handleLineChange(i, "discountPct", e.target.value)}
                      error={lineErr.discountPct}
                      placeholder="0"
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

          {/* Totals */}
          <div className="space-y-1 border-t border-gray-100 px-6 py-4 text-right">
            <div className="flex justify-end gap-8 text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="w-24 tabular-nums">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-end gap-8 text-sm text-green-600">
                <span>Discount</span>
                <span className="w-24 tabular-nums">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 border-t border-gray-200 pt-1 text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="w-24 tabular-nums">₹{total.toFixed(2)}</span>
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
        <Button type="submit" loading={loading}>Create sales order</Button>
      </div>
    </form>
  );
}
