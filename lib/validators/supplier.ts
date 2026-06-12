import { z } from "zod";

const supplierBase = z.object({
  name:         z.string().min(1, "Name is required.").max(200),
  code:         z.string().min(1, "Code is required.").max(50)
                  .regex(/^[A-Z0-9_-]+$/i, "Code may only contain letters, numbers, hyphens and underscores."),
  contactName:  z.string().max(200).optional(),
  email:        z.string().email("Invalid email address.").optional().or(z.literal("")),
  phone:        z.string().max(30).optional(),
  address:      z.string().max(500).optional(),
  city:         z.string().max(100).optional(),
  country:      z.string().max(100).optional(),
  gstNumber:    z.string().max(50).optional(),
  status:       z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]).optional(),
  paymentTerms: z.number().int().min(0).max(365).optional(),
  notes:        z.string().max(2000).optional(),
});

export const createSupplierSchema = supplierBase;

export const updateSupplierSchema = supplierBase
  .partial()
  .extend({ id: z.string().uuid() });

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
