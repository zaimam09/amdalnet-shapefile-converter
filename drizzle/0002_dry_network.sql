ALTER TABLE `polygons` MODIFY COLUMN `area` varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE `polygons` ADD `nib` varchar(50);--> statement-breakpoint
ALTER TABLE `polygons` ADD `kbli` varchar(50);--> statement-breakpoint
ALTER TABLE `polygons` ADD `kabupatenKota` varchar(100);--> statement-breakpoint
ALTER TABLE `polygons` ADD `kecamatan` varchar(100);--> statement-breakpoint
ALTER TABLE `polygons` ADD `desaKelurahan` varchar(100);--> statement-breakpoint
ALTER TABLE `polygons` ADD `alamat` text;