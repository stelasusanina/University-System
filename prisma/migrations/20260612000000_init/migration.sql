-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(200) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ПРОФЕСОР', 'ДОЦЕНТ', 'ГЛАВЕН_АСИСТЕНТ', 'АСИСТЕНТ', 'СТУДЕНТ') NOT NULL,
    `studentId` INTEGER NULL,
    `academicStaffId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_studentId_key`(`studentId`),
    UNIQUE INDEX `User_academicStaffId_key`(`academicStaffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(200) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PushToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faculty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `Faculty_name_key`(`name`),
    UNIQUE INDEX `Faculty_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Specialty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `degree` ENUM('БАКАЛАВЪР', 'МАГИСТЪР', 'ДОКТОРАНТ') NOT NULL DEFAULT 'БАКАЛАВЪР',
    `years` INTEGER NOT NULL DEFAULT 4,
    `facultyId` INTEGER NOT NULL,

    UNIQUE INDEX `Specialty_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `studyYear` INTEGER NOT NULL,
    `specialtyId` INTEGER NOT NULL,

    UNIQUE INDEX `Group_number_studyYear_specialtyId_key`(`number`, `studyYear`, `specialtyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facultyNumber` VARCHAR(20) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `groupId` INTEGER NOT NULL,
    `role` ENUM('ПРОФЕСОР', 'ДОЦЕНТ', 'ГЛАВЕН_АСИСТЕНТ', 'АСИСТЕНТ', 'СТУДЕНТ') NOT NULL DEFAULT 'СТУДЕНТ',

    UNIQUE INDEX `Student_facultyNumber_key`(`facultyNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicStaff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffNumber` VARCHAR(20) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('ПРОФЕСОР', 'ДОЦЕНТ', 'ГЛАВЕН_АСИСТЕНТ', 'АСИСТЕНТ', 'СТУДЕНТ') NOT NULL DEFAULT 'АСИСТЕНТ',
    `facultyId` INTEGER NOT NULL,

    UNIQUE INDEX `AcademicStaff_staffNumber_key`(`staffNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `description` TEXT NULL,
    `credits` INTEGER NOT NULL,

    UNIQUE INDEX `Course_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Semester` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `academicYear` VARCHAR(20) NOT NULL,
    `period` ENUM('ЗИМЕН', 'ЛЕТЕН') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `groupId` INTEGER NOT NULL,
    `academicStaffId` INTEGER NOT NULL,
    `semesterNum` INTEGER NOT NULL,
    `semesterId` INTEGER NOT NULL,

    UNIQUE INDEX `CourseGroup_courseId_groupId_semesterId_key`(`courseId`, `groupId`, `semesterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseGroupId` INTEGER NOT NULL,
    `finalGrade` DOUBLE NOT NULL,

    UNIQUE INDEX `Grade_studentId_courseGroupId_key`(`studentId`, `courseGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseGroupId` INTEGER NOT NULL,
    `dayOfWeek` ENUM('ПОНЕДЕЛНИК', 'ВТОРНИК', 'СРЯДА', 'ЧЕТВЪРТЪК', 'ПЕТЪК') NOT NULL,
    `startTime` VARCHAR(5) NOT NULL,
    `endTime` VARCHAR(5) NOT NULL,
    `room` VARCHAR(50) NOT NULL,
    `type` ENUM('ЛЕКЦИЯ', 'СЕМИНАРНО_УПРАЖНЕНИЕ', 'ЛАБОРАТОРНО_УПРАЖНЕНИЕ') NOT NULL DEFAULT 'ЛЕКЦИЯ',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(1000) NOT NULL,
    `fileType` VARCHAR(10) NOT NULL,
    `courseId` INTEGER NOT NULL,
    `academicStaffId` INTEGER NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` TEXT NOT NULL,
    `type` ENUM('ИНФОРМАЦИЯ', 'ОТМЯНА', 'ЗАКЪСНЕНИЕ', 'СМЯНА_НА_ЗАЛА', 'СПЕШНО') NOT NULL DEFAULT 'ИНФОРМАЦИЯ',
    `validTo` DATETIME(3) NOT NULL,
    `academicStaffId` INTEGER NOT NULL,
    `courseGroupId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(300) NOT NULL,
    `type` ENUM('КОНТРОЛНА', 'ИЗПИТ', 'ЗАДАНИЕ', 'ЗАЩИТА_НА_ПРОЕКТ', 'ДРУГО') NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(5) NULL,
    `endTime` VARCHAR(5) NULL,
    `room` VARCHAR(50) NULL,
    `courseGroupId` INTEGER NOT NULL,
    `academicStaffId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Building` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(300) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `googleMapsUrl` VARCHAR(1000) NULL,

    UNIQUE INDEX `Building_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_academicStaffId_fkey` FOREIGN KEY (`academicStaffId`) REFERENCES `AcademicStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushToken` ADD CONSTRAINT `PushToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Specialty` ADD CONSTRAINT `Specialty_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_specialtyId_fkey` FOREIGN KEY (`specialtyId`) REFERENCES `Specialty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicStaff` ADD CONSTRAINT `AcademicStaff_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseGroup` ADD CONSTRAINT `CourseGroup_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseGroup` ADD CONSTRAINT `CourseGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseGroup` ADD CONSTRAINT `CourseGroup_academicStaffId_fkey` FOREIGN KEY (`academicStaffId`) REFERENCES `AcademicStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseGroup` ADD CONSTRAINT `CourseGroup_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grade` ADD CONSTRAINT `Grade_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grade` ADD CONSTRAINT `Grade_courseGroupId_fkey` FOREIGN KEY (`courseGroupId`) REFERENCES `CourseGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_courseGroupId_fkey` FOREIGN KEY (`courseGroupId`) REFERENCES `CourseGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_academicStaffId_fkey` FOREIGN KEY (`academicStaffId`) REFERENCES `AcademicStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_academicStaffId_fkey` FOREIGN KEY (`academicStaffId`) REFERENCES `AcademicStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_courseGroupId_fkey` FOREIGN KEY (`courseGroupId`) REFERENCES `CourseGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_courseGroupId_fkey` FOREIGN KEY (`courseGroupId`) REFERENCES `CourseGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_academicStaffId_fkey` FOREIGN KEY (`academicStaffId`) REFERENCES `AcademicStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
