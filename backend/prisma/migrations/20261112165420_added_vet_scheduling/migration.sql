/*
  Warnings:

  - You are about to drop the column `category` on the `tbl_pet_care_tip` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `tbl_pet_care_tip` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `tbl_content_video` DROP FOREIGN KEY `tbl_content_video_category_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_content_video` DROP FOREIGN KEY `tbl_content_video_status_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_content_video` DROP FOREIGN KEY `tbl_content_video_uploader_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_pet_care_tip` DROP FOREIGN KEY `tbl_pet_care_tip_category_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_pet_care_tip` DROP FOREIGN KEY `tbl_pet_care_tip_icon_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_pet_care_tip` DROP FOREIGN KEY `tbl_pet_care_tip_status_fkey`;

-- AlterTable
ALTER TABLE `tbl_pet_care_tip` DROP COLUMN `category`,
    DROP COLUMN `description`;

-- AlterTable
ALTER TABLE `tbl_pet_owner` ADD COLUMN `email_notification` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `phone_notification` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `tbl_veterinarian_schedule` (
    `schedule_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vet_id` INTEGER NOT NULL,
    `day_of_week` INTEGER NOT NULL,
    `start_time` VARCHAR(5) NULL,
    `end_time` VARCHAR(5) NULL,
    `note` VARCHAR(255) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `assigner_id` INTEGER NULL,
    `assigned_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `tbl_veterinarian_schedule_tbl_veterinarian_FK`(`vet_id`),
    PRIMARY KEY (`schedule_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_veterinarian_time_off` (
    `time_off_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vet_id` INTEGER NOT NULL,
    `exception_date` DATE NOT NULL,
    `start_time` VARCHAR(5) NULL,
    `end_time` VARCHAR(5) NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `reason` VARCHAR(255) NULL,
    `note` VARCHAR(255) NULL,
    `reviewer_id` INTEGER NOT NULL,
    `reviewed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_veterinarian_time_off_tbl_veterinarian_FK`(`vet_id`),
    PRIMARY KEY (`time_off_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tbl_pet_care_tip` ADD CONSTRAINT `tbl_pet_care_tip_icon_id_fkey` FOREIGN KEY (`icon_id`) REFERENCES `tbl_pet_care_icon`(`icon_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_pet_care_tip` ADD CONSTRAINT `tbl_pet_care_tip_publication_status_id_fkey` FOREIGN KEY (`publication_status_id`) REFERENCES `tbl_publication_status`(`status_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_pet_care_tip` ADD CONSTRAINT `tbl_pet_care_tip_content_category_id_fkey` FOREIGN KEY (`content_category_id`) REFERENCES `tbl_pet_care_category`(`category_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_content_video` ADD CONSTRAINT `tbl_content_video_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `tbl_video_category`(`video_category_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_content_video` ADD CONSTRAINT `tbl_content_video_publication_status_id_fkey` FOREIGN KEY (`publication_status_id`) REFERENCES `tbl_publication_status`(`status_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_content_video` ADD CONSTRAINT `tbl_content_video_uploader_account_id_fkey` FOREIGN KEY (`uploader_account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_veterinarian_schedule` ADD CONSTRAINT `tbl_veterinarian_schedule_tbl_veterinarian_FK` FOREIGN KEY (`vet_id`) REFERENCES `tbl_veterinarian`(`vet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_veterinarian_time_off` ADD CONSTRAINT `tbl_veterinarian_time_off_tbl_veterinarian_FK` FOREIGN KEY (`vet_id`) REFERENCES `tbl_veterinarian`(`vet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
