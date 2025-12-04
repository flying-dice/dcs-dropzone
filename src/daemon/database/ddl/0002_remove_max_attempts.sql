-- Remove max_attempts column from DOWNLOAD_QUEUE
ALTER TABLE `DOWNLOAD_QUEUE` DROP COLUMN `max_attempts`;

-- Remove max_attempts column from EXTRACT_QUEUE
ALTER TABLE `EXTRACT_QUEUE` DROP COLUMN `max_attempts`;
