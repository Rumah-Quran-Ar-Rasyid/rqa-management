import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  return (
    datePattern.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value)
  );
}

const dateSchema = z.string().refine(isCalendarDate, "Tanggal belum valid.");

export const createHalaqahMembershipSchema = z.object({
  studentId: z.string().min(1, "Pilih santri."),
  halaqahId: z.string().min(1, "Pilih halaqah."),
  validFrom: dateSchema,
});

export type CreateHalaqahMembershipInput = z.infer<
  typeof createHalaqahMembershipSchema
>;
