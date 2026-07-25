import { z } from "zod";

const optionalId = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.string().min(1).optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
    .optional(),
);

export const reportRequestSchema = z
  .object({
    studentId: z.string().min(1, "Pilih santri."),
    selectionType: z.enum(["ACADEMIC_PERIOD", "CUSTOM_RANGE"]),
    academicPeriodId: optionalId,
    periodStart: optionalDate,
    periodEnd: optionalDate,
    supersedesReportId: optionalId,
  })
  .superRefine((values, context) => {
    if (values.selectionType === "ACADEMIC_PERIOD" && !values.academicPeriodId) {
      context.addIssue({
        code: "custom",
        path: ["academicPeriodId"],
        message: "Pilih periode pembelajaran.",
      });
    }

    if (values.selectionType === "CUSTOM_RANGE") {
      if (!values.periodStart) {
        context.addIssue({
          code: "custom",
          path: ["periodStart"],
          message: "Tanggal mulai wajib diisi.",
        });
      }

      if (!values.periodEnd) {
        context.addIssue({
          code: "custom",
          path: ["periodEnd"],
          message: "Tanggal selesai wajib diisi.",
        });
      }

      if (
        values.periodStart &&
        values.periodEnd &&
        values.periodStart > values.periodEnd
      ) {
        context.addIssue({
          code: "custom",
          path: ["periodEnd"],
          message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        });
      }
    }
  });

export type ReportRequestInput = z.output<typeof reportRequestSchema>;
export type ReportRequestFormInput = z.input<typeof reportRequestSchema>;
