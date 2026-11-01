-- CreateTable
CREATE TABLE `tbl_pet_care_tip` (
    `tip_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('Article', 'Video') NOT NULL,
    `category` ENUM('Health', 'Nutrition', 'Grooming', 'Training', 'Behavior', 'Safety', 'Travel', 'Adoption', 'Miscellaneous') NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` VARCHAR(1000) NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `link_url` VARCHAR(255) NOT NULL,
    `uploader_account_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`tip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tbl_pet_care_tip` ADD CONSTRAINT `tbl_pet_care_tips_tbl_account_FK` FOREIGN KEY (`uploader_account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
