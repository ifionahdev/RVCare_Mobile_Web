/*
  Warnings:

  - You are about to drop the column `scheduled_time` on the `tbl_appointment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vet_id,scheduled_date,timeslot_id]` on the table `tbl_appointment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timeslot_id` to the `tbl_appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tbl_appointment` DROP COLUMN `scheduled_time`,
    ADD COLUMN `timeslot_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `tbl_timeslot` (
    `timeslot_id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_time` VARCHAR(5) NOT NULL,
    `end_time` VARCHAR(5) NOT NULL,
    `display` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`timeslot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `tbl_appointment_unique` ON `tbl_appointment`(`vet_id`, `scheduled_date`, `timeslot_id`);

-- AddForeignKey
ALTER TABLE `tbl_appointment` ADD CONSTRAINT `tbl_appointment_tbl_timeslot_FK` FOREIGN KEY (`timeslot_id`) REFERENCES `tbl_timeslot`(`timeslot_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
