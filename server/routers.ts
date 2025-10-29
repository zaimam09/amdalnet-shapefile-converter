import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import shpwrite from "@mapbox/shp-write";
import JSZip from "jszip";
import { generateMapPDF } from "./pdfGenerator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProjects(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        coordinateSystem: z.string().default("EPSG:4326"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          coordinateSystem: input.coordinateSystem,
        });
        return { success: true, insertId: Number((result as any).insertId) };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        coordinateSystem: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  polygons: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectPolygons(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        pemrakarsa: z.string().max(100),
        kegiatan: z.string().max(254),
        tahun: z.number().int().min(1900).max(2100),
        provinsi: z.string().max(50),
        keterangan: z.string().max(254),
        layer: z.string().max(50).default("Tapak Proyek"),
        area: z.string(),
        geometry: z.string(),
      }))
      .mutation(async ({ input }) => {
        const objectId = await db.getNextObjectId(input.projectId);
        const result = await db.createPolygon({
          ...input,
          objectId,
        });
        return { success: true, insertId: Number((result as any).insertId), objectId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        pemrakarsa: z.string().max(100).optional(),
        kegiatan: z.string().max(254).optional(),
        tahun: z.number().int().min(1900).max(2100).optional(),
        provinsi: z.string().max(50).optional(),
        keterangan: z.string().max(254).optional(),
        layer: z.string().max(50).optional(),
        area: z.string().optional(),
        geometry: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePolygon(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePolygon(input.id);
        return { success: true };
      }),
  }),

  export: router({
    pdf: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        polygonId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const polygonData = await db.getProjectPolygons(input.projectId);
        const polygon = polygonData.find(p => p.id === input.polygonId);
        
        if (!polygon) {
          throw new Error("Polygon not found");
        }

        // Generate PDF
        const pdfBuffer = await generateMapPDF({
          projectName: project.name,
          polygon,
          coordinateSystem: project.coordinateSystem,
        });
        
        // Convert to base64 for transmission
        const base64 = pdfBuffer.toString('base64');
        
        return {
          success: true,
          filename: `${project.name}_Peta_Tapak_Proyek.pdf`,
          data: base64,
        };
      }),

    shapefile: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const polygonData = await db.getProjectPolygons(input.projectId);
        if (polygonData.length === 0) {
          throw new Error("No polygons to export");
        }

        // Convert to GeoJSON format for shp-write
        const features = polygonData.map(p => ({
          type: "Feature" as const,
          geometry: JSON.parse(p.geometry),
          properties: {
            OBJECTID_1: p.objectId,
            PEMRAKARSA: p.pemrakarsa,
            KEGIATAN: p.kegiatan,
            TAHUN: p.tahun,
            PROVINSI: p.provinsi,
            KETERANGAN: p.keterangan,
            LAYER: p.layer,
            AREA: parseFloat(p.area),
          },
        }));

        const geojson = {
          type: "FeatureCollection" as const,
          features,
        };

        // Generate shapefile using shp-write
        const zipData = await shpwrite.zip<'arraybuffer'>(geojson, {
          folder: "Tapak_proyek",
          types: {
            polygon: "Tapak_proyek",
          },
          compression: "DEFLATE",
          outputType: "arraybuffer",
        });
        
        // Convert to buffer and base64
        const buffer = Buffer.from(zipData);
        const base64 = buffer.toString('base64');
        
        return {
          success: true,
          filename: `${project.name}_Tapak_proyek.zip`,
          data: base64,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
