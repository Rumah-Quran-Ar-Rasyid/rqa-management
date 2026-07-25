import { z } from "zod";

const halaqahFields = {
  name: z
    .string()
    .trim()
    .min(2, "Nama halaqah minimal 2 karakter.")
    .max(100, "Nama halaqah maksimal 100 karakter."),
  description: z
    .string()
    .trim()
    .max(1000, "Keterangan maksimal 1.000 karakter.")
    .transform((value) => value || undefined),
};

export const createHalaqahSchema = z.object(halaqahFields);

export const updateHalaqahSchema = z.object({
  halaqahId: z.string().min(1),
  ...halaqahFields,
});

export const halaqahStatusChangeSchema = z.object({
  halaqahId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type CreateHalaqahInput = z.infer<typeof createHalaqahSchema>;
export type UpdateHalaqahInput = z.infer<typeof updateHalaqahSchema>;
export type HalaqahStatusChangeInput = z.infer<
  typeof halaqahStatusChangeSchema
>;
