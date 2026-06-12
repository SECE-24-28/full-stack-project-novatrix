import { z } from "zod";

export const soItemSchema = z.object({
  productId:   z.string().uuid("Invalid product."),
  orderedQty:  z.number().int().min(1, "Quantity must be at least 1."),
  unitPrice:   z.number().min(0, "Unit price cannot be negative."),
  discountPct: z.number().min(0).max(100).optional().default(0),
});

export const createSalesOrderSchema = z.object({
  warehouseId:     z.string().uuid("Please select a warehouse."),
  customerName:    z.string().min(1, "Customer name is required.").max(200),
  customerEmail:   z.string().email("Invalid email.").optional().or(z.literal("")).transform((v) => v || undefined),
  customerPhone:   z.string().max(30).optional(),
  shippingAddress: z.string().max(500).optional(),
  requiredDate:    z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  notes:           z.string().max(2000).optional(),
  items:           z.array(soItemSchema).min(1, "At least one item is required."),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type SOItemInput           = z.infer<typeof soItemSchema>;
