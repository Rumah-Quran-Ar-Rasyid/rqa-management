import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "bcryptjs";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";

const demoEnvSchema = z.object({
  DATABASE_URL: z.string().startsWith("mysql://"),
  SEED_ORGANIZATION_SLUG: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .default("rumah-quran-ar-rasyid"),
  DEMO_TEACHER_EMAIL: z.email().default("pengajar.demo@rqa.local"),
  DEMO_TEACHER_PASSWORD: z.string().min(12).default("demo-pengajar-2026"),
});

const parsedDemoEnv = demoEnvSchema.safeParse(process.env);

if (!parsedDemoEnv.success) {
  console.error(
    "Konfigurasi data demo belum lengkap:",
    parsedDemoEnv.error.flatten().fieldErrors,
  );
  throw new Error("Konfigurasi data demo belum lengkap");
}

const demoEnv = parsedDemoEnv.data;
const adapter = new PrismaMariaDb(demoEnv.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const DEMO_START = "2026-01-01";

function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function currentDateForJakarta() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dateDaysAgo(days: number) {
  const result = databaseDate(currentDateForJakarta());
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

async function ensureDemoRecord({
  academicPeriodId,
  category,
  endVerse,
  fluency,
  halaqah,
  note,
  periodName,
  startVerse,
  student,
  submissionDate,
  surahNumber,
  teacher,
}: {
  academicPeriodId: string;
  category: "SABAQ" | "SABQI" | "MANZIL";
  endVerse: number;
  fluency: "FLUENT" | "FAIRLY_FLUENT" | "LESS_FLUENT";
  halaqah: { id: string; name: string };
  note: string;
  periodName: string;
  startVerse: number;
  student: { id: string; fullName: string; preferredName: string | null };
  submissionDate: Date;
  surahNumber: number;
  teacher: { id: string; name: string; organizationId: string };
}) {
  const existing = await prisma.memorizationRecord.findFirst({
    where: {
      organizationId: teacher.organizationId,
      studentId: student.id,
      submissionDate,
      submissionCategory: category,
      surahNumber,
      startVerse,
      endVerse,
      teacherUserId: teacher.id,
    },
    select: { id: true },
  });

  const record =
    existing ??
    (await prisma.memorizationRecord.create({
      data: {
        organizationId: teacher.organizationId,
        academicPeriodId,
        studentId: student.id,
        halaqahId: halaqah.id,
        teacherUserId: teacher.id,
        submissionDate,
        submissionCategory: category,
        surahNumber,
        startVerse,
        endVerse,
        fluencyPredicate: fluency,
        teacherNote: note,
        nextTarget: "Lanjutkan murojaah dengan tartil.",
        recordStatus: "ACTIVE",
        studentNameSnapshot: student.preferredName || student.fullName,
        halaqahNameSnapshot: halaqah.name,
        teacherNameSnapshot: teacher.name,
        periodNameSnapshot: periodName,
        createdById: teacher.id,
        updatedById: teacher.id,
      },
      select: { id: true },
    }));

  const audit = await prisma.memorizationRecordAudit.findFirst({
    where: {
      organizationId: teacher.organizationId,
      memorizationRecordId: record.id,
      action: "CREATE",
    },
    select: { id: true },
  });

  if (!audit) {
    await prisma.memorizationRecordAudit.create({
      data: {
        organizationId: teacher.organizationId,
        memorizationRecordId: record.id,
        action: "CREATE",
        afterData: {
          source: "demo",
          submissionCategory: category,
          surahNumber,
          startVerse,
          endVerse,
          fluencyPredicate: fluency,
        },
        performedById: teacher.id,
      },
    });
  }

  return record.id;
}

async function main() {
  const organization = await prisma.organization.findUnique({
    where: { slug: demoEnv.SEED_ORGANIZATION_SLUG },
    select: { id: true, timezone: true },
  });

  if (!organization) {
    throw new Error("Jalankan npm run db:seed sebelum membuat data demo.");
  }

  const teacherRole = await prisma.role.findUnique({
    where: { code: "TEACHER" },
    select: { id: true },
  });

  if (!teacherRole) {
    throw new Error("Role Pengajar belum tersedia. Jalankan npm run db:seed.");
  }

  const passwordHash = await hash(demoEnv.DEMO_TEACHER_PASSWORD, 12);
  const [admin, teacher] = await prisma.$transaction(async (tx) => {
    const admin = await tx.user.findFirst({
      where: {
        organizationId: organization.id,
        roles: { some: { revokedAt: null, role: { code: "ADMIN" } } },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      throw new Error("Akun Admin awal tidak ditemukan. Jalankan npm run db:seed.");
    }

    const teacher = await tx.user.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: demoEnv.DEMO_TEACHER_EMAIL,
        },
      },
      update: {
        name: "Ustadz Ahmad Fikri",
        passwordHash,
        status: "ACTIVE",
      },
      create: {
        organizationId: organization.id,
        name: "Ustadz Ahmad Fikri",
        email: demoEnv.DEMO_TEACHER_EMAIL,
        passwordHash,
        status: "ACTIVE",
      },
      select: { id: true, name: true, organizationId: true },
    });

    await tx.userRole.upsert({
      where: {
        organizationId_userId_roleId: {
          organizationId: organization.id,
          userId: teacher.id,
          roleId: teacherRole.id,
        },
      },
      update: { assignedById: admin.id, revokedAt: null },
      create: {
        organizationId: organization.id,
        userId: teacher.id,
        roleId: teacherRole.id,
        assignedById: admin.id,
      },
    });

    return [admin, teacher] as const;
  });

  const currentDate = currentDateForJakarta();
  const currentYear = currentDate.slice(0, 4);
  const periodName = `Periode Demo ${currentYear}`;
  const existingActivePeriod = await prisma.academicPeriod.findFirst({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
  });
  const period =
    existingActivePeriod ??
    (await prisma.academicPeriod.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: periodName,
        },
      },
      update: {
        startDate: databaseDate(`${currentYear}-01-01`),
        endDate: databaseDate(`${currentYear}-12-31`),
        status: "ACTIVE",
      },
      create: {
        organizationId: organization.id,
        name: periodName,
        startDate: databaseDate(`${currentYear}-01-01`),
        endDate: databaseDate(`${currentYear}-12-31`),
        status: "ACTIVE",
      },
      select: { id: true, name: true },
    }));

  const halaqahs = await Promise.all(
    [
      { name: "Halaqah Al-Fatihah", description: "Data demo tingkat dasar." },
      { name: "Halaqah An-Naba", description: "Data demo tingkat lanjutan." },
    ].map((halaqah) =>
      prisma.halaqah.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name: halaqah.name,
          },
        },
        update: { description: halaqah.description, status: "ACTIVE" },
        create: {
          organizationId: organization.id,
          ...halaqah,
          status: "ACTIVE",
        },
        select: { id: true, name: true },
      }),
    ),
  );

  await Promise.all(
    halaqahs.map((halaqah) =>
      prisma.halaqahTeacherAssignment.upsert({
        where: {
          organizationId_halaqahId_teacherUserId_assignmentType_validFrom: {
            organizationId: organization.id,
            halaqahId: halaqah.id,
            teacherUserId: teacher.id,
            assignmentType: "PRIMARY",
            validFrom: databaseDate(DEMO_START),
          },
        },
        update: { validUntil: null, createdById: admin.id },
        create: {
          organizationId: organization.id,
          halaqahId: halaqah.id,
          teacherUserId: teacher.id,
          assignmentType: "PRIMARY",
          validFrom: databaseDate(DEMO_START),
          createdById: admin.id,
        },
      }),
    ),
  );

  const students = await Promise.all(
    [
      { number: "DEMO-001", name: "Muhammad Rayyan", preferredName: "Rayyan", halaqah: 0 },
      { number: "DEMO-002", name: "Ahmad Ziyad", preferredName: "Ziyad", halaqah: 0 },
      { number: "DEMO-003", name: "Faris Alwi", preferredName: "Faris", halaqah: 0 },
      { number: "DEMO-004", name: "Aisyah Humaira", preferredName: "Humaira", halaqah: 1 },
      { number: "DEMO-005", name: "Khadijah Salwa", preferredName: "Salwa", halaqah: 1 },
      { number: "DEMO-006", name: "Maryam Zahra", preferredName: "Zahra", halaqah: 1 },
    ].map(async (student) => {
      const record = await prisma.student.upsert({
        where: {
          organizationId_studentNumber: {
            organizationId: organization.id,
            studentNumber: student.number,
          },
        },
        update: {
          fullName: student.name,
          preferredName: student.preferredName,
          status: "ACTIVE",
        },
        create: {
          organizationId: organization.id,
          studentNumber: student.number,
          fullName: student.name,
          preferredName: student.preferredName,
          joinedAt: databaseDate(DEMO_START),
          status: "ACTIVE",
        },
        select: { id: true, fullName: true, preferredName: true },
      });

      await prisma.halaqahMembership.upsert({
        where: {
          organizationId_studentId_validFrom: {
            organizationId: organization.id,
            studentId: record.id,
            validFrom: databaseDate(DEMO_START),
          },
        },
        update: {
          halaqahId: halaqahs[student.halaqah].id,
          status: "ACTIVE",
          validUntil: null,
          createdById: admin.id,
        },
        create: {
          organizationId: organization.id,
          halaqahId: halaqahs[student.halaqah].id,
          studentId: record.id,
          validFrom: databaseDate(DEMO_START),
          status: "ACTIVE",
          createdById: admin.id,
        },
      });

      return { ...record, halaqah: halaqahs[student.halaqah] };
    }),
  );

  await Promise.all([
    ensureDemoRecord({
      academicPeriodId: period.id,
      category: "SABAQ",
      endVerse: 10,
      fluency: "FLUENT",
      halaqah: students[0].halaqah,
      note: "Bacaan lancar dan makhraj baik.",
      periodName: period.name,
      startVerse: 1,
      student: students[0],
      submissionDate: dateDaysAgo(0),
      surahNumber: 78,
      teacher,
    }),
    ensureDemoRecord({
      academicPeriodId: period.id,
      category: "SABQI",
      endVerse: 7,
      fluency: "FAIRLY_FLUENT",
      halaqah: students[0].halaqah,
      note: "Perlu mengulang pada ayat terakhir.",
      periodName: period.name,
      startVerse: 1,
      student: students[0],
      submissionDate: dateDaysAgo(1),
      surahNumber: 1,
      teacher,
    }),
    ensureDemoRecord({
      academicPeriodId: period.id,
      category: "MANZIL",
      endVerse: 6,
      fluency: "FLUENT",
      halaqah: students[1].halaqah,
      note: "Murojaah sudah stabil.",
      periodName: period.name,
      startVerse: 1,
      student: students[1],
      submissionDate: dateDaysAgo(0),
      surahNumber: 114,
      teacher,
    }),
    ensureDemoRecord({
      academicPeriodId: period.id,
      category: "SABAQ",
      endVerse: 5,
      fluency: "LESS_FLUENT",
      halaqah: students[3].halaqah,
      note: "Perlu memperlambat bacaan dan murojaah ulang.",
      periodName: period.name,
      startVerse: 1,
      student: students[3],
      submissionDate: dateDaysAgo(2),
      surahNumber: 67,
      teacher,
    }),
  ]);

  console.info("Data demo siap:", {
    teacherEmail: demoEnv.DEMO_TEACHER_EMAIL,
    halaqahs: halaqahs.length,
    students: students.length,
    activePeriod: period.name,
    records: 4,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Seed data demo gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
