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
        pemrakarsa: z.string(),
        kegiatan: z.string(),
        tahun: z.number(),
        provinsi: z.string(),
        keterangan: z.string(),
        layer: z.string().default("Tapak Proyek"),
        area: z.string(),
        geometry: z.string(), // GeoJSON string
        nib: z.string().optional(),
        kbli: z.string().optional(),
        kabupatenKota: z.string().optional(),
        kecamatan: z.string().optional(),
        desaKelurahan: z.string().optional(),
        alamat: z.string().optional(),
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
      .mutation(async ({ input, ctx }) => {
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
          userName: ctx.user.name || 'User',
          userEmail: ctx.user.email || '',
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

  document: router({
    analyze: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded PDF
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { fileData, fileName } = input;
        
        try {          
          // Use LLM to analyze the document
          const { invokeLLM } = await import('./_core/llm');
          
          const prompt = `Analisis dokumen PKKPR atau NIB berikut dan ekstrak informasi dalam format JSON.\n\nInformasi yang harus diekstrak:\n- pemrakarsa: Nama Pelaku Usaha/Pemrakarsa (cari di bagian "Nama Pelaku Usaha" atau "Pemrakarsa")\n- nib: Nomor Induk Berusaha 13 digit (cari angka 13 digit yang biasanya ada label "NIB" atau "Nomor Induk Berusaha", PENTING: harus 13 digit angka)\n- kbli: Kode KBLI 5 digit (cari kode yang ada label "KBLI" atau "Kode KBLI")\n- kegiatan: Nama/Judul kegiatan atau deskripsi KBLI\n- provinsi: Nama Provinsi (cari di bagian lokasi/alamat)\n- kabupatenKota: Nama Kabupaten/Kota (cari di bagian lokasi/alamat)\n- kecamatan: Nama Kecamatan (cari di bagian lokasi/alamat)\n- desaKelurahan: Nama Desa/Kelurahan (cari di bagian lokasi/alamat)\n- alamat: Alamat lengkap termasuk jalan, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi\n- luasTanah: Luas tanah dalam m2 atau ha (cari di bagian luas lahan/tanah)\n- tahun: Tahun dari tanggal dokumen (ambil tahun dari tanggal terbit dokumen)\n\nPenting:\n- Jika tidak ada data, isi dengan string kosong \"\"\n- NIB HARUS 13 digit angka, jika tidak ketemu atau bukan 13 digit, isi kosong\n- Untuk alamat, gabungkan semua komponen alamat menjadi satu string lengkap\n- Perhatikan dengan teliti setiap angka dan kode yang ada di dokumen\n\nDokumen: ${fileName}`;

          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Anda adalah asisten yang ahli dalam mengekstrak data dari dokumen PKKPR dan NIB. Berikan output dalam format JSON yang valid.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: prompt },
                  { 
                    type: 'file_url', 
                    file_url: { 
                      url: `data:application/pdf;base64,${fileData}`,
                      mime_type: 'application/pdf'
                    } 
                  }
                ]
              }
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'document_extraction',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    pemrakarsa: { type: 'string' },
                    nib: { type: 'string' },
                    kbli: { type: 'string' },
                    kegiatan: { type: 'string' },
                    provinsi: { type: 'string' },
                    kabupatenKota: { type: 'string' },
                    kecamatan: { type: 'string' },
                    desaKelurahan: { type: 'string' },
                    alamat: { type: 'string' },
                    luasTanah: { type: 'string' },
                    tahun: { type: 'number' },
                  },
                  required: ['pemrakarsa', 'kegiatan', 'provinsi', 'tahun'],
                  additionalProperties: false,
                },
              },
            },
          });

          const messageContent = response.choices[0].message.content;
          const contentText = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
          const extractedData = JSON.parse(contentText || '{}');
          
          // Generate KETERANGAN based on location data (alamat lengkap)
          let keterangan = '';
          if (extractedData.alamat) {
            // Use full address as KETERANGAN
            keterangan = extractedData.alamat;
          } else {
            // Build address from components
            const addressParts = [];
            if (extractedData.desaKelurahan) addressParts.push(`Desa/Kel. ${extractedData.desaKelurahan}`);
            if (extractedData.kecamatan) addressParts.push(`Kec. ${extractedData.kecamatan}`);
            if (extractedData.kabupatenKota) addressParts.push(extractedData.kabupatenKota);
            if (extractedData.provinsi) addressParts.push(extractedData.provinsi);
            
            if (addressParts.length > 0) {
              keterangan = addressParts.join(', ');
            } else {
              keterangan = 'Alamat belum tersedia';
            }
          }
          
          return {
            pemrakarsa: extractedData.pemrakarsa || '',
            kegiatan: extractedData.kegiatan || '',
            tahun: extractedData.tahun || new Date().getFullYear(),
            provinsi: extractedData.provinsi || '',
            keterangan,
            nib: extractedData.nib || '',
            kbli: extractedData.kbli || '',
            kabupatenKota: extractedData.kabupatenKota || '',
            kecamatan: extractedData.kecamatan || '',
            desaKelurahan: extractedData.desaKelurahan || '',
            alamat: extractedData.alamat || '',
            luasTanah: extractedData.luasTanah || '',
          };
        } catch (error) {
          console.error('Error analyzing document:', error);
          throw new Error('Gagal menganalisis dokumen. Pastikan file PDF valid.');
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
