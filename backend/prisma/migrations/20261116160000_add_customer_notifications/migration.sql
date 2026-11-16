CREATE TABLE `tbl_notification` (
  `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
  `account_id` INTEGER NOT NULL,
  `category` VARCHAR(30) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `related_type` VARCHAR(30) NULL,
  `related_id` INTEGER NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `read_at` DATETIME(0) NULL,
  INDEX `tbl_notification_account_created` (`account_id`, `created_at`),
  PRIMARY KEY (`notification_id`),
  CONSTRAINT `tbl_notification_tbl_account_FK`
    FOREIGN KEY (`account_id`) REFERENCES `tbl_account` (`account_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
