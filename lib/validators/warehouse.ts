import { z } from "zod";

// ─── Warehouse ────────────────────────────────────────────────────────────────

const warehouseBase = z.object({
  name:      z.string().min(1, "Name is required.").max(100),
  code:      z.string().min(1, "Code is required.").max(20)
              .regex(/^[A-Z0-9_-]+$/i, "Code may only contain letters, numbers, hyphens and underscores."),
  address:   z.string().max(300).optional(),
  city:      z.string().max(100).optional(),
  country:   z.string().max(100).optional(),
  phone:     z.string().max(30).optional(),
  email:     z.string().email("Invalid email address.").optional().or(z.literal("")),
  managerId: z.string().uuid().optional(),
  capacity:  z.number().int().positive("Capacity must be a positive integer.").optional(),
  status:    z.enum(["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE"]).optional(),
});

export const createWarehouseSchema = warehouseBase;

export const updateWarehouseSchema = warehouseBase
  .partial()
  .extend({ id: z.string().uuid() });

// ─── Zone ─────────────────────────────────────────────────────────────────────

export const createZoneSchema = z.object({
  warehouseId:  z.string().uuid("Invalid warehouse."),
  name:         z.string().min(1, "Zone name is required.").max(100),
  code:         z.string().min(1, "Zone code is required.").max(20)
                 .regex(/^[A-Z0-9_-]+$/i, "Code may only contain letters, numbers, hyphens and underscores."),
  description:  z.string().max(300).optional(),
});

export const updateZoneSchema = z.object({
  id:           z.string().uuid(),
  name:         z.string().min(1).max(100).optional(),
  code:         z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/i).optional(),
  description:  z.string().max(300).optional(),
});

// ─── Stock assignment ─────────────────────────────────────────────────────────

export const assignStockSchema = z.object({
  productId:   z.string().uuid("Invalid product."),
  warehouseId: z.string().uuid("Invalid warehouse."),
  zoneId:      z.string().uuid().optional(),
  quantity:    z.number().int().min(0, "Quantity cannot be negative."),
});

export const adjustStockSchema = z.object({
  stockId:  z.string().uuid(),
  quantity: z.number().int().min(0, "Quantity cannot be negative."),
  notes:    z.string().max(300).optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type CreateZoneInput      = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput      = z.infer<typeof updateZoneSchema>;
export type AssignStockInput     = z.infer<typeof assignStockSchema>;
export type AdjustStockInput     = z.infer<typeof adjustStockSchema>;
