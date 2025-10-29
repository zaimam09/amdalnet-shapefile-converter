CREATE TABLE `polygons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`objectId` int NOT NULL,
	`pemrakarsa` varchar(100) NOT NULL,
	`kegiatan` varchar(254) NOT NULL,
	`tahun` int NOT NULL,
	`provinsi` varchar(50) NOT NULL,
	`keterangan` varchar(254) NOT NULL,
	`layer` varchar(50) NOT NULL DEFAULT 'Tapak Proyek',
	`area` text NOT NULL,
	`geometry` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `polygons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`coordinateSystem` varchar(50) NOT NULL DEFAULT 'EPSG:4326',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
