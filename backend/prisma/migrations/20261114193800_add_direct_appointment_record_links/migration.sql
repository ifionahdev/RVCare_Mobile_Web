ALTER TABLE `tbl_medical_history`
    MODIFY `visit_id` INTEGER NULL,
    ADD COLUMN `appointment_id` INTEGER NULL,
    ADD UNIQUE INDEX `tbl_medical_history_appointment_id_key`(`appointment_id`);

ALTER TABLE `tbl_lab_result`
    MODIFY `visit_id` INTEGER NULL,
    ADD COLUMN `appointment_id` INTEGER NULL,
    ADD INDEX `tbl_lab_result_tbl_appointment_FK`(`appointment_id`);

ALTER TABLE `tbl_medical_history`
    ADD CONSTRAINT `tbl_medical_history_tbl_appointment_FK`
    FOREIGN KEY (`appointment_id`) REFERENCES `tbl_appointment`(`appointment_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tbl_lab_result`
    ADD CONSTRAINT `tbl_lab_result_tbl_appointment_FK`
    FOREIGN KEY (`appointment_id`) REFERENCES `tbl_appointment`(`appointment_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT;
