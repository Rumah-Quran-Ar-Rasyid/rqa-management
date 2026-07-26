import type { RoleCode } from "../src/generated/prisma/enums";
import type { PrismaClient } from "../src/generated/prisma/client";
import { currentDateInTimezone, databaseDate } from "./operational-utils";

export type ReadinessCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export async function collectPilotReadiness(
  prisma: PrismaClient,
  now = new Date(),
): Promise<ReadinessCheck[]> {
  const organizations = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, timezone: true },
    take: 2,
  });
  const organization = organizations[0];

  if (!organization || organizations.length !== 1) {
    return [{
      name: "Organisasi aktif",
      ok: false,
      detail: `Ditemukan ${organizations.length}; harus tepat satu.`,
    }];
  }

  const today = databaseDate(currentDateInTimezone(organization.timezone, now));
  const activeRoleCount = async (role: RoleCode) =>
    prisma.user.count({
      where: {
        organizationId: organization.id,
        status: "ACTIVE",
        roles: { some: { revokedAt: null, role: { code: role } } },
      },
    });
  const [heads, admins, teachers, periods, halaqahs, students, assignments, memberships, surahs] =
    await Promise.all([
      activeRoleCount("HEAD"),
      activeRoleCount("ADMIN"),
      activeRoleCount("TEACHER"),
      prisma.academicPeriod.count({
        where: {
          organizationId: organization.id,
          status: "ACTIVE",
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      prisma.halaqah.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.student.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.halaqahTeacherAssignment.count({
        where: {
          organizationId: organization.id,
          validFrom: { lte: today },
          OR: [{ validUntil: null }, { validUntil: { gte: today } }],
          halaqah: { status: "ACTIVE" },
          teacher: {
            status: "ACTIVE",
            roles: { some: { revokedAt: null, role: { code: "TEACHER" } } },
          },
        },
      }),
      prisma.halaqahMembership.count({
        where: {
          organizationId: organization.id,
          status: "ACTIVE",
          validFrom: { lte: today },
          OR: [{ validUntil: null }, { validUntil: { gte: today } }],
          halaqah: { status: "ACTIVE" },
          student: { status: "ACTIVE" },
        },
      }),
      prisma.quranSurah.count(),
    ]);

  return [
    { name: "Organisasi aktif", ok: true, detail: "Tepat satu organisasi aktif." },
    { name: "Kepala aktif", ok: heads >= 1, detail: `${heads} akun.` },
    { name: "Admin aktif", ok: admins >= 1, detail: `${admins} akun.` },
    { name: "Pengajar aktif", ok: teachers >= 2, detail: `${teachers} akun; minimal 2.` },
    { name: "Periode berjalan", ok: periods === 1, detail: `${periods} periode aktif mencakup hari ini.` },
    { name: "Halaqah aktif", ok: halaqahs >= 1 && halaqahs <= 2, detail: `${halaqahs} halaqah; target 1-2.` },
    { name: "Santri aktif", ok: students >= 10 && students <= 20, detail: `${students} santri; target 10-20.` },
    { name: "Assignment berlaku", ok: assignments >= halaqahs, detail: `${assignments} assignment untuk ${halaqahs} halaqah.` },
    { name: "Membership berlaku", ok: memberships === students, detail: `${memberships} membership untuk ${students} santri.` },
    { name: "Master surah", ok: surahs === 114, detail: `${surahs} surah; harus 114.` },
  ];
}
