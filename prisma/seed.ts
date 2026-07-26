import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import { QURAN_SURAHS } from "./data/quran-surahs";

const seedEnvSchema = z.object({
  DIRECT_URL: z.string().url().refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "DIRECT_URL harus berupa URL PostgreSQL.",
  ),
  SEED_ORGANIZATION_NAME: z.string().min(1).default("Rumah Qur'an Ar-Rasyid"),
  SEED_ORGANIZATION_SLUG: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .default("rumah-quran-ar-rasyid"),
  SEED_ADMIN_NAME: z.string().min(1).default("Administrator"),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(12),
});

const parsedSeedEnv = seedEnvSchema.safeParse(process.env);

if (!parsedSeedEnv.success) {
  console.error(
    "Konfigurasi seed belum lengkap:",
    parsedSeedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Konfigurasi seed belum lengkap");
}

const seedEnv = parsedSeedEnv.data;
const adapter = new PrismaPg({ connectionString: seedEnv.DIRECT_URL, max: 2 });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash(seedEnv.SEED_ADMIN_PASSWORD, 12);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.upsert({
      where: { slug: seedEnv.SEED_ORGANIZATION_SLUG },
      update: {
        name: seedEnv.SEED_ORGANIZATION_NAME,
        status: "ACTIVE",
      },
      create: {
        name: seedEnv.SEED_ORGANIZATION_NAME,
        slug: seedEnv.SEED_ORGANIZATION_SLUG,
        status: "ACTIVE",
        timezone: "Asia/Jakarta",
      },
    });

    const roles = await Promise.all(
      [
        { code: "ADMIN" as const, name: "Admin" },
        { code: "HEAD" as const, name: "Kepala" },
        { code: "TEACHER" as const, name: "Pengajar" },
      ].map((role) =>
        tx.role.upsert({
          where: { code: role.code },
          update: { name: role.name },
          create: role,
        }),
      ),
    );

    const admin = await tx.user.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: seedEnv.SEED_ADMIN_EMAIL,
        },
      },
      update: {
        name: seedEnv.SEED_ADMIN_NAME,
        passwordHash,
        status: "ACTIVE",
      },
      create: {
        organizationId: organization.id,
        name: seedEnv.SEED_ADMIN_NAME,
        email: seedEnv.SEED_ADMIN_EMAIL,
        passwordHash,
        status: "ACTIVE",
      },
    });

    await tx.userSession.updateMany({
      where: {
        organizationId: organization.id,
        userId: admin.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    for (const role of roles.filter(({ code }) =>
      ["ADMIN", "HEAD"].includes(code),
    )) {
      await tx.userRole.upsert({
        where: {
          organizationId_userId_roleId: {
            organizationId: organization.id,
            userId: admin.id,
            roleId: role.id,
          },
        },
        update: {
          assignedById: admin.id,
          revokedAt: null,
        },
        create: {
          organizationId: organization.id,
          userId: admin.id,
          roleId: role.id,
          assignedById: admin.id,
        },
      });
    }

    const surahs = await tx.quranSurah.createMany({
      data: QURAN_SURAHS.map((surah) => ({ ...surah })),
      skipDuplicates: true,
    });

    return {
      organization: organization.slug,
      admin: admin.email,
      insertedSurahs: surahs.count,
    };
  });

  console.info("Seed selesai:", result);
}

main()
  .catch((error: unknown) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
