-- CreateTable
CREATE TABLE `tbl_account` (
    `account_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `date_registered` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `tbl_account_username`(`username`),
    INDEX `tbl_account_tbl_role_FK`(`role_id`),
    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_activity_log` (
    `activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `source` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_admin` (
    `admin_id` INTEGER NOT NULL,
    `account_id` INTEGER NOT NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,

    INDEX `tbl_admin_tbl_account_FK`(`account_id`),
    PRIMARY KEY (`admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_appointment` (
    `appointment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `pet_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `scheduled_date` DATE NULL,
    `scheduled_time` TIME(0) NULL,
    `status` ENUM('Pending', 'Incoming', 'Completed', 'Missed', 'Cancelled') NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_updated` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NULL DEFAULT false,

    INDEX `tbl_appointment_tbl_pet_FK`(`pet_id`),
    INDEX `tbl_appointment_tbl_service_FK`(`service_id`),
    PRIMARY KEY (`appointment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_audit_log` (
    `audit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` ENUM('Created', 'Updated', 'Deleted') NOT NULL,
    `target_table` VARCHAR(100) NOT NULL,
    `target_id` INTEGER NOT NULL,
    `old_value` LONGTEXT NULL,
    `new_value` LONGTEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`audit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_medical_record` (
    `record_id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `record_type_id` INTEGER NOT NULL,

    INDEX `tbl_medical_record_tbl_medical_record_type_FK`(`record_type_id`),
    INDEX `tbl_medical_record_tbl_visit_FK`(`visit_id`),
    PRIMARY KEY (`record_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_medical_record_file` (
    `record_file_id` INTEGER NOT NULL AUTO_INCREMENT,
    `record_id` INTEGER NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `storage_key` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size_bytes` INTEGER NOT NULL,
    `checksum` CHAR(64) NOT NULL,
    `uploader_account_id` INTEGER NOT NULL,
    `uploaded_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NULL DEFAULT false,

    INDEX `tbl_medical_record_file_tbl_account_FK`(`uploader_account_id`),
    INDEX `tbl_medical_record_file_tbl_medical_record_FK`(`record_id`),
    PRIMARY KEY (`record_file_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_medical_record_type` (
    `record_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `record_type` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `tbl_medical_record_type_unique`(`record_type`),
    PRIMARY KEY (`record_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_pet` (
    `pet_id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` INTEGER NOT NULL,
    `pet_name` VARCHAR(100) NOT NULL,
    `breed_id` INTEGER NOT NULL,
    `gender` ENUM('Male', 'Female') NOT NULL,
    `date_registered` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_pet_tbl_pet_breed_FK`(`breed_id`),
    PRIMARY KEY (`pet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_pet_breed` (
    `breed_id` INTEGER NOT NULL AUTO_INCREMENT,
    `species` ENUM('Cat', 'Dog') NOT NULL,
    `breed_name` VARCHAR(100) NOT NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`breed_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_pet_owner` (
    `owner_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `address` VARCHAR(100) NULL,
    `contact_number` VARCHAR(11) NULL,
    `alternate_contact` VARCHAR(100) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_pet_owner_tbl_account_FK`(`account_id`),
    PRIMARY KEY (`owner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_role` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_slug` VARCHAR(50) NOT NULL,
    `role_name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `tbl_role_slug`(`role_slug`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_service` (
    `service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_name` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,

    PRIMARY KEY (`service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_veterinarian` (
    `vet_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,

    INDEX `tbl_veterinarian_tbl_account_FK`(`account_id`),
    PRIMARY KEY (`vet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_visit` (
    `visit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NULL,
    `pet_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `visit_date` DATE NOT NULL DEFAULT (curdate()),
    `visit_time` TIME(0) NOT NULL DEFAULT (curtime()),
    `status` ENUM('Checked-in', 'Ongoing', 'Completed') NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,

    INDEX `tbl_visit_tbl_appointment_FK`(`appointment_id`),
    INDEX `tbl_visit_tbl_pet_FK`(`pet_id`),
    INDEX `tbl_visit_tbl_service_FK`(`service_id`),
    PRIMARY KEY (`visit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_password_reset` (
    `reset_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `used_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `platform` VARCHAR(10) NOT NULL DEFAULT 'web',
    `attempt_count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `token_hash`(`token_hash`),
    INDEX `idx_password_reset_account`(`account_id`),
    PRIMARY KEY (`reset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tbl_account` ADD CONSTRAINT `tbl_account_tbl_role_FK` FOREIGN KEY (`role_id`) REFERENCES `tbl_role`(`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_admin` ADD CONSTRAINT `tbl_admin_tbl_account_FK` FOREIGN KEY (`account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_appointment` ADD CONSTRAINT `tbl_appointment_tbl_pet_FK` FOREIGN KEY (`pet_id`) REFERENCES `tbl_pet`(`pet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_appointment` ADD CONSTRAINT `tbl_appointment_tbl_service_FK` FOREIGN KEY (`service_id`) REFERENCES `tbl_service`(`service_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_medical_record` ADD CONSTRAINT `tbl_medical_record_tbl_medical_record_type_FK` FOREIGN KEY (`record_type_id`) REFERENCES `tbl_medical_record_type`(`record_type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_medical_record` ADD CONSTRAINT `tbl_medical_record_tbl_visit_FK` FOREIGN KEY (`visit_id`) REFERENCES `tbl_visit`(`visit_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_medical_record_file` ADD CONSTRAINT `tbl_medical_record_file_tbl_account_FK` FOREIGN KEY (`uploader_account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_medical_record_file` ADD CONSTRAINT `tbl_medical_record_file_tbl_medical_record_FK` FOREIGN KEY (`record_id`) REFERENCES `tbl_medical_record`(`record_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_pet` ADD CONSTRAINT `tbl_pet_tbl_pet_breed_FK` FOREIGN KEY (`breed_id`) REFERENCES `tbl_pet_breed`(`breed_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_pet_owner` ADD CONSTRAINT `tbl_pet_owner_tbl_account_FK` FOREIGN KEY (`account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_veterinarian` ADD CONSTRAINT `tbl_veterinarian_tbl_account_FK` FOREIGN KEY (`account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_visit` ADD CONSTRAINT `tbl_visit_tbl_appointment_FK` FOREIGN KEY (`appointment_id`) REFERENCES `tbl_appointment`(`appointment_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_visit` ADD CONSTRAINT `tbl_visit_tbl_pet_FK` FOREIGN KEY (`pet_id`) REFERENCES `tbl_pet`(`pet_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_visit` ADD CONSTRAINT `tbl_visit_tbl_service_FK` FOREIGN KEY (`service_id`) REFERENCES `tbl_service`(`service_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_password_reset` ADD CONSTRAINT `tbl_password_reset_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `tbl_account`(`account_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

