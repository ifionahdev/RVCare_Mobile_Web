ALTER TABLE `tbl_medical_history`
    ADD COLUMN `status` ENUM('Draft', 'Completed') NOT NULL DEFAULT 'Draft';

ALTER TABLE `tbl_lab_result`
    ADD COLUMN `status` ENUM('Pending', 'Final') NOT NULL DEFAULT 'Pending';

UPDATE `tbl_lab_result` AS lab_result
SET `status` = 'Final'
WHERE EXISTS (
    SELECT 1
    FROM `tbl_lab_result_value` AS result_value
    JOIN `tbl_lab_test_parameter` AS parameter
        ON parameter.`parameter_id` = result_value.`parameter_id`
    WHERE result_value.`lab_result_id` = lab_result.`lab_result_id`
      AND result_value.`is_deleted` = false
      AND parameter.`is_deleted` = false
);
