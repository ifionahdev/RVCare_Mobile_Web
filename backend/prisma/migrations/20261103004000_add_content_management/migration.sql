ALTER TABLE `tbl_pet_care_tip`
    ADD COLUMN `short_description` VARCHAR(180) NULL,
    ADD COLUMN `detailed_content` VARCHAR(500) NULL,
    ADD COLUMN `icon_id` INTEGER NULL,
    ADD COLUMN `publication_status_id` INTEGER NULL,
    ADD COLUMN `content_category_id` INTEGER NULL;

CREATE TABLE `tbl_pet_care_category` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(80) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    UNIQUE INDEX `tbl_pet_care_category_name`(`category_name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tbl_pet_care_icon` (
    `icon_id` INTEGER NOT NULL AUTO_INCREMENT,
    `icon_name` VARCHAR(50) NOT NULL,
    `icon_key` VARCHAR(50) NOT NULL,
    UNIQUE INDEX `tbl_pet_care_icon_name`(`icon_name`),
    PRIMARY KEY (`icon_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tbl_publication_status` (
    `status_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status_name` VARCHAR(30) NOT NULL,
    UNIQUE INDEX `tbl_publication_status_name`(`status_name`),
    PRIMARY KEY (`status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tbl_video_category` (
    `video_category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(80) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    UNIQUE INDEX `tbl_video_category_name`(`category_name`),
    PRIMARY KEY (`video_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tbl_content_video` (
    `video_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(120) NOT NULL,
    `video_url` VARCHAR(500) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `publication_status_id` INTEGER NOT NULL,
    `uploader_account_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    INDEX `tbl_content_video_category_id_fkey`(`category_id`),
    INDEX `tbl_content_video_publication_status_id_fkey`(`publication_status_id`),
    INDEX `tbl_content_video_uploader_account_id_fkey`(`uploader_account_id`),
    PRIMARY KEY (`video_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tbl_pet_care_tip`
    ADD CONSTRAINT `tbl_pet_care_tip_icon_fkey`
        FOREIGN KEY (`icon_id`) REFERENCES `tbl_pet_care_icon`(`icon_id`) ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT `tbl_pet_care_tip_status_fkey`
        FOREIGN KEY (`publication_status_id`) REFERENCES `tbl_publication_status`(`status_id`) ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT `tbl_pet_care_tip_category_fkey`
        FOREIGN KEY (`content_category_id`) REFERENCES `tbl_pet_care_category`(`category_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `tbl_content_video`
    ADD CONSTRAINT `tbl_content_video_category_fkey`
        FOREIGN KEY (`category_id`) REFERENCES `tbl_video_category`(`video_category_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `tbl_content_video_status_fkey`
        FOREIGN KEY (`publication_status_id`) REFERENCES `tbl_publication_status`(`status_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `tbl_content_video_uploader_fkey`
        FOREIGN KEY (`uploader_account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
