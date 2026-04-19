ALTER TABLE `MOD_RELEASES` ADD COLUMN `mods_dir` text;
--> statement-breakpoint
UPDATE `MOD_RELEASES` SET `mods_dir` = (SELECT json_extract(`value`, '$') FROM `KEY_VALUE` WHERE `key` = 'dropzone_mods_dir') WHERE `mods_dir` IS NULL;
