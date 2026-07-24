import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
}

const calendarDateSchema = z
  .string()
  .refine(isCalendarDate, "Tanggal belum valid.");

export const createAcademicPeriodSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama periode minimal 2 karakter.")
      .max(100, "Nama periode maksimal 100 karakter."),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
  })
  .refine((values) => values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });

export const academicPeriodIdSchema = z.object({
  periodId: z.string().min(1),
});

export const academicPeriodReasonSchema = academicPeriodIdSchema.extend({
  reason: z
    .string()
    .trim()
    .min(1, "Alasan wajib diisi.")
    .max(500, "Alasan maksimal 500 karakter."),
});

export type CreateAcademicPeriodInput = z.infer<
  typeof createAcademicPeriodSchema
>;
export type AcademicPeriodIdInput = z.infer<typeof academicPeriodIdSchema>;
export type AcademicPeriodReasonInput = z.infer<
  typeof academicPeriodReasonSchema
>;
