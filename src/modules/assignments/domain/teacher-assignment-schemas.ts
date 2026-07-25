import { z } from "zod";

import { requiresEndDate } from "./teacher-assignment-policy";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  return (
    datePattern.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value)
  );
}

const dateSchema = z.string().refine(isCalendarDate, "Tanggal belum valid.");

export const createTeacherAssignmentSchema = z
  .object({
    halaqahId: z.string().min(1, "Pilih halaqah."),
    teacherUserId: z.string().min(1, "Pilih Pengajar."),
    assignmentType: z.enum(["PRIMARY", "ASSISTANT", "SUBSTITUTE"]),
    validFrom: dateSchema,
    validUntil: z.string().optional(),
  })
  .superRefine((values, context) => {
    const validUntil = values.validUntil?.trim();

    if (requiresEndDate(values.assignmentType) && !validUntil) {
      context.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "Tanggal selesai wajib untuk Pengajar Pengganti.",
      });
      return;
    }

    if (validUntil && !isCalendarDate(validUntil)) {
      context.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "Tanggal selesai belum valid.",
      });
      return;
    }

    if (validUntil && validUntil < values.validFrom) {
      context.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
      });
    }
  })
  .transform((values) => ({
    ...values,
    validUntil: values.validUntil?.trim() || undefined,
  }));

export const closeTeacherAssignmentSchema = z
  .object({
    assignmentId: z.string().min(1),
    validUntil: dateSchema,
  });

export type CreateTeacherAssignmentInput = z.output<
  typeof createTeacherAssignmentSchema
>;
export type CreateTeacherAssignmentFormInput = z.input<
  typeof createTeacherAssignmentSchema
>;
export type CloseTeacherAssignmentInput = z.infer<
  typeof closeTeacherAssignmentSchema
>;
