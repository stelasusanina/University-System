-- Step 1: Convert columns to VARCHAR to allow intermediate values

ALTER TABLE `announcement` MODIFY `type` VARCHAR(64) NOT NULL DEFAULT 'ИНФОРМАЦИЯ';
ALTER TABLE `enrollment` MODIFY `status` VARCHAR(64) NOT NULL DEFAULT 'ЗАПИСАН';
ALTER TABLE `event` MODIFY `type` VARCHAR(64) NOT NULL;
ALTER TABLE `schedule` MODIFY `type` VARCHAR(64) NOT NULL DEFAULT 'ЛЕКЦИЯ';

-- Step 2: Translate existing English values to Bulgarian

UPDATE `announcement` SET `type` = 'ИНФОРМАЦИЯ' WHERE `type` = 'INFO';
UPDATE `announcement` SET `type` = 'ОТМЯНА' WHERE `type` = 'CANCELLATION';
UPDATE `announcement` SET `type` = 'ЗАКЪСНЕНИЕ' WHERE `type` = 'DELAY';
UPDATE `announcement` SET `type` = 'СМЯНА_НА_ЗАЛА' WHERE `type` = 'ROOM_CHANGE';
UPDATE `announcement` SET `type` = 'СПЕШНО' WHERE `type` = 'URGENT';

UPDATE `enrollment` SET `status` = 'ЗАПИСАН' WHERE `status` = 'ENROLLED';
UPDATE `enrollment` SET `status` = 'ПОЛОЖЕН' WHERE `status` = 'PASSED';
UPDATE `enrollment` SET `status` = 'НЕПОЛОЖЕН' WHERE `status` = 'FAILED';
UPDATE `enrollment` SET `status` = 'ОТПИСАН' WHERE `status` = 'WITHDRAWN';

UPDATE `event` SET `type` = 'КОНТРОЛНА' WHERE `type` = 'TEST';
UPDATE `event` SET `type` = 'ИЗПИТ' WHERE `type` = 'EXAM';
UPDATE `event` SET `type` = 'ЗАДАНИЕ' WHERE `type` = 'ASSIGNMENT';
UPDATE `event` SET `type` = 'ЗАЩИТА_НА_ПРОЕКТ' WHERE `type` = 'PROJECT_DEFENSE';
UPDATE `event` SET `type` = 'ДРУГО' WHERE `type` = 'OTHER';

UPDATE `schedule` SET `type` = 'ЛЕКЦИЯ' WHERE `type` = 'LECTURE';
UPDATE `schedule` SET `type` = 'СЕМИНАРНО_УПРАЖНЕНИЕ' WHERE `type` = 'SEMINAR_EXERCISE';
UPDATE `schedule` SET `type` = 'ЛАБОРАТОРНО_УПРАЖНЕНИЕ' WHERE `type` = 'LAB_EXERCISE';

-- Step 3: Apply new ENUM types

ALTER TABLE `announcement` MODIFY `type` ENUM('ИНФОРМАЦИЯ', 'ОТМЯНА', 'ЗАКЪСНЕНИЕ', 'СМЯНА_НА_ЗАЛА', 'СПЕШНО') NOT NULL DEFAULT 'ИНФОРМАЦИЯ';
ALTER TABLE `enrollment` MODIFY `status` ENUM('ЗАПИСАН', 'ПОЛОЖЕН', 'НЕПОЛОЖЕН', 'ОТПИСАН') NOT NULL DEFAULT 'ЗАПИСАН';
ALTER TABLE `event` MODIFY `type` ENUM('КОНТРОЛНА', 'ИЗПИТ', 'ЗАДАНИЕ', 'ЗАЩИТА_НА_ПРОЕКТ', 'ДРУГО') NOT NULL;
ALTER TABLE `schedule` MODIFY `type` ENUM('ЛЕКЦИЯ', 'СЕМИНАРНО_УПРАЖНЕНИЕ', 'ЛАБОРАТОРНО_УПРАЖНЕНИЕ') NOT NULL DEFAULT 'ЛЕКЦИЯ';

