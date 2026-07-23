# MVP Acceptance Criteria

## Login
- Akun aktif dengan kredensial benar dapat login dan diarahkan sesuai role.
- Akun nonaktif ditolak.

## Santri dan Halaqah
- Admin dapat membuat santri dengan nomor unik.
- Admin dapat membuat halaqah, menetapkan pengajar, dan memasukkan santri.
- Pengajar hanya melihat halaqah yang diampu.
- Akses langsung ke halaqah lain ditolak di server.

## Setoran
Given pengajar login dan mengampu halaqah santri, ketika kategori, rentang surah/ayat, dan kelancaran valid disimpan, maka setoran muncul pada riwayat dan dashboard kepala.

- Kategori wajib.
- Kelancaran wajib.
- Ayat di luar batas surah ditolak.
- Pengajar tidak dapat mencatat santri halaqah lain.
- Identitas pembuat dan waktu tersimpan.

## Riwayat dan Koreksi
- Riwayat diurutkan terbaru dan dapat difilter.
- Pengajar dapat mengoreksi miliknya dalam 24 jam dengan alasan.
- Setelah 24 jam, perubahan pengajar ditolak.
- Kepala/admin dapat mengoreksi dengan alasan.
- Audit menyimpan data sebelum dan sesudah.

## Dashboard
Menampilkan santri/halaqah aktif, setoran hari/minggu, jumlah per kategori, santri Kurang Lancar, dan aktivitas terbaru dengan angka yang sesuai data.

## Laporan
- Kepala/admin dapat memilih santri dan periode.
- Ada pratinjau.
- PDF memuat identitas, ringkasan, riwayat, catatan, dan tanggal pembuatan.
- PDF dapat didownload dan dicetak.
- Periode tanpa data menampilkan pesan dan tidak otomatis membuat PDF kosong.

## Mobile Usability
- Minimal 4 dari 5 pengguna pilot dapat mencatat tanpa bantuan.
- Median input maksimal 90 detik.
- Tidak ada horizontal scroll.
- Pesan validasi jelas dan data form tidak hilang.

## Keamanan dan Operasional
- Semua halaman data membutuhkan login.
- Authorization di server.
- Password tidak plaintext.
- Cookie HttpOnly, Secure, SameSite.
- Secret tidak masuk client.
- Backup harian dan prosedur restore tersedia serta diuji.
- Source code tersimpan di repository yayasan.
- Health endpoint tersedia.

## Definition of Done Pilot
Semua alur utama berjalan, lint/typecheck/test kritis lulus, tidak ada bug blocker, pencatatan nyaman di HP, dashboard kepala berfungsi, laporan PDF dapat dibuat, dan backup/restore sudah diuji.
