import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
}

const optionalTrimmedText = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message);

const studentFields = {
  studentNumber: z
    .string()
    .trim()
    .min(1, "Nomor santri wajib diisi.")
    .max(50, "Nomor santri maksimal 50 karakter."),
  fullName: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  preferredName: optionalTrimmedText(
    100,
    "Nama panggilan maksimal 100 karakter.",
  ).transform((value) => value || undefined),
  joinedAt: z.string().refine(isCalendarDate, "Tanggal bergabung belum valid."),
  guardianFullName: optionalTrimmedText(
    100,
    "Nama wali maksimal 100 karakter.",
  ),
  guardianPhone: optionalTrimmedText(
    30,
    "Nomor telepon wali maksimal 30 karakter.",
  ),
  guardianEmail: optionalTrimmedText(
    254,
    "Email wali maksimal 254 karakter.",
  ).refine(
    (value) => !value || z.string().email().safeParse(value).success,
    "Format email wali belum benar.",
  ),
  guardianRelationship: optionalTrimmedText(
    50,
    "Hubungan wali maksimal 50 karakter.",
  ),
};

type GuardianFields = {
  guardianFullName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
};

function validateGuardianFields(values: GuardianFields, context: z.RefinementCtx) {
  const guardianFields = [
    values.guardianFullName,
    values.guardianPhone,
    values.guardianEmail,
    values.guardianRelationship,
  ];
  const guardianStarted = guardianFields.some((value) => Boolean(value));

  if (!guardianStarted) {
    return;
  }

  if (!values.guardianFullName) {
    context.addIssue({
      code: "custom",
      path: ["guardianFullName"],
      message: "Nama wali wajib diisi.",
    });
  }

  if (!values.guardianPhone) {
    context.addIssue({
      code: "custom",
      path: ["guardianPhone"],
      message: "Nomor telepon wali wajib diisi.",
    });
  }

  if (!values.guardianRelationship) {
    context.addIssue({
      code: "custom",
      path: ["guardianRelationship"],
      message: "Hubungan dengan santri wajib diisi.",
    });
  }
}

export const createStudentSchema = z
  .object(studentFields)
  .superRefine(validateGuardianFields);

export const updateStudentSchema = z
  .object({
  studentId: z.string().min(1),
  ...studentFields,
  })
  .superRefine(validateGuardianFields);

export const studentStatusChangeSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentStatusChangeInput = z.infer<
  typeof studentStatusChangeSchema
>;
