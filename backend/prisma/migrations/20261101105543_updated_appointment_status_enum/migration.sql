/*
  Warnings:

  - The values [Incoming] on the enum `tbl_appointment_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `tbl_appointment` MODIFY `status` ENUM('Pending', 'Upcoming', 'Rejected', 'Completed', 'Missed', 'Cancelled') NOT NULL DEFAULT 'Pending';
