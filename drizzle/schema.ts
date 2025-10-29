import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - stores AMDALNET shapefile projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coordinateSystem: varchar("coordinateSystem", { length: 50 }).notNull().default("EPSG:4326"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Polygons table - stores tapak proyek polygons with AMDALNET attributes
 */
export const polygons = mysqlTable("polygons", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  
  // AMDALNET required attributes
  objectId: int("objectId").notNull(), // OBJECTID_1
  pemrakarsa: varchar("pemrakarsa", { length: 100 }).notNull(),
  kegiatan: varchar("kegiatan", { length: 254 }).notNull(),
  tahun: int("tahun").notNull(),
  provinsi: varchar("provinsi", { length: 50 }).notNull(),
  keterangan: varchar("keterangan", { length: 254 }).notNull(),
  layer: varchar("layer", { length: 50 }).notNull().default("Tapak Proyek"),
  area: text("area").notNull(), // Store as text to preserve precision (19,11)
  
  // GeoJSON geometry stored as text
  geometry: text("geometry").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Polygon = typeof polygons.$inferSelect;
export type InsertPolygon = typeof polygons.$inferInsert;
