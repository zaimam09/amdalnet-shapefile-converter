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
