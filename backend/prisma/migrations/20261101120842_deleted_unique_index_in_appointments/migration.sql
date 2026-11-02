-- DropForeignKey
ALTER TABLE `tbl_appointment` DROP FOREIGN KEY `tbl_appointment_tbl_veterinarian_FK`;

-- DropIndex
DROP INDEX `tbl_appointment_unique` ON `tbl_appointment`;

-- CreateIndex
CREATE INDEX `tbl_appointment_index_booked` ON `tbl_appointment`(`vet_id`, `scheduled_date`, `timeslot_id`);

-- AddForeignKey
ALTER TABLE `tbl_appointment` ADD CONSTRAINT `tbl_appointment_tbl_veterinarian_FK` FOREIGN KEY (`vet_id`) REFERENCES `tbl_veterinarian`(`vet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;