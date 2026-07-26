-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Jakarta',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `code` ENUM('ADMIN', 'HEAD', 'TEACHER') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `status` ENUM('INVITED', 'ACTIVE', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'INVITED',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `users_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `users_organizationId_email_key`(`organizationId`, `email`),
    UNIQUE INDEX `users_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `assignedById` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    INDEX `user_roles_organizationId_roleId_revokedAt_idx`(`organizationId`, `roleId`, `revokedAt`),
    INDEX `user_roles_assignedById_organizationId_idx`(`assignedById`, `organizationId`),
    PRIMARY KEY (`organizationId`, `userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `preferredName` VARCHAR(191) NULL,
    `gender` ENUM('MALE', 'FEMALE') NULL,
    `birthDate` DATE NULL,
    `joinedAt` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `students_organizationId_status_fullName_idx`(`organizationId`, `status`, `fullName`),
    UNIQUE INDEX `students_organizationId_studentNumber_key`(`organizationId`, `studentNumber`),
    UNIQUE INDEX `students_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guardians` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `guardians_organizationId_status_fullName_idx`(`organizationId`, `status`, `fullName`),
    UNIQUE INDEX `guardians_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_guardians` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `guardianId` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `validFrom` DATE NOT NULL,
    `validUntil` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_guardians_guardianId_organizationId_idx`(`guardianId`, `organizationId`),
    INDEX `student_guardians_organizationId_studentId_isPrimary_validUn_idx`(`organizationId`, `studentId`, `isPrimary`, `validUntil`),
    UNIQUE INDEX `student_guardians_organizationId_studentId_guardianId_validF_key`(`organizationId`, `studentId`, `guardianId`, `validFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `halaqahs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `halaqahs_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `halaqahs_organizationId_name_key`(`organizationId`, `name`),
    UNIQUE INDEX `halaqahs_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `halaqah_teacher_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `halaqahId` VARCHAR(191) NOT NULL,
    `teacherUserId` VARCHAR(191) NOT NULL,
    `assignmentType` ENUM('PRIMARY', 'ASSISTANT', 'SUBSTITUTE') NOT NULL,
    `validFrom` DATE NOT NULL,
    `validUntil` DATE NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `halaqah_teacher_assignments_teacherUserId_organizationId_val_idx`(`teacherUserId`, `organizationId`, `validFrom`, `validUntil`),
    INDEX `halaqah_teacher_assignments_createdById_organizationId_idx`(`createdById`, `organizationId`),
    INDEX `halaqah_teacher_assignments_organizationId_halaqahId_assignm_idx`(`organizationId`, `halaqahId`, `assignmentType`, `validUntil`),
    UNIQUE INDEX `halaqah_teacher_assignments_organizationId_halaqahId_teacher_key`(`organizationId`, `halaqahId`, `teacherUserId`, `assignmentType`, `validFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `halaqah_memberships` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `halaqahId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `validFrom` DATE NOT NULL,
    `validUntil` DATE NULL,
    `status` ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `halaqah_memberships_organizationId_studentId_status_validUnt_idx`(`organizationId`, `studentId`, `status`, `validUntil`),
    INDEX `halaqah_memberships_organizationId_halaqahId_status_validUnt_idx`(`organizationId`, `halaqahId`, `status`, `validUntil`),
    INDEX `halaqah_memberships_createdById_organizationId_idx`(`createdById`, `organizationId`),
    UNIQUE INDEX `halaqah_memberships_organizationId_studentId_validFrom_key`(`organizationId`, `studentId`, `validFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_periods` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'PLANNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `academic_periods_organizationId_status_startDate_endDate_idx`(`organizationId`, `status`, `startDate`, `endDate`),
    UNIQUE INDEX `academic_periods_organizationId_name_key`(`organizationId`, `name`),
    UNIQUE INDEX `academic_periods_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quran_surahs` (
    `surahNumber` INTEGER NOT NULL,
    `arabicName` VARCHAR(191) NOT NULL,
    `latinName` VARCHAR(191) NOT NULL,
    `verseCount` INTEGER NOT NULL,

    PRIMARY KEY (`surahNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memorization_records` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `academicPeriodId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `halaqahId` VARCHAR(191) NOT NULL,
    `teacherUserId` VARCHAR(191) NOT NULL,
    `submissionDate` DATE NOT NULL,
    `submissionCategory` ENUM('SABAQ', 'SABQI', 'MANZIL') NOT NULL,
    `surahNumber` INTEGER NOT NULL,
    `startVerse` INTEGER NOT NULL,
    `endVerse` INTEGER NOT NULL,
    `fluencyPredicate` ENUM('FLUENT', 'FAIRLY_FLUENT', 'LESS_FLUENT') NOT NULL,
    `teacherNote` TEXT NULL,
    `nextTarget` TEXT NULL,
    `pageNumber` INTEGER NULL,
    `duplicateOverride` BOOLEAN NOT NULL DEFAULT false,
    `duplicateOverrideReason` TEXT NULL,
    `duplicateReferenceRecordId` VARCHAR(191) NULL,
    `recordStatus` ENUM('ACTIVE', 'VOID') NOT NULL DEFAULT 'ACTIVE',
    `studentNameSnapshot` VARCHAR(191) NOT NULL,
    `halaqahNameSnapshot` VARCHAR(191) NOT NULL,
    `teacherNameSnapshot` VARCHAR(191) NOT NULL,
    `periodNameSnapshot` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `memorization_student_date_idx`(`organizationId`, `studentId`, `submissionDate`),
    INDEX `memorization_records_organizationId_halaqahId_submissionDate_idx`(`organizationId`, `halaqahId`, `submissionDate`),
    INDEX `memorization_records_organizationId_teacherUserId_submission_idx`(`organizationId`, `teacherUserId`, `submissionDate`),
    INDEX `memorization_records_organizationId_academicPeriodId_recordS_idx`(`organizationId`, `academicPeriodId`, `recordStatus`),
    INDEX `memorization_duplicate_lookup_idx`(`organizationId`, `studentId`, `submissionDate`, `submissionCategory`, `surahNumber`, `startVerse`, `endVerse`),
    INDEX `memorization_records_duplicateReferenceRecordId_organization_idx`(`duplicateReferenceRecordId`, `organizationId`),
    INDEX `memorization_records_createdById_organizationId_idx`(`createdById`, `organizationId`),
    INDEX `memorization_records_updatedById_organizationId_idx`(`updatedById`, `organizationId`),
    UNIQUE INDEX `memorization_records_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memorization_record_audits` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `memorizationRecordId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'VOID') NOT NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `reason` TEXT NULL,
    `performedById` VARCHAR(191) NOT NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `memorization_record_audits_organizationId_memorizationRecord_idx`(`organizationId`, `memorizationRecordId`, `performedAt`),
    INDEX `memorization_record_audits_performedById_organizationId_idx`(`performedById`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operational_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `domain` ENUM('USER', 'ROLE', 'STUDENT', 'GUARDIAN', 'HALAQAH', 'TEACHER_ASSIGNMENT', 'STUDENT_MEMBERSHIP', 'ACADEMIC_PERIOD') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `reason` TEXT NULL,
    `performedById` VARCHAR(191) NOT NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operational_audit_logs_organizationId_domain_entityId_perfor_idx`(`organizationId`, `domain`, `entityId`, `performedAt`),
    INDEX `operational_audit_logs_performedById_organizationId_idx`(`performedById`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generated_reports` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `academicPeriodId` VARCHAR(191) NULL,
    `periodStart` DATE NOT NULL,
    `periodEnd` DATE NOT NULL,
    `reportNumber` VARCHAR(191) NOT NULL,
    `reportSnapshot` JSON NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `generatedById` VARCHAR(191) NOT NULL,

    INDEX `generated_reports_organizationId_studentId_generatedAt_idx`(`organizationId`, `studentId`, `generatedAt`),
    INDEX `generated_reports_academicPeriodId_organizationId_idx`(`academicPeriodId`, `organizationId`),
    INDEX `generated_reports_generatedById_organizationId_idx`(`generatedById`, `organizationId`),
    UNIQUE INDEX `generated_reports_organizationId_reportNumber_key`(`organizationId`, `reportNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_organizationId_fkey` FOREIGN KEY (`userId`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assignedById_organizationId_fkey` FOREIGN KEY (`assignedById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardians` ADD CONSTRAINT `student_guardians_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardians` ADD CONSTRAINT `student_guardians_studentId_organizationId_fkey` FOREIGN KEY (`studentId`, `organizationId`) REFERENCES `students`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardians` ADD CONSTRAINT `student_guardians_guardianId_organizationId_fkey` FOREIGN KEY (`guardianId`, `organizationId`) REFERENCES `guardians`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqahs` ADD CONSTRAINT `halaqahs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_teacher_assignments` ADD CONSTRAINT `halaqah_teacher_assignments_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_teacher_assignments` ADD CONSTRAINT `halaqah_teacher_assignments_halaqahId_organizationId_fkey` FOREIGN KEY (`halaqahId`, `organizationId`) REFERENCES `halaqahs`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_teacher_assignments` ADD CONSTRAINT `halaqah_teacher_assignments_teacherUserId_organizationId_fkey` FOREIGN KEY (`teacherUserId`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_teacher_assignments` ADD CONSTRAINT `halaqah_teacher_assignments_createdById_organizationId_fkey` FOREIGN KEY (`createdById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_memberships` ADD CONSTRAINT `halaqah_memberships_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_memberships` ADD CONSTRAINT `halaqah_memberships_halaqahId_organizationId_fkey` FOREIGN KEY (`halaqahId`, `organizationId`) REFERENCES `halaqahs`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_memberships` ADD CONSTRAINT `halaqah_memberships_studentId_organizationId_fkey` FOREIGN KEY (`studentId`, `organizationId`) REFERENCES `students`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `halaqah_memberships` ADD CONSTRAINT `halaqah_memberships_createdById_organizationId_fkey` FOREIGN KEY (`createdById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_periods` ADD CONSTRAINT `academic_periods_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_academicPeriodId_organizationId_fkey` FOREIGN KEY (`academicPeriodId`, `organizationId`) REFERENCES `academic_periods`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_studentId_organizationId_fkey` FOREIGN KEY (`studentId`, `organizationId`) REFERENCES `students`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_halaqahId_organizationId_fkey` FOREIGN KEY (`halaqahId`, `organizationId`) REFERENCES `halaqahs`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_teacherUserId_organizationId_fkey` FOREIGN KEY (`teacherUserId`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_surahNumber_fkey` FOREIGN KEY (`surahNumber`) REFERENCES `quran_surahs`(`surahNumber`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_duplicateReferenceRecordId_organizatio_fkey` FOREIGN KEY (`duplicateReferenceRecordId`, `organizationId`) REFERENCES `memorization_records`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_createdById_organizationId_fkey` FOREIGN KEY (`createdById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_records` ADD CONSTRAINT `memorization_records_updatedById_organizationId_fkey` FOREIGN KEY (`updatedById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_record_audits` ADD CONSTRAINT `memorization_record_audits_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_record_audits` ADD CONSTRAINT `memorization_record_audits_memorizationRecordId_organizatio_fkey` FOREIGN KEY (`memorizationRecordId`, `organizationId`) REFERENCES `memorization_records`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memorization_record_audits` ADD CONSTRAINT `memorization_record_audits_performedById_organizationId_fkey` FOREIGN KEY (`performedById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operational_audit_logs` ADD CONSTRAINT `operational_audit_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operational_audit_logs` ADD CONSTRAINT `operational_audit_logs_performedById_organizationId_fkey` FOREIGN KEY (`performedById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_reports` ADD CONSTRAINT `generated_reports_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_reports` ADD CONSTRAINT `generated_reports_studentId_organizationId_fkey` FOREIGN KEY (`studentId`, `organizationId`) REFERENCES `students`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_reports` ADD CONSTRAINT `generated_reports_academicPeriodId_organizationId_fkey` FOREIGN KEY (`academicPeriodId`, `organizationId`) REFERENCES `academic_periods`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_reports` ADD CONSTRAINT `generated_reports_generatedById_organizationId_fkey` FOREIGN KEY (`generatedById`, `organizationId`) REFERENCES `users`(`id`, `organizationId`) ON DELETE RESTRICT ON UPDATE CASCADE;
