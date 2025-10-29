# AMDALNET Shapefile Converter

Aplikasi web untuk membuat peta tapak proyek sesuai standar AMDALNET Indonesia dengan fitur digitasi polygon, AI ekstraksi dokumen, dan export shapefile/PDF.

## Fitur Utama

### 🗺️ Peta Interaktif
- Basemap Esri World Imagery (citra satelit) dengan overlay label
- Drawing tools untuk digitasi polygon tapak proyek
- Edit dan delete polygon
- Kalkulasi luas otomatis (Hektar dan m²)

### 🤖 AI Ekstraksi Dokumen
- Upload dokumen PKKPR/NIB (PDF)
- Ekstraksi otomatis: Pemrakarsa, NIB, KBLI, Kegiatan, Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan, Alamat
- Auto-generate field KETERANGAN sesuai format AMDALNET

### 📁 Import File Spasial
- Support Shapefile ZIP, KML, GeoJSON
- Auto-load geometry ke peta
- Auto-fill atribut dari file (jika tersedia)

### 📤 Export
- **Shapefile ZIP**: Format standar OSS RDTR dengan 5 file (.shp, .shx, .dbf, .prj, .cpg)
- **PDF A3 Landscape**: Layout profesional dengan elemen kartografi lengkap
  - Peta utama dengan grid koordinat
  - Panel info: title, technical info, legenda, tabel koordinat
  - Peta inset Indonesia
  - Informasi pembuat dan tanggal

### 📋 Form Atribut AMDALNET
- Pemrakarsa, Kegiatan, Tahun, Provinsi
- NIB, KBLI, Kabupaten/Kota, Kecamatan, Desa/Kelurahan
- Alamat Lengkap, Keterangan, Layer
- Validasi sesuai standar AMDALNET

## Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS 4
- Leaflet.js untuk peta interaktif
- Leaflet Draw untuk digitasi
- shadcn/ui components
- tRPC React Query

### Backend
- Node.js 22 + Express 4
- tRPC 11 untuk type-safe API
- MySQL 8 + Drizzle ORM
- PDFKit untuk generate PDF
- @mapbox/shp-write untuk shapefile
- Turf.js untuk geospatial calculations

### AI & Integration
- LLM untuk ekstraksi dokumen
- Manus OAuth untuk autentikasi
- S3 untuk file storage

## Prerequisites

- Node.js 22+
- MySQL 8+
- pnpm

## Installation

```bash
# Clone repository
git clone https://github.com/zaimam09/amdalnet-shapefile-converter.git
cd amdalnet-shapefile-converter

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Setup database
pnpm db:push

# Run development server
pnpm dev
```

## Environment Variables

```env
DATABASE_URL=mysql://user:password@localhost:3306/amdalnet
JWT_SECRET=your-random-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Your Name
VITE_APP_TITLE=AMDALNET Shapefile Converter
VITE_APP_LOGO=https://your-logo-url.com/logo.png
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

## Database Schema

### Projects Table
- id, name, description, userId, createdAt, updatedAt

### Polygons Table
- id, projectId, objectId, pemrakarsa, kegiatan, tahun, provinsi
- nib, kbli, kabupatenKota, kecamatan, desaKelurahan, alamat
- keterangan, layer, area, geometry (GeoJSON)
- createdAt, updatedAt

## API Endpoints (tRPC)

### Projects
- `projects.list` - List all projects
- `projects.getById` - Get project by ID
- `projects.create` - Create new project
- `projects.delete` - Delete project

### Polygons
- `polygons.list` - List polygons by project
- `polygons.create` - Create polygon
- `polygons.update` - Update polygon
- `polygons.delete` - Delete polygon

### Export
- `export.shapefile` - Export shapefile ZIP
- `export.pdf` - Export PDF A3

### Documents
- `documents.analyze` - AI ekstraksi dokumen PDF

## Development

```bash
# Run dev server
pnpm dev

# Build for production
pnpm build

# Run production server
NODE_ENV=production node server/_core/index.js
```

## Deployment

### Option 1: Manus Platform (Recommended)
- Klik tombol Publish di Management UI
- Auto-scaling, CDN, SSL included

### Option 2: VPS/Cloud
- Setup Node.js 22+ dan MySQL 8+
- Clone repository dan install dependencies
- Setup environment variables
- Run dengan PM2 atau systemd
- Setup Nginx reverse proxy
- Setup SSL dengan Let's Encrypt

## License

MIT

## Author

Created by imam zarkasyi arifin

## Support

Untuk pertanyaan atau issue, silakan buat issue di GitHub repository ini.
