"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { createProductSchema, updateProductSchema } from "@/lib/validators/product";
import { CREATE_PRODUCT, UPDATE_PRODUCT, GET_CATEGORIES, GET_PRODUCTS } from "@/lib/graphql/operations/product";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Product } from "@/types/product";
import type { ProductStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  sku:             string;
  name:            string;
  description:     string;
  categoryId:      string;
  supplierId:      string;
  unitOfMeasure:   string;
  costPrice:       string;
  sellingPrice:    string;
  reorderPoint:    string;
  reorderQuantity: string;
  weight:          string;
  barcode:         string;
  imageUrl:        string;
  status:          ProductStatus;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const DEFAULT_FORM: FormState = {
  sku: "", name: "", description: "", categoryId: "", supplierId: "",
  unitOfMeasure: "EACH", costPrice: "", sellingPrice: "",
  reorderPoint: "0", reorderQuantity: "0",
  weight: "", barcode: "", imageUrl: "", status: "ACTIVE",
};

const UNIT_OPTIONS = [
  { value: "EACH",  label: "Each"     },
  { value: "BOX",   label: "Box"      },
  { value: "PALLET",label: "Pallet"   },
  { value: "KG",    label: "Kilogram" },
  { value: "LT",    label: "Litre"    },
  { value: "MTR",   label: "Metre"    },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE",       label: "Active"       },
  { value: "INACTIVE",     label: "Inactive"     },
  { value: "DISCONTINUED", label: "Discontinued" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function productToForm(p: Product): FormState {
  return {
    sku:             p.sku,
    name:            p.name,
    description:     p.description ?? "",
    categoryId:      p.category.id,
    supplierId:      p.supplier?.id ?? "",
    unitOfMeasure:   p.unitOfMeasure,
    costPrice:       p.costPrice,
    sellingPrice:    p.sellingPrice,
    reorderPoint:    String(p.reorderPoint),
    reorderQuantity: String(p.reorderQuantity),
    weight:          p.weight ?? "",
    barcode:         p.barcode ?? "",
    imageUrl:        p.imageUrl ?? "",
    status:          p.status,
  };
}

function formToInput(form: FormState) {
  return {
    sku:             form.sku.trim().toUpperCase(),
    name:            form.name.trim(),
    description:     form.description.trim() || undefined,
    categoryId:      form.categoryId,
    supplierId:      form.supplierId || undefined,
    unitOfMeasure:   form.unitOfMeasure,
    costPrice:       parseFloat(form.costPrice),
    sellingPrice:    parseFloat(form.sellingPrice),
    reorderPoint:    parseInt(form.reorderPoint, 10),
    reorderQuantity: parseInt(form.reorderQuantity, 10),
    weight:          form.weight ? parseFloat(form.weight) : undefined,
    barcode:         form.barcode.trim() || undefined,
    imageUrl:        form.imageUrl.trim() || undefined,
    status:          form.status,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductFormProps {
  product?: Product;   // undefined = create mode
}

export function ProductForm({ product }: ProductFormProps) {
  const router    = useRouter();
  const isEditing = !!product;

  const [form,        setForm]        = useState<FormState>(product ? productToForm(product) : DEFAULT_FORM);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  // Reset form when product prop changes
  useEffect(() => {
    if (product) setForm(productToForm(product));
  }, [product]);

  // Load categories
  const { data: catData } = useQuery(GET_CATEGORIES, {
    variables:   { pagination: { page: 1, limit: 100 } },
    fetchPolicy: "cache-first",
  });
  const categoryOptions = (catData?.categories?.nodes ?? []).map(
    (c: { id: string; name: string }) => ({ value: c.id, label: c.name })
  );

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [GET_PRODUCTS],
    onCompleted:    () => router.push("/products"),
    onError:        (err) => setServerError(err.graphQLErrors[0]?.message ?? err.message),
  });

  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [GET_PRODUCTS],
    onCompleted:    () => router.push(`/products/${product!.id}`),
    onError:        (err) => setServerError(err.graphQLErrors[0]?.message ?? err.message),
  });

  const loading = creating || updating;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const schema  = isEditing ? updateProductSchema : createProductSchema;
    const payload = isEditing
      ? { ...formToInput(form), id: product!.id }
      : formToInput(form);
    const result = schema.safeParse(payload);
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
      updateProduct({ variables: { input: { ...input, id: product!.id } } });
    } else {
      createProduct({ variables: { input } });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ── Basic info ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="SKU *"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            error={errors.sku}
            placeholder="e.g. PROD-001"
            className="uppercase"
          />
          <Input
            label="Product name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Wireless Barcode Scanner"
          />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Optional product description…"
            />
          </div>
          <Select
            label="Category *"
            name="categoryId"
            value={form.categoryId}
            options={categoryOptions}
            onChange={handleChange}
            error={errors.categoryId}
            placeholder="Select category"
          />
          <Select
            label="Unit of measure *"
            name="unitOfMeasure"
            value={form.unitOfMeasure}
            options={UNIT_OPTIONS}
            onChange={handleChange}
            error={errors.unitOfMeasure}
          />
          <Input
            label="Barcode"
            name="barcode"
            value={form.barcode}
            onChange={handleChange}
            error={errors.barcode}
            placeholder="EAN / UPC / QR"
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Cost price *"
            name="costPrice"
            type="number"
            min="0"
            step="0.0001"
            value={form.costPrice}
            onChange={handleChange}
            error={errors.costPrice}
            placeholder="0.00"
          />
          <Input
            label="Selling price *"
            name="sellingPrice"
            type="number"
            min="0"
            step="0.0001"
            value={form.sellingPrice}
            onChange={handleChange}
            error={errors.sellingPrice}
            placeholder="0.00"
          />
        </CardContent>
      </Card>

      {/* ── Stock levels ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Stock levels</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Reorder point *"
            name="reorderPoint"
            type="number"
            min="0"
            step="1"
            value={form.reorderPoint}
            onChange={handleChange}
            error={errors.reorderPoint}
            hint="Alert fires when available qty drops to this level."
          />
          <Input
            label="Reorder quantity *"
            name="reorderQuantity"
            type="number"
            min="0"
            step="1"
            value={form.reorderQuantity}
            onChange={handleChange}
            error={errors.reorderQuantity}
            hint="Suggested quantity for purchase orders."
          />
        </CardContent>
      </Card>

      {/* ── Physical ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Physical details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Weight (kg)"
            name="weight"
            type="number"
            min="0"
            step="0.001"
            value={form.weight}
            onChange={handleChange}
            error={errors.weight}
            placeholder="0.000"
          />
          <Input
            label="Image URL"
            name="imageUrl"
            type="url"
            value={form.imageUrl}
            onChange={handleChange}
            error={errors.imageUrl}
            placeholder="https://…"
          />
        </CardContent>
      </Card>

      {/* ── Server error + actions ──────────────────────────────────────────── */}
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
          {isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
