import { z } from "zod";

const optionalText = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message).transform((value) => value || undefined);

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive("Nomor halaman harus lebih dari 0.").optional(),
);

export const createMemorizationRecordSchema = z
  .object({
    halaqahId: z.string().min(1, "Pilih halaqah."),
    studentId: z.string().min(1, "Pilih santri."),
    submissionCategory: z.enum(["SABAQ", "SABQI", "MANZIL"]),
    surahNumber: z.coerce.number().int().min(1, "Pilih surah."),
    startVerse: z.coerce.number().int().min(1, "Ayat awal minimal 1."),
    endVerse: z.coerce.number().int().min(1, "Ayat akhir minimal 1."),
    fluencyPredicate: z.enum(["FLUENT", "FAIRLY_FLUENT", "LESS_FLUENT"]),
    teacherNote: optionalText(1_000, "Catatan maksimal 1000 karakter."),
    nextTarget: optionalText(500, "Target berikutnya maksimal 500 karakter."),
    pageNumber: optionalPositiveInteger,
    duplicateOverride: z.boolean(),
    duplicateOverrideReason: optionalText(
      500,
      "Alasan duplikasi maksimal 500 karakter.",
    ),
  })
  .superRefine((values, context) => {
    if (values.endVerse < values.startVerse) {
      context.addIssue({
        code: "custom",
        path: ["endVerse"],
        message: "Ayat akhir tidak boleh sebelum ayat awal.",
      });
    }

    if (values.duplicateOverride && !values.duplicateOverrideReason) {
      context.addIssue({
        code: "custom",
        path: ["duplicateOverrideReason"],
        message: "Alasan wajib diisi untuk melanjutkan setoran duplikat.",
      });
    }
  });

export type CreateMemorizationRecordInput = z.output<
  typeof createMemorizationRecordSchema
>;
export type CreateMemorizationRecordFormInput = z.input<
  typeof createMemorizationRecordSchema
>;
