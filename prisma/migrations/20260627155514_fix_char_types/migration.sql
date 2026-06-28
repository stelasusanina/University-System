/*
  Warnings:

  - You are about to alter the column `staffNumber` on the `academicstaff` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Char(10)`.
  - You are about to alter the column `phone` on the `academicstaff` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Char(10)`.
  - You are about to alter the column `code` on the `course` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Char(3)`.
  - You are about to alter the column `code` on the `faculty` table. The data in that column could be lost. The data in that column will be cast from `VarChar(10)` to `Char(3)`.
  - You are about to alter the column `code` on the `specialty` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Char(3)`.
  - You are about to alter the column `facultyNumber` on the `student` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Char(10)`.
  - You are about to alter the column `phone` on the `student` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Char(10)`.

*/
-- AlterTable
ALTER TABLE `academicstaff` MODIFY `staffNumber` CHAR(10) NOT NULL,
    MODIFY `phone` CHAR(10) NULL;

-- AlterTable
ALTER TABLE `course` MODIFY `code` CHAR(3) NOT NULL;

-- AlterTable
ALTER TABLE `faculty` MODIFY `code` CHAR(3) NOT NULL;

-- AlterTable
ALTER TABLE `specialty` MODIFY `code` CHAR(3) NOT NULL;

-- AlterTable
ALTER TABLE `student` MODIFY `facultyNumber` CHAR(10) NOT NULL,
    MODIFY `phone` CHAR(10) NULL;
