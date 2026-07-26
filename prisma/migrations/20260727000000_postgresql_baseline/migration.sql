-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('ADMIN', 'HEAD', 'TEACHER');

-- CreateEnum
CREATE TYPE "MasterDataStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "TeacherAssignmentType" AS ENUM ('PRIMARY', 'ASSISTANT', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AcademicPeriodStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmissionCategory" AS ENUM ('SABAQ', 'SABQI', 'MANZIL');

-- CreateEnum
CREATE TYPE "FluencyPredicate" AS ENUM ('FLUENT', 'FAIRLY_FLUENT', 'LESS_FLUENT');

-- CreateEnum
CREATE TYPE "MemorizationRecordStatus" AS ENUM ('ACTIVE', 'VOID');

-- CreateEnum
CREATE TYPE "MemorizationAuditAction" AS ENUM ('CREATE', 'UPDATE', 'VOID');

-- CreateEnum
CREATE TYPE "GeneratedReportStatus" AS ENUM ('ISSUED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "OperationalAuditDomain" AS ENUM ('USER', 'ROLE', 'STUDENT', 'GUARDIAN', 'HALAQAH', 'TEACHER_ASSIGNMENT', 'STUDENT_MEMBERSHIP', 'ACADEMIC_PERIOD');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("organizationId","userId","roleId")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_throttles" (
    "emailHash" VARCHAR(64) NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("emailHash")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "gender" "Gender",
    "birthDate" DATE,
    "joinedAt" DATE NOT NULL,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halaqahs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "halaqahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halaqah_teacher_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "halaqahId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "assignmentType" "TeacherAssignmentType" NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "halaqah_teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halaqah_memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "halaqahId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "halaqah_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AcademicPeriodStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_surahs" (
    "surahNumber" INTEGER NOT NULL,
    "arabicName" TEXT NOT NULL,
    "latinName" TEXT NOT NULL,
    "verseCount" INTEGER NOT NULL,

    CONSTRAINT "quran_surahs_pkey" PRIMARY KEY ("surahNumber")
);

-- CreateTable
CREATE TABLE "memorization_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "halaqahId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "submissionDate" DATE NOT NULL,
    "submissionCategory" "SubmissionCategory" NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "startVerse" INTEGER NOT NULL,
    "endVerse" INTEGER NOT NULL,
    "fluencyPredicate" "FluencyPredicate" NOT NULL,
    "teacherNote" TEXT,
    "nextTarget" TEXT,
    "pageNumber" INTEGER,
    "duplicateOverride" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOverrideReason" TEXT,
    "duplicateReferenceRecordId" TEXT,
    "recordStatus" "MemorizationRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "studentNameSnapshot" TEXT NOT NULL,
    "halaqahNameSnapshot" TEXT NOT NULL,
    "teacherNameSnapshot" TEXT NOT NULL,
    "periodNameSnapshot" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memorization_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorization_record_audits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memorizationRecordId" TEXT NOT NULL,
    "action" "MemorizationAuditAction" NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "reason" TEXT,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memorization_record_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domain" "OperationalAuditDomain" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "reason" TEXT,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicPeriodId" TEXT,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "GeneratedReportStatus" NOT NULL DEFAULT 'ISSUED',
    "supersedesReportId" TEXT,
    "reportSnapshot" JSONB NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "users_organizationId_status_idx" ON "users"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_organizationId_email_key" ON "users"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_organizationId_key" ON "users"("id", "organizationId");

-- CreateIndex
CREATE INDEX "user_roles_organizationId_roleId_revokedAt_idx" ON "user_roles"("organizationId", "roleId", "revokedAt");

-- CreateIndex
CREATE INDEX "user_roles_assignedById_organizationId_idx" ON "user_roles"("assignedById", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_tokenHash_key" ON "user_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "user_sessions_organizationId_userId_revokedAt_expiresAt_idx" ON "user_sessions"("organizationId", "userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "login_throttles_updatedAt_idx" ON "login_throttles"("updatedAt");

-- CreateIndex
CREATE INDEX "students_organizationId_status_fullName_idx" ON "students"("organizationId", "status", "fullName");

-- CreateIndex
CREATE UNIQUE INDEX "students_organizationId_studentNumber_key" ON "students"("organizationId", "studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "students_id_organizationId_key" ON "students"("id", "organizationId");

-- CreateIndex
CREATE INDEX "guardians_organizationId_status_fullName_idx" ON "guardians"("organizationId", "status", "fullName");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_id_organizationId_key" ON "guardians"("id", "organizationId");

-- CreateIndex
CREATE INDEX "student_guardians_guardianId_organizationId_idx" ON "student_guardians"("guardianId", "organizationId");

-- CreateIndex
CREATE INDEX "student_guardians_organizationId_studentId_isPrimary_validU_idx" ON "student_guardians"("organizationId", "studentId", "isPrimary", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_organizationId_studentId_guardianId_valid_key" ON "student_guardians"("organizationId", "studentId", "guardianId", "validFrom");

-- CreateIndex
CREATE INDEX "halaqahs_organizationId_status_idx" ON "halaqahs"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "halaqahs_organizationId_name_key" ON "halaqahs"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "halaqahs_id_organizationId_key" ON "halaqahs"("id", "organizationId");

-- CreateIndex
CREATE INDEX "halaqah_teacher_assignments_teacherUserId_organizationId_va_idx" ON "halaqah_teacher_assignments"("teacherUserId", "organizationId", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "halaqah_teacher_assignments_createdById_organizationId_idx" ON "halaqah_teacher_assignments"("createdById", "organizationId");

-- CreateIndex
CREATE INDEX "halaqah_teacher_assignments_organizationId_halaqahId_assign_idx" ON "halaqah_teacher_assignments"("organizationId", "halaqahId", "assignmentType", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "halaqah_teacher_assignments_organizationId_halaqahId_teache_key" ON "halaqah_teacher_assignments"("organizationId", "halaqahId", "teacherUserId", "assignmentType", "validFrom");

-- CreateIndex
CREATE INDEX "halaqah_memberships_organizationId_studentId_status_validUn_idx" ON "halaqah_memberships"("organizationId", "studentId", "status", "validUntil");

-- CreateIndex
CREATE INDEX "halaqah_memberships_organizationId_halaqahId_status_validUn_idx" ON "halaqah_memberships"("organizationId", "halaqahId", "status", "validUntil");

-- CreateIndex
CREATE INDEX "halaqah_memberships_createdById_organizationId_idx" ON "halaqah_memberships"("createdById", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "halaqah_memberships_organizationId_studentId_validFrom_key" ON "halaqah_memberships"("organizationId", "studentId", "validFrom");

-- CreateIndex
CREATE INDEX "academic_periods_organizationId_status_startDate_endDate_idx" ON "academic_periods"("organizationId", "status", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_organizationId_name_key" ON "academic_periods"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_id_organizationId_key" ON "academic_periods"("id", "organizationId");

-- CreateIndex
CREATE INDEX "memorization_student_date_idx" ON "memorization_records"("organizationId", "studentId", "submissionDate");

-- CreateIndex
CREATE INDEX "memorization_records_organizationId_halaqahId_submissionDat_idx" ON "memorization_records"("organizationId", "halaqahId", "submissionDate");

-- CreateIndex
CREATE INDEX "memorization_records_organizationId_teacherUserId_submissio_idx" ON "memorization_records"("organizationId", "teacherUserId", "submissionDate");

-- CreateIndex
CREATE INDEX "memorization_records_organizationId_academicPeriodId_record_idx" ON "memorization_records"("organizationId", "academicPeriodId", "recordStatus");

-- CreateIndex
CREATE INDEX "memorization_duplicate_lookup_idx" ON "memorization_records"("organizationId", "studentId", "submissionDate", "submissionCategory", "surahNumber", "startVerse", "endVerse");

-- CreateIndex
CREATE INDEX "memorization_records_duplicateReferenceRecordId_organizatio_idx" ON "memorization_records"("duplicateReferenceRecordId", "organizationId");

-- CreateIndex
CREATE INDEX "memorization_records_createdById_organizationId_idx" ON "memorization_records"("createdById", "organizationId");

-- CreateIndex
CREATE INDEX "memorization_records_updatedById_organizationId_idx" ON "memorization_records"("updatedById", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "memorization_records_id_organizationId_key" ON "memorization_records"("id", "organizationId");

-- CreateIndex
CREATE INDEX "memorization_record_audits_organizationId_memorizationRecor_idx" ON "memorization_record_audits"("organizationId", "memorizationRecordId", "performedAt");

-- CreateIndex
CREATE INDEX "memorization_record_audits_performedById_organizationId_idx" ON "memorization_record_audits"("performedById", "organizationId");

-- CreateIndex
CREATE INDEX "operational_audit_logs_organizationId_domain_entityId_perfo_idx" ON "operational_audit_logs"("organizationId", "domain", "entityId", "performedAt");

-- CreateIndex
CREATE INDEX "operational_audit_logs_performedById_organizationId_idx" ON "operational_audit_logs"("performedById", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_reports_supersedesReportId_key" ON "generated_reports"("supersedesReportId");

-- CreateIndex
CREATE INDEX "generated_reports_organizationId_studentId_generatedAt_idx" ON "generated_reports"("organizationId", "studentId", "generatedAt");

-- CreateIndex
CREATE INDEX "report_scope_status_idx" ON "generated_reports"("organizationId", "studentId", "academicPeriodId", "periodStart", "periodEnd", "status");

-- CreateIndex
CREATE INDEX "generated_reports_academicPeriodId_organizationId_idx" ON "generated_reports"("academicPeriodId", "organizationId");

-- CreateIndex
CREATE INDEX "generated_reports_generatedById_organizationId_idx" ON "generated_reports"("generatedById", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_reports_organizationId_reportNumber_key" ON "generated_reports"("organizationId", "reportNumber");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_organizationId_fkey" FOREIGN KEY ("userId", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assignedById_organizationId_fkey" FOREIGN KEY ("assignedById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_organizationId_fkey" FOREIGN KEY ("userId", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_organizationId_fkey" FOREIGN KEY ("studentId", "organizationId") REFERENCES "students"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardianId_organizationId_fkey" FOREIGN KEY ("guardianId", "organizationId") REFERENCES "guardians"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqahs" ADD CONSTRAINT "halaqahs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_teacher_assignments" ADD CONSTRAINT "halaqah_teacher_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_teacher_assignments" ADD CONSTRAINT "halaqah_teacher_assignments_halaqahId_organizationId_fkey" FOREIGN KEY ("halaqahId", "organizationId") REFERENCES "halaqahs"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_teacher_assignments" ADD CONSTRAINT "halaqah_teacher_assignments_teacherUserId_organizationId_fkey" FOREIGN KEY ("teacherUserId", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_teacher_assignments" ADD CONSTRAINT "halaqah_teacher_assignments_createdById_organizationId_fkey" FOREIGN KEY ("createdById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_memberships" ADD CONSTRAINT "halaqah_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_memberships" ADD CONSTRAINT "halaqah_memberships_halaqahId_organizationId_fkey" FOREIGN KEY ("halaqahId", "organizationId") REFERENCES "halaqahs"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_memberships" ADD CONSTRAINT "halaqah_memberships_studentId_organizationId_fkey" FOREIGN KEY ("studentId", "organizationId") REFERENCES "students"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqah_memberships" ADD CONSTRAINT "halaqah_memberships_createdById_organizationId_fkey" FOREIGN KEY ("createdById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_academicPeriodId_organizationId_fkey" FOREIGN KEY ("academicPeriodId", "organizationId") REFERENCES "academic_periods"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_studentId_organizationId_fkey" FOREIGN KEY ("studentId", "organizationId") REFERENCES "students"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_halaqahId_organizationId_fkey" FOREIGN KEY ("halaqahId", "organizationId") REFERENCES "halaqahs"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_teacherUserId_organizationId_fkey" FOREIGN KEY ("teacherUserId", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_surahNumber_fkey" FOREIGN KEY ("surahNumber") REFERENCES "quran_surahs"("surahNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_duplicateReferenceRecordId_organizati_fkey" FOREIGN KEY ("duplicateReferenceRecordId", "organizationId") REFERENCES "memorization_records"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_createdById_organizationId_fkey" FOREIGN KEY ("createdById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_records" ADD CONSTRAINT "memorization_records_updatedById_organizationId_fkey" FOREIGN KEY ("updatedById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_record_audits" ADD CONSTRAINT "memorization_record_audits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_record_audits" ADD CONSTRAINT "memorization_record_audits_memorizationRecordId_organizati_fkey" FOREIGN KEY ("memorizationRecordId", "organizationId") REFERENCES "memorization_records"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_record_audits" ADD CONSTRAINT "memorization_record_audits_performedById_organizationId_fkey" FOREIGN KEY ("performedById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_audit_logs" ADD CONSTRAINT "operational_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_audit_logs" ADD CONSTRAINT "operational_audit_logs_performedById_organizationId_fkey" FOREIGN KEY ("performedById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_studentId_organizationId_fkey" FOREIGN KEY ("studentId", "organizationId") REFERENCES "students"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_academicPeriodId_organizationId_fkey" FOREIGN KEY ("academicPeriodId", "organizationId") REFERENCES "academic_periods"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generatedById_organizationId_fkey" FOREIGN KEY ("generatedById", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_supersedesReportId_fkey" FOREIGN KEY ("supersedesReportId") REFERENCES "generated_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
