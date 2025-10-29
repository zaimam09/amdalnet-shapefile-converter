# AMDALNET Shapefile Converter - TODO

## Fitur Prioritas Tinggi (MVP)

- [x] Setup database schema untuk menyimpan project dan polygon data
- [x] Upload dan visualisasi peta (shapefile/KML/GeoJSON)
- [x] Digitasi polygon tapak proyek dengan drawing tools
- [x] Form atribut AMDALNET dengan validasi
- [x] Export ke shapefile ZIP yang valid (.shp, .shx, .dbf, .prj, .cpg)

## Fitur Prioritas Sedang

- [ ] Export peta PDF A3 dengan elemen kartografi
- [ ] Analisis dokumen PKKPR/NIB dengan AI untuk auto-fill

## Fitur Tambahan

- [ ] Riwayat project pengguna
- [ ] Template project
- [ ] Validasi sistem koordinat otomatis

## Fitur Baru yang Diminta

- [x] Upload file shapefile/KML/GeoJSON untuk import polygon
- [x] Parse dan extract geometry dari file yang diupload
- [x] Auto-fill form atribut dari data shapefile jika tersedia

## Bugs yang Perlu Diperbaiki

- [x] Fix error Blob conversion di shapefile export
- [x] Fix error require is not defined di FileUploader

## Fitur yang Sedang Dikerjakan

- [x] Implementasi export peta PDF A3 landscape (420x297mm)
- [x] Elemen kartografi: header, peta, panel info, legenda, skala, north arrow
- [x] Tabel atribut dan footer dengan tanggal pembuatan

## Bug Layout PDF

- [x] Perbaiki layout PDF agar rapi 1 lembar seperti contoh
- [x] Peta di kiri (70%), panel info di kanan (30%)
- [x] Tambahkan peta inset lokasi Indonesia
- [x] Tambahkan koordinat grid di border peta
- [x] Tambahkan tabel koordinat titik polygon

## Fitur Tambahan PDF

- [x] Tambahkan informasi pengguna (nama, email) di footer panel kanan
- [x] Tambahkan tanggal pembuatan dokumen dengan format lengkap

## Fitur Prioritas Sedang - Analisis Dokumen AI

- [x] Upload dokumen PKKPR/NIB (PDF)
- [x] Ekstraksi data otomatis dengan LLM (Pemrakarsa, NIB, KBLI, Lokasi, dll)
- [x] Auto-fill form atribut dari hasil ekstraksi
- [x] Generate KETERANGAN otomatis sesuai format
- [x] Preview dan edit hasil ekstraksi

## Fitur Prioritas Rendah

- [ ] Validasi sistem koordinat otomatis berdasarkan longitude
- [ ] Deteksi dan konversi sistem koordinat
- [ ] Multiple polygon support per project
- [ ] Riwayat project pengguna
- [ ] Template project untuk kegiatan umum
