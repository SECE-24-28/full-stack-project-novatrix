import { z } from "zod";

export const poItemSchema = z.object({
  productId:  z.string().uuid("Invalid product."),
  orderedQty: z.number().int().min(1, "Quantity must be at least 1."),
  unitCost:   z.number().min(0, "Unit cost cannot be negative."),
});

export const createPurchaseOrderSchema = z.object({
  supplierId:   z.string().uuid("Please select a supplier."),
  warehouseId:  z.string().uuid("Please select a warehouse."),
  expectedDate: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  notes:        z.string().max(2000).optional(),
  items:        z.array(poItemSchema).min(1, "At least one item is required."),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type POItemInput = z.infer<typeof poItemSchema>;
