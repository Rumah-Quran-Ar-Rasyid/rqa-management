-- AlterTable
ALTER TABLE `generated_reports`
  ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `status` ENUM('ISSUED', 'SUPERSEDED') NOT NULL DEFAULT 'ISSUED',
  ADD COLUMN `supersedesReportId` VARCHAR(191) NULL,
  ADD COLUMN `issuedAt` DATETIME(3) NULL;

-- Preserve the historical publication time of existing reports.
UPDATE `generated_reports` SET `issuedAt` = `generatedAt` WHERE `issuedAt` IS NULL;

-- AlterTable
ALTER TABLE `generated_reports` MODIFY `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `generated_reports_supersedesReportId_key` ON `generated_reports`(`supersedesReportId`);
CREATE INDEX `report_scope_status_idx`
  ON `generated_reports`(`organizationId`, `studentId`, `academicPeriodId`, `periodStart`, `periodEnd`, `status`);

-- AddForeignKey
ALTER TABLE `generated_reports`
  ADD CONSTRAINT `generated_reports_supersedesReportId_fkey`
  FOREIGN KEY (`supersedesReportId`) REFERENCES `generated_reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
