import { z } from "zod";

const isoDateSchema = z.iso.date();
const optionalTextSchema = z.string().trim().min(1).max(255).nullable().optional();

const pilotUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  phone: optionalTextSchema,
  roles: z.array(z.enum(["ADMIN", "HEAD", "TEACHER"])).min(1).max(3),
  passwordEnv: z.string().regex(/^PILOT_[A-Z0-9_]+_PASSWORD$/),
});

const pilotHalaqahSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalTextSchema,
  teacherEmail: z.email().transform((value) => value.trim().toLowerCase()),
});

const pilotStudentSchema = z.object({
  studentNumber: z.string().trim().min(1).max(50),
  fullName: z.string().trim().min(2).max(160),
  preferredName: optionalTextSchema,
  joinedAt: isoDateSchema,
  halaqahName: z.string().trim().min(2).max(120),
});

export const pilotDataSchema = z
  .object({
    version: z.literal(1),
    organization: z.object({
      name: z.string().trim().min(2).max(160),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      timezone: z.string().trim().min(1),
    }),
    period: z.object({
      name: z.string().trim().min(2).max(120),
      startDate: isoDateSchema,
      endDate: isoDateSchema,
    }),
    users: z.array(pilotUserSchema).min(3).max(12),
    halaqahs: z.array(pilotHalaqahSchema).min(1).max(2),
    students: z.array(pilotStudentSchema).min(10).max(20),
  })
  .superRefine((data, context) => {
    if (data.period.endDate < data.period.startDate) {
      context.addIssue({
        code: "custom",
        path: ["period", "endDate"],
        message: "Tanggal selesai periode tidak boleh sebelum tanggal mulai.",
      });
    }

    for (const [label, values] of [
      ["email pengguna", data.users.map((user) => user.email)],
      ["nama halaqah", data.halaqahs.map((halaqah) => halaqah.name)],
      ["nomor santri", data.students.map((student) => student.studentNumber)],
    ] as const) {
      if (new Set(values).size !== values.length) {
        context.addIssue({ code: "custom", message: `${label} harus unik.` });
      }
    }

    const teacherEmails = new Set(
      data.users
        .filter((user) => user.roles.includes("TEACHER"))
        .map((user) => user.email),
    );
    const halaqahNames = new Set(data.halaqahs.map((halaqah) => halaqah.name));

    if (teacherEmails.size < 2) {
      context.addIssue({
        code: "custom",
        path: ["users"],
        message: "Data pilot memerlukan minimal dua Pengajar.",
      });
    }

    data.halaqahs.forEach((halaqah, index) => {
      if (!teacherEmails.has(halaqah.teacherEmail)) {
        context.addIssue({
          code: "custom",
          path: ["halaqahs", index, "teacherEmail"],
          message: "Email harus merujuk pengguna dengan role Pengajar.",
        });
      }
    });

    data.students.forEach((student, index) => {
      if (!halaqahNames.has(student.halaqahName)) {
        context.addIssue({
          code: "custom",
          path: ["students", index, "halaqahName"],
          message: "Nama halaqah santri tidak ditemukan.",
        });
      }
    });
  });

export type PilotData = z.infer<typeof pilotDataSchema>;
