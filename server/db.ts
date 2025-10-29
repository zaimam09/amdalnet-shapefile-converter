import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, polygons, InsertProject, InsertPolygon } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Project queries
export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project);
  return result;
}

export async function updateProject(projectId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(data).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all polygons first
  await db.delete(polygons).where(eq(polygons.projectId, projectId));
  // Then delete project
  await db.delete(projects).where(eq(projects.id, projectId));
}

// Polygon queries
export async function getProjectPolygons(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(polygons).where(eq(polygons.projectId, projectId)).orderBy(polygons.objectId);
}

export async function createPolygon(polygon: InsertPolygon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(polygons).values(polygon);
  return result;
}

export async function updatePolygon(polygonId: number, data: Partial<InsertPolygon>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(polygons).set(data).where(eq(polygons.id, polygonId));
}

export async function deletePolygon(polygonId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(polygons).where(eq(polygons.id, polygonId));
}

export async function getNextObjectId(projectId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  
  const result = await db.select({ maxId: polygons.objectId })
    .from(polygons)
    .where(eq(polygons.projectId, projectId))
    .orderBy(desc(polygons.objectId))
    .limit(1);
  
  return result.length > 0 ? (result[0].maxId || 0) + 1 : 1;
}
