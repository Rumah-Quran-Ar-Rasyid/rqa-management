-- CreateTable
CREATE TABLE `login_throttles` (
    `emailHash` VARCHAR(64) NOT NULL,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `windowStartedAt` DATETIME(3) NOT NULL,
    `lockedUntil` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `login_throttles_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`emailHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
