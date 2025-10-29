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

## Penyesuaian dengan Contoh PDF

- [x] Tambahkan field NIB, KBLI, Kabupaten/Kota, Kecamatan, Desa/Kelurahan, Alamat ke database
- [x] Update schema polygon dengan field tambahan
- [x] Sesuaikan layout PDF dengan contoh (format yang sama persis)
- [x] Pastikan data AI ekstraksi tersimpan di database
- [x] Format koordinat dalam derajat-menit-detik di tabel

## Perbaikan Berdasarkan Review

- [x] Perbaiki format shapefile agar sesuai standar OSS (validasi 5 file)
- [x] Perbaiki AI ekstraksi agar bisa ambil NIB dengan akurat
- [x] Auto-generate KETERANGAN dari alamat lengkap hasil ekstraksi AI
- [x] Tambahkan tampilan luasan dalam m² selain hektar
- [x] Perbaiki layout PDF A3 dengan 5 section horizontal di panel kanan
- [ ] Tambahkan basemap satellite imagery pada peta (memerlukan tile service)
- [x] Sesuaikan border dan grid peta dengan contoh gambar

## Perbaikan Final

- [x] Fix format ZIP shapefile - file langsung di root ZIP tanpa folder
- [x] Ganti basemap ke satellite imagery (Esri World Imagery dengan labels overlay)
- [x] Perbaiki layout PDF panel kanan agar semua section ada border dan tidak ada space kosong

## Bug Layout PDF Panel Kanan

- [x] Masih ada space kosong besar di panel kanan
- [x] Tinggi section tidak proporsional mengisi seluruh panel
- [x] Perlu menyesuaikan tinggi section 3, 4, 5 agar tidak ada gap
