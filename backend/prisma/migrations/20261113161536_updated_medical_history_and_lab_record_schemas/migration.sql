/*
  Warnings:

  - You are about to drop the `tbl_medical_record` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_medical_record_file` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_medical_record_type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `hash` to the `tbl_audit_log` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tbl_medical_record` DROP FOREIGN KEY `tbl_medical_record_tbl_medical_record_type_FK`;

-- DropForeignKey
ALTER TABLE `tbl_medical_record` DROP FOREIGN KEY `tbl_medical_record_tbl_visit_FK`;

-- DropForeignKey
ALTER TABLE `tbl_medical_record_file` DROP FOREIGN KEY `tbl_medical_record_file_tbl_account_FK`;

-- DropForeignKey
ALTER TABLE `tbl_medical_record_file` DROP FOREIGN KEY `tbl_medical_record_file_tbl_medical_record_FK`;

-- AlterTable
ALTER TABLE `tbl_audit_log` ADD COLUMN `hash` CHAR(64) NOT NULL;

-- AlterTable
ALTER TABLE `tbl_visit` ADD COLUMN `visit_type` ENUM('Walk-in', 'Appointment', 'Follow-up') NOT NULL DEFAULT 'Walk-in',
    MODIFY `visit_date` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `visit_time` TIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- DropTable
DROP TABLE `tbl_medical_record`;

-- DropTable
DROP TABLE `tbl_medical_record_file`;

-- DropTable
DROP TABLE `tbl_medical_record_type`;

-- CreateTable
CREATE TABLE `tbl_medical_history` (
    `record_id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `weight_kg` DECIMAL(5, 2) NULL,
    `temperature` DECIMAL(4, 1) NULL,
    `heart_rate` INTEGER NULL,
    `findings` JSON NULL,
    `assessment` JSON NULL,
    `treatment_plan` JSON NULL,
    `instructions` JSON NULL,

    INDEX `tbl_medical_record_tbl_visit_FK`(`visit_id`),
    PRIMARY KEY (`record_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_lab_result` (
    `lab_result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `test_type_id` INTEGER NOT NULL,
    `interpretation` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `tbl_lab_result_tbl_visit_FK`(`visit_id`),
    PRIMARY KEY (`lab_result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_lab_test_type` (
    `test_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `test_code` VARCHAR(20) NOT NULL,
    `test_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `tbl_lab_test_type_code`(`test_code`),
    PRIMARY KEY (`test_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_lab_test_parameter` (
    `parameter_id` INTEGER NOT NULL AUTO_INCREMENT,
    `test_type_id` INTEGER NOT NULL,
    `parameter_name` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(20) NULL,
    `ref_range_text` VARCHAR(100) NULL,
    `display_order` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_lab_test_parameter_tbl_lab_test_type_FK`(`test_type_id`),
    PRIMARY KEY (`parameter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_lab_result_value` (
    `value_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_result_id` INTEGER NOT NULL,
    `parameter_id` INTEGER NOT NULL,
    `value` DECIMAL(10, 2) NULL,
    `text_value` VARCHAR(100) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_lab_result_value_tbl_lab_result_FK`(`lab_result_id`),
    INDEX `tbl_lab_result_value_tbl_lab_test_parameter_FK`(`parameter_id`),
    PRIMARY KEY (`value_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_attachment` (
    `attachment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `medical_history_id` INTEGER NULL,
    `lab_result_id` INTEGER NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `storage_key` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size_bytes` INTEGER NOT NULL,
    `checksum` CHAR(64) NOT NULL,
    `uploader_account_id` INTEGER NOT NULL,
    `uploaded_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_attachment_tbl_medical_history_FK`(`medical_history_id`),
    INDEX `tbl_attachment_tbl_lab_result_FK`(`lab_result_id`),
    INDEX `tbl_attachment_tbl_account_FK`(`uploader_account_id`),
    PRIMARY KEY (`attachment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `tbl_audit_log_index_target` ON `tbl_audit_log`(`target_table`, `target_id`);

-- CreateIndex
CREATE INDEX `tbl_audit_log_index_created_at` ON `tbl_audit_log`(`created_at`);

-- CreateIndex
CREATE INDEX `tbl_audit_log_index_action` ON `tbl_audit_log`(`action`);

-- AddForeignKey
ALTER TABLE `tbl_medical_history` ADD CONSTRAINT `tbl_medical_record_tbl_visit_FK` FOREIGN KEY (`visit_id`) REFERENCES `tbl_visit`(`visit_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_lab_result` ADD CONSTRAINT `tbl_lab_result_tbl_lab_test_type_FK` FOREIGN KEY (`test_type_id`) REFERENCES `tbl_lab_test_type`(`test_type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_lab_result` ADD CONSTRAINT `tbl_lab_result_tbl_visit_FK` FOREIGN KEY (`visit_id`) REFERENCES `tbl_visit`(`visit_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_lab_test_parameter` ADD CONSTRAINT `tbl_lab_test_parameter_tbl_lab_test_type_FK` FOREIGN KEY (`test_type_id`) REFERENCES `tbl_lab_test_type`(`test_type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_lab_result_value` ADD CONSTRAINT `tbl_lab_result_value_tbl_lab_result_FK` FOREIGN KEY (`lab_result_id`) REFERENCES `tbl_lab_result`(`lab_result_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_lab_result_value` ADD CONSTRAINT `tbl_lab_result_value_tbl_lab_test_parameter_FK` FOREIGN KEY (`parameter_id`) REFERENCES `tbl_lab_test_parameter`(`parameter_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_attachment` ADD CONSTRAINT `tbl_attachment_tbl_lab_result_FK` FOREIGN KEY (`lab_result_id`) REFERENCES `tbl_lab_result`(`lab_result_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_attachment` ADD CONSTRAINT `tbl_attachment_tbl_medical_history_FK` FOREIGN KEY (`medical_history_id`) REFERENCES `tbl_medical_history`(`record_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_attachment` ADD CONSTRAINT `tbl_attachment_tbl_account_FK` FOREIGN KEY (`uploader_account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
