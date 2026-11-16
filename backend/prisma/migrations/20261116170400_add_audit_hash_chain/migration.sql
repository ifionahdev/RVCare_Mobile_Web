ALTER TABLE `tbl_audit_log`
    ADD COLUMN `previous_hash` CHAR(64) NULL AFTER `new_value`;

