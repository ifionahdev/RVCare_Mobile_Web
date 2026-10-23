/*
  Warnings:

  - A unique constraint covering the columns `[account_id]` on the table `tbl_admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[account_id]` on the table `tbl_pet_owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[account_id]` on the table `tbl_veterinarian` will be added. If there are existing duplicate values, this will fail.
  - Made the column `is_deleted` on table `tbl_admin` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scheduled_date` on table `tbl_appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scheduled_time` on table `tbl_appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tbl_appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_updated` on table `tbl_appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_deleted` on table `tbl_appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uploaded_at` on table `tbl_medical_record_file` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_deleted` on table `tbl_medical_record_file` required. This step will fail if there are existing NULL values in that column.
  - Made the column `record_type` on table `tbl_medical_record_type` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_deleted` on table `tbl_pet_breed` required. This step will fail if there are existing NULL values in that column.
  - Made the column `service_name` on table `tbl_service` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_deleted` on table `tbl_veterinarian` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `tbl_admin` MODIFY `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbl_appointment` MODIFY `scheduled_date` DATE NOT NULL,
    MODIFY `scheduled_time` TIME(0) NOT NULL,
    MODIFY `status` ENUM('Pending', 'Incoming', 'Completed', 'Missed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    MODIFY `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `last_updated` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbl_medical_record_file` MODIFY `uploaded_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbl_medical_record_type` MODIFY `record_type` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `tbl_pet_breed` MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbl_service` MODIFY `service_name` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `tbl_veterinarian` MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `tbl_activity_log_tbl_account_FK` ON `tbl_activity_log`(`account_id`);

-- CreateIndex
CREATE UNIQUE INDEX `tbl_admin_account_id_key` ON `tbl_admin`(`account_id`);

-- CreateIndex
CREATE INDEX `tbl_pet_tbl_pet_owner_FK` ON `tbl_pet`(`owner_id`);

-- CreateIndex
CREATE UNIQUE INDEX `tbl_pet_owner_account_id_key` ON `tbl_pet_owner`(`account_id`);

-- CreateIndex
CREATE UNIQUE INDEX `tbl_veterinarian_account_id_key` ON `tbl_veterinarian`(`account_id`);

-- AddForeignKey
ALTER TABLE `tbl_activity_log` ADD CONSTRAINT `tbl_activity_log_tbl_account_FK` FOREIGN KEY (`account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_pet` ADD CONSTRAINT `tbl_pet_tbl_pet_owner_FK` FOREIGN KEY (`owner_id`) REFERENCES `tbl_pet_owner`(`owner_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
