-- Step 1: Convert to VARCHAR to allow intermediate values
ALTER TABLE `schedule` MODIFY `dayOfWeek` VARCHAR(64) NOT NULL;

-- Step 2: Translate existing English values to Bulgarian
UPDATE `schedule` SET `dayOfWeek` = 'ПОНЕДЕЛНИК' WHERE `dayOfWeek` = 'MONDAY';
UPDATE `schedule` SET `dayOfWeek` = 'ВТОРНИК' WHERE `dayOfWeek` = 'TUESDAY';
UPDATE `schedule` SET `dayOfWeek` = 'СРЯДА' WHERE `dayOfWeek` = 'WEDNESDAY';
UPDATE `schedule` SET `dayOfWeek` = 'ЧЕТВЪРТЪК' WHERE `dayOfWeek` = 'THURSDAY';
UPDATE `schedule` SET `dayOfWeek` = 'ПЕТЪК' WHERE `dayOfWeek` = 'FRIDAY';

-- Step 3: Apply new ENUM type
ALTER TABLE `schedule` MODIFY `dayOfWeek` ENUM('ПОНЕДЕЛНИК', 'ВТОРНИК', 'СРЯДА', 'ЧЕТВЪРТЪК', 'ПЕТЪК') NOT NULL;
