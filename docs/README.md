# Dokumentasi Rumah Qur’an Ar-Rasyid

- `PRODUCT.md`: tujuan, pengguna, scope, dan indikator keberhasilan.
- `USER_FLOWS.md`: alur admin, pengajar, kepala, dan laporan.
- `PERMISSIONS.md`: role dan hak akses.
- `MEMORIZATION_RULES.md`: aturan Sabaq, Sabqi, Manzil, kelancaran, duplikasi, koreksi, void, dan laporan.
- `DATA_MODEL.md`: struktur data awal.
- `ACCEPTANCE_CRITERIA.md`: syarat MVP dianggap selesai.
- `IMPLEMENTATION_PLAN.md`: urutan development.

Prinsip utama: MVP fokus pada pencatatan hafalan internal dan laporan PDF/cetak. Wali belum login dan infaq tetap memakai aplikasi eksternal.

Untuk pengembangan lokal, `npm run db:seed:demo` mengisi akun Pengajar demo, data operasional, dan setoran contoh secara idempotent setelah seed dasar dijalankan. Data demo tidak boleh dijalankan pada database pilot atau produksi; detailnya ada di `README.md` root.

Keputusan MVP yang sudah dikunci:
- Admin mengelola data operasional, bukan penilaian hafalan.
- Kepala memegang otorisasi akademik seperti koreksi/void setoran dan reopen periode.
- Hak melihat audit dipisahkan dari hak melakukan aksi yang tercatat di audit.
- Role Kepala hanya dapat dikelola oleh pengguna aktif yang sudah memiliki role Kepala, dan sistem wajib menjaga minimal satu Kepala aktif.
- Wali hanya kontak dan tidak memiliki akun login.
- Setiap organisasi hanya memiliki satu periode pembelajaran aktif pada satu waktu.
- Halaqah dikelola Admin dengan status Aktif, Nonaktif, atau Diarsipkan; tidak ada hard delete.
- Santri dapat dicatat dengan satu kontak wali utama opsional; wali tidak memiliki akun login.
- Satu record setoran hanya mencakup satu surah.
- PDF laporan dibuat dari snapshot data laporan, bukan file permanen.
- Nama produk pada tampilan adalah “Rumah Qur’an Ar-Rasyid” dan istilah teknis tidak ditampilkan mentah kepada pengguna.
- Form input setoran dirancang mobile-first dengan tombol utama yang jelas.
- Komponen UI ditambahkan secara minimal sesuai kebutuhan slice aktif.
- Katalog komponen awal dibatasi pada daftar yang dikunci di `IMPLEMENTATION_PLAN.md`; feedback toast menggunakan Sonner.
- Database MVP menggunakan MySQL/MariaDB dengan Prisma ORM; akses database hanya dari server.
- Database lokal dijalankan melalui OrbStack/Docker Compose dan mempertahankan data dalam Docker volume.
- Session login disimpan di database selama tujuh hari; browser hanya menyimpan token acak dalam cookie yang dilindungi.
- Slice 0, Slice 1, Slice 2B (pengguna/role, periode, serta halaqah), potongan 2C untuk santri/wali utama, penugasan Pengajar, dan membership santri, serta form setoran Pengajar, riwayat berfilter, dan ringkasan Kepala awal termasuk daftar santri perlu perhatian pada Slice 3 telah diimplementasikan. Tahap berikutnya adalah koreksi, void, dan audit sesuai `IMPLEMENTATION_PLAN.md`.

Setiap perubahan requirement, business rule, authorization, data model, atau rencana implementasi harus memperbarui dokumen terkait sebelum atau bersama perubahan kode.
