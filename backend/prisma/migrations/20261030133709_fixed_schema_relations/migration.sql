/*
  Warnings:

  - A unique constraint covering the columns `[appointment_id]` on the table `tbl_visit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `vet_id` to the `tbl_appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vet_id` to the `tbl_visit` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `tbl_visit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_deleted` on table `tbl_visit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `tbl_appointment` ADD COLUMN `vet_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `tbl_audit_log` ADD COLUMN `account_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `tbl_visit` ADD COLUMN `vet_id` INTEGER NOT NULL,
    MODIFY `status` ENUM('Checked-in', 'Ongoing', 'Completed') NOT NULL DEFAULT 'Checked-in',
    MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `tbl_visit_appointment_id_key` ON `tbl_visit`(`appointment_id`);

-- AddForeignKey
ALTER TABLE `tbl_appointment` ADD CONSTRAINT `tbl_appointment_tbl_veterinarian_FK` FOREIGN KEY (`vet_id`) REFERENCES `tbl_veterinarian`(`vet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_visit` ADD CONSTRAINT `tbl_visit_tbl_veterinarian_FK` FOREIGN KEY (`vet_id`) REFERENCES `tbl_veterinarian`(`vet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
