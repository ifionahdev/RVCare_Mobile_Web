-- AddForeignKey
ALTER TABLE `tbl_audit_log` ADD CONSTRAINT `tbl_audit_log_tbl_account_FK` FOREIGN KEY (`account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE SET NULL ON UPDATE RESTRICT;
