import { z } from "zod";

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name:        z.string().min(1, "Name is required.").max(100),
  description: z.string().max(500).optional(),
  parentId:    z.string().uuid("Invalid parent category.").optional(),
});

export const updateCategorySchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parentId:    z.string().uuid().optional(),
});

// ─── Product base (no cross-field refine) ────────────────────────────────────

const productBase = z.object({
  sku:             z.string().min(1, "SKU is required.").max(50).regex(
    /^[A-Z0-9_-]+$/i,
    "SKU may only contain letters, numbers, hyphens and underscores."
  ),
  name:            z.string().min(1, "Product name is required.").max(200),
  description:     z.string().max(2000).optional(),
  categoryId:      z.string().uuid("Please select a category."),
  supplierId:      z.string().uuid().optional(),
  unitOfMeasure:   z.string().min(1, "Unit of measure is required.").max(20),
  costPrice:       z.number({ invalid_type_error: "Cost price must be a number." })
                    .min(0, "Cost price cannot be negative."),
  sellingPrice:    z.number({ invalid_type_error: "Selling price must be a number." })
                    .min(0, "Selling price cannot be negative."),
  reorderPoint:    z.number().int().min(0, "Reorder point cannot be negative."),
  reorderQuantity: z.number().int().min(0, "Reorder quantity cannot be negative."),
  weight:          z.number().min(0).optional(),
  barcode:         z.string().max(100).optional(),
  imageUrl:        z.string().url("Invalid image URL.").optional().or(z.literal("")),
  status:          z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).optional(),
});

export const createProductSchema = productBase.refine(
  (d) => d.sellingPrice >= d.costPrice,
  { message: "Selling price must be ≥ cost price.", path: ["sellingPrice"] }
);

export const updateProductSchema = productBase
  .partial()
  .extend({ id: z.string().uuid() });

export type CreateProductInput  = z.infer<typeof createProductSchema>;
export type UpdateProductInput  = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
