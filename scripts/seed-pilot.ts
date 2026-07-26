import "dotenv/config";

import { readFile } from "node:fs/promises";
import { hash } from "bcryptjs";
import { z } from "zod";

import { pilotDataSchema } from "./pilot-data-schema";
import {
  createDatabaseClient,
  databaseDate,
  hasFlag,
  readArgument,
} from "./operational-utils";

const filePath = readArgument("--file");
const apply = hasFlag("--apply");

if (!filePath) {
  throw new Error(
    "Gunakan --file /lokasi/aman/pilot-data.json dan tambahkan --apply setelah dry-run diperiksa.",
  );
}

const databaseUrl = z.string().startsWith("mysql://").parse(process.env.DATABASE_URL);
const prisma = createDatabaseClient(databaseUrl);

async function main() {
 const source = pilotDataSchema.parse(JSON.parse(await readFile(filePath as string, "utf8")));
 const passwords = new Map(
   source.users.map((user) => [
     user.email,
     z.string().min(12).parse(process.env[user.passwordEnv]),
   ]),
 );
 try {
  const existingOrganization = await prisma.organization.findUnique({
    where: { slug: source.organization.slug },
    select: { id: true },
  });

  const academicUsage = existingOrganization
    ? await Promise.all([
        prisma.memorizationRecord.count({
          where: { organizationId: existingOrganization.id },
        }),
        prisma.generatedReport.count({
          where: { organizationId: existingOrganization.id },
        }),
      ])
    : [0, 0];

  if (apply && academicUsage.some((count) => count > 0)) {
    throw new Error(
      "Seed pilot ditolak karena organisasi sudah memiliki setoran atau laporan. Kelola data dari aplikasi.",
    );
  }

  const summary = {
    mode: apply ? "APPLY" : "DRY_RUN",
    organization: source.organization.slug,
    users: source.users.length,
    teachers: source.users.filter((user) => user.roles.includes("TEACHER")).length,
    halaqahs: source.halaqahs.length,
    students: source.students.length,
    period: source.period.name,
    canApply: academicUsage.every((count) => count === 0),
  };

  if (!apply) {
    console.info("Dry-run seed pilot lulus:", summary);
    if (!summary.canApply) {
      console.info("Apply akan ditolak karena organisasi sudah memiliki setoran atau laporan.");
    }
    console.info("Tidak ada data yang diubah. Tambahkan --apply untuk menerapkan.");
    process.exitCode = 0;
  } else {
    const passwordHashes = new Map(
      await Promise.all(
        source.users.map(async (user) => [
          user.email,
          await hash(passwords.get(user.email) as string, 12),
        ] as const),
      ),
    );

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.upsert({
        where: { slug: source.organization.slug },
        update: {
          name: source.organization.name,
          timezone: source.organization.timezone,
          status: "ACTIVE",
        },
        create: { ...source.organization, status: "ACTIVE" },
      });
      const activeOrganizationCount = await tx.organization.count({
        where: { status: "ACTIVE" },
      });
      if (activeOrganizationCount !== 1) {
        throw new Error("Instalasi pilot harus memiliki tepat satu organisasi aktif.");
      }

      const roles = await tx.role.findMany({
        where: { code: { in: ["ADMIN", "HEAD", "TEACHER"] } },
        select: { id: true, code: true },
      });
      if (roles.length !== 3) {
        throw new Error("Role dasar belum lengkap. Jalankan npm run db:seed terlebih dahulu.");
      }
      const roleIds = new Map(roles.map((role) => [role.code, role.id]));
      const seedActor = await tx.user.findFirst({
        where: {
          organizationId: organization.id,
          status: "ACTIVE",
          roles: { some: { revokedAt: null, role: { code: "HEAD" } } },
        },
        select: { id: true },
      });
      if (!seedActor) {
        throw new Error("Kepala aktif belum ada. Jalankan npm run db:seed terlebih dahulu.");
      }

      const users = new Map<string, { id: string }>();
      for (const input of source.users) {
        const user = await tx.user.upsert({
          where: {
            organizationId_email: {
              organizationId: organization.id,
              email: input.email,
            },
          },
          update: {
            name: input.name,
            phone: input.phone ?? null,
            passwordHash: passwordHashes.get(input.email) as string,
            status: "ACTIVE",
          },
          create: {
            organizationId: organization.id,
            name: input.name,
            email: input.email,
            phone: input.phone ?? null,
            passwordHash: passwordHashes.get(input.email) as string,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        users.set(input.email, user);

        for (const roleCode of input.roles) {
          const roleId = roleIds.get(roleCode);
          if (!roleId) throw new Error(`Role ${roleCode} tidak ditemukan.`);
          await tx.userRole.upsert({
            where: {
              organizationId_userId_roleId: {
                organizationId: organization.id,
                userId: user.id,
                roleId,
              },
            },
            update: { assignedById: seedActor.id, revokedAt: null },
            create: {
              organizationId: organization.id,
              userId: user.id,
              roleId,
              assignedById: seedActor.id,
            },
          });
        }
      }

      const activePeriod = await tx.academicPeriod.findFirst({
        where: {
          organizationId: organization.id,
          status: "ACTIVE",
          name: { not: source.period.name },
        },
        select: { name: true },
      });
      if (activePeriod) {
        throw new Error(`Periode aktif lain masih tersedia: ${activePeriod.name}.`);
      }
      await tx.academicPeriod.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name: source.period.name,
          },
        },
        update: {
          startDate: databaseDate(source.period.startDate),
          endDate: databaseDate(source.period.endDate),
          status: "ACTIVE",
        },
        create: {
          organizationId: organization.id,
          name: source.period.name,
          startDate: databaseDate(source.period.startDate),
          endDate: databaseDate(source.period.endDate),
          status: "ACTIVE",
        },
      });

      const halaqahs = new Map<string, { id: string }>();
      for (const input of source.halaqahs) {
        const teacher = users.get(input.teacherEmail);
        if (!teacher) throw new Error(`Pengajar ${input.teacherEmail} tidak ditemukan.`);
        const halaqah = await tx.halaqah.upsert({
          where: {
            organizationId_name: {
              organizationId: organization.id,
              name: input.name,
            },
          },
          update: { description: input.description ?? null, status: "ACTIVE" },
          create: {
            organizationId: organization.id,
            name: input.name,
            description: input.description ?? null,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        halaqahs.set(input.name, halaqah);
        await tx.halaqahTeacherAssignment.upsert({
          where: {
            organizationId_halaqahId_teacherUserId_assignmentType_validFrom: {
              organizationId: organization.id,
              halaqahId: halaqah.id,
              teacherUserId: teacher.id,
              assignmentType: "PRIMARY",
              validFrom: databaseDate(source.period.startDate),
            },
          },
          update: { validUntil: null, createdById: seedActor.id },
          create: {
            organizationId: organization.id,
            halaqahId: halaqah.id,
            teacherUserId: teacher.id,
            assignmentType: "PRIMARY",
            validFrom: databaseDate(source.period.startDate),
            createdById: seedActor.id,
          },
        });
      }

      for (const input of source.students) {
        const halaqah = halaqahs.get(input.halaqahName);
        if (!halaqah) throw new Error(`Halaqah ${input.halaqahName} tidak ditemukan.`);
        const student = await tx.student.upsert({
          where: {
            organizationId_studentNumber: {
              organizationId: organization.id,
              studentNumber: input.studentNumber,
            },
          },
          update: {
            fullName: input.fullName,
            preferredName: input.preferredName ?? null,
            joinedAt: databaseDate(input.joinedAt),
            status: "ACTIVE",
          },
          create: {
            organizationId: organization.id,
            studentNumber: input.studentNumber,
            fullName: input.fullName,
            preferredName: input.preferredName ?? null,
            joinedAt: databaseDate(input.joinedAt),
            status: "ACTIVE",
          },
          select: { id: true },
        });
        await tx.halaqahMembership.upsert({
          where: {
            organizationId_studentId_validFrom: {
              organizationId: organization.id,
              studentId: student.id,
              validFrom: databaseDate(source.period.startDate),
            },
          },
          update: {
            halaqahId: halaqah.id,
            validUntil: null,
            status: "ACTIVE",
            createdById: seedActor.id,
          },
          create: {
            organizationId: organization.id,
            halaqahId: halaqah.id,
            studentId: student.id,
            validFrom: databaseDate(source.period.startDate),
            status: "ACTIVE",
            createdById: seedActor.id,
          },
        });
      }

      return { ...summary, organizationId: organization.id };
    }, { isolationLevel: "Serializable" });

    console.info("Data pilot siap:", result);
  }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
