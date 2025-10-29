# AMDALNET Shapefile Converter - Panduan Pengguna

## Informasi Aplikasi

**Tujuan:** Aplikasi web untuk membuat peta tapak proyek sesuai standar AMDALNET Indonesia dengan fitur digitasi polygon, form atribut wajib, dan export shapefile.

**Akses:** Login diperlukan menggunakan akun Manus.

## Powered by Manus

Aplikasi ini dibangun dengan teknologi modern untuk performa dan keandalan maksimal. **Frontend** menggunakan React 19 dengan TypeScript untuk type safety, Tailwind CSS 4 untuk styling responsif, dan Leaflet.js untuk peta interaktif dengan drawing tools. **Backend** ditenagai Express 4 dengan tRPC 11 untuk komunikasi type-safe antara client dan server. **Database** menggunakan MySQL dengan Drizzle ORM untuk manajemen data yang efisien. **Authentication** terintegrasi dengan Manus OAuth untuk keamanan login. **Deployment** berjalan di infrastruktur auto-scaling dengan global CDN untuk akses cepat dari seluruh Indonesia.

## Menggunakan Aplikasi

Aplikasi ini memungkinkan Anda membuat peta tapak proyek AMDALNET dengan mudah. Setelah login, klik tombol "Project Baru" untuk memulai. Isi nama project seperti "Pembangunan Pabrik XYZ" dan deskripsi opsional, lalu klik "Buat Project". Anda akan diarahkan ke halaman editor peta. Gunakan tools di pojok kanan atas peta untuk menggambar polygon tapak proyek Anda. Klik ikon polygon atau rectangle untuk mulai menggambar. Klik pada peta untuk membuat titik-titik polygon, dan klik ganda untuk menyelesaikan. Luas area akan dihitung otomatis dalam hektar. Di panel kanan, isi semua field atribut AMDALNET yang wajib: Pemrakarsa, Kegiatan, Tahun, Provinsi, dan Keterangan. Setelah semua terisi, klik "Simpan Polygon". Untuk export hasil, klik tombol "Export Shapefile" di header untuk mengunduh file ZIP yang berisi shapefile lengkap dengan format standar AMDALNET.

## Mengelola Aplikasi

Gunakan panel Management UI di sebelah kanan untuk mengakses berbagai pengaturan. Di panel **Preview**, Anda dapat melihat aplikasi secara langsung. Panel **Code** menampilkan struktur file project dengan opsi download. Panel **Database** menyediakan interface CRUD untuk mengelola data project dan polygon secara langsung. Di panel **Settings → General**, Anda dapat mengubah nama dan logo aplikasi. Panel **Dashboard** menampilkan statistik penggunaan aplikasi setelah dipublish.

## Langkah Selanjutnya

Hubungi Manus AI kapan saja untuk meminta perubahan atau menambah fitur baru. Mulai buat project pertama Anda dan digitasi peta tapak proyek sesuai standar AMDALNET dengan mudah dan cepat.
