INSERT INTO `tbl_visit` (
    `appointment_id`,
    `vet_id`,
    `pet_id`,
    `service_id`,
    `visit_type`,
    `visit_date`,
    `visit_time`,
    `status`,
    `is_deleted`
)
SELECT
    appointment.`appointment_id`,
    appointment.`vet_id`,
    appointment.`pet_id`,
    appointment.`service_id`,
    'Appointment',
    appointment.`scheduled_date`,
    STR_TO_DATE(
        CONCAT(DATE_FORMAT(appointment.`scheduled_date`, '%Y-%m-%d'), ' ', timeslot.`start_time`, ':00'),
        '%Y-%m-%d %H:%i:%s'
    ),
    'Completed',
    false
FROM `tbl_appointment` AS appointment
JOIN `tbl_timeslot` AS timeslot ON timeslot.`timeslot_id` = appointment.`timeslot_id`
WHERE (
    EXISTS (
        SELECT 1
        FROM `tbl_medical_history` AS history
        WHERE history.`appointment_id` = appointment.`appointment_id`
    )
    OR EXISTS (
        SELECT 1
        FROM `tbl_lab_result` AS lab_result
        WHERE lab_result.`appointment_id` = appointment.`appointment_id`
    )
)
AND NOT EXISTS (
    SELECT 1
    FROM `tbl_visit` AS visit
    WHERE visit.`appointment_id` = appointment.`appointment_id`
);

UPDATE `tbl_medical_history` AS history
JOIN `tbl_visit` AS visit ON visit.`appointment_id` = history.`appointment_id`
SET history.`visit_id` = visit.`visit_id`
WHERE history.`appointment_id` IS NOT NULL;

UPDATE `tbl_lab_result` AS lab_result
JOIN `tbl_visit` AS visit ON visit.`appointment_id` = lab_result.`appointment_id`
SET lab_result.`visit_id` = visit.`visit_id`
WHERE lab_result.`appointment_id` IS NOT NULL;

ALTER TABLE `tbl_medical_history`
    DROP FOREIGN KEY `tbl_medical_history_tbl_appointment_FK`,
    DROP INDEX `tbl_medical_history_appointment_id_key`,
    DROP COLUMN `appointment_id`,
    MODIFY `visit_id` INTEGER NOT NULL;

ALTER TABLE `tbl_lab_result`
    DROP FOREIGN KEY `tbl_lab_result_tbl_appointment_FK`,
    DROP INDEX `tbl_lab_result_tbl_appointment_FK`,
    DROP COLUMN `appointment_id`,
    MODIFY `visit_id` INTEGER NOT NULL;
