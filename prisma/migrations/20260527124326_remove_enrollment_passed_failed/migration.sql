-- Step 1: Convert to VARCHAR to allow intermediate updates
ALTER TABLE `enrollment` MODIFY `status` VARCHAR(64) NOT NULL DEFAULT 'ЗАПИСАН';

-- Step 2: Move existing ПОЛОЖЕН/НЕПОЛОЖЕН rows to ЗАПИСАН
UPDATE `enrollment` SET `status` = 'ЗАПИСАН' WHERE `status` IN ('ПОЛОЖЕН', 'НЕПОЛОЖЕН');

-- Step 3: Apply reduced ENUM type
ALTER TABLE `enrollment` MODIFY `status` ENUM('ЗАПИСАН', 'ОТПИСАН') NOT NULL DEFAULT 'ЗАПИСАН';
