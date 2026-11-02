ALTER TABLE `tbl_account`
    ADD COLUMN `email` VARCHAR(255) NULL,
    ADD COLUMN `gender` ENUM('Male', 'Female') NULL,
    ADD COLUMN `date_of_birth` DATE NULL;

UPDATE `tbl_account`
SET `email` = CONCAT('account-', `account_id`, '@raphacare.local')
WHERE `email` IS NULL;

ALTER TABLE `tbl_account`
    MODIFY COLUMN `email` VARCHAR(255) NOT NULL,
    ADD UNIQUE INDEX `tbl_account_email`(`email`);

ALTER TABLE `tbl_pet`
    ADD COLUMN `date_of_birth` DATE NULL,
    ADD COLUMN `weight_kg` DECIMAL(5, 2) NULL,
    ADD COLUMN `color` VARCHAR(100) NULL,
    ADD COLUMN `note` VARCHAR(500) NULL;

UPDATE `tbl_pet`
SET `date_of_birth` = DATE('1970-01-01')
WHERE `date_of_birth` IS NULL;

ALTER TABLE `tbl_pet`
    MODIFY COLUMN `date_of_birth` DATE NOT NULL;
