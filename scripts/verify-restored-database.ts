import "dotenv/config";

import {
  createDatabaseClient,
  databaseIdentity,
  databaseUrlSchema,
  readArgument,
} from "./operational-utils";

const targetUrl = databaseUrlSchema.parse(readArgument("--target-url"));
if (
  process.env.DIRECT_URL &&
  databaseIdentity(targetUrl) === databaseIdentity(process.env.DIRECT_URL)
) {
  throw new Error("Target verifikasi tidak boleh sama dengan DIRECT_URL sumber.");
}
const prisma = createDatabaseClient(targetUrl);

async function main() {
  try {
    const [organizations, users, heads, students, records, audits, reports, surahs, orphanRecords] =
      await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
        prisma.user.count({
          where: {
            status: "ACTIVE",
            roles: { some: { revokedAt: null, role: { code: "HEAD" } } },
          },
        }),
        prisma.student.count(),
        prisma.memorizationRecord.count(),
        prisma.memorizationRecordAudit.count(),
        prisma.generatedReport.count(),
        prisma.quranSurah.count(),
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) AS count
          FROM memorization_records records
          LEFT JOIN students students
            ON students.id = records."studentId"
            AND students."organizationId" = records."organizationId"
          LEFT JOIN users teachers
            ON teachers.id = records."teacherUserId"
            AND teachers."organizationId" = records."organizationId"
          LEFT JOIN academic_periods periods
            ON periods.id = records."academicPeriodId"
            AND periods."organizationId" = records."organizationId"
          WHERE students.id IS NULL OR teachers.id IS NULL OR periods.id IS NULL
        `,
      ]);
    const orphanCount = Number(orphanRecords[0]?.count ?? 0);
    const checks = [
      { name: "organisasi", ok: organizations >= 1, value: organizations },
      { name: "pengguna", ok: users >= 1, value: users },
      { name: "Kepala aktif", ok: heads >= 1, value: heads },
      { name: "santri", ok: students >= 0, value: students },
      { name: "setoran", ok: records >= 0, value: records },
      { name: "audit setoran", ok: audits >= records, value: audits },
      { name: "laporan", ok: reports >= 0, value: reports },
      { name: "master surah", ok: surahs === 114, value: surahs },
      { name: "setoran yatim", ok: orphanCount === 0, value: orphanCount },
    ];
    checks.forEach((check) =>
      console.info(`${check.ok ? "LULUS" : "GAGAL"} — ${check.name}: ${check.value}`),
    );
    if (checks.some((check) => !check.ok)) {
      throw new Error("Verifikasi database restore gagal.");
    }
    console.info("Verifikasi database restore lulus.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
