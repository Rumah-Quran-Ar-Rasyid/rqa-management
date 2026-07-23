# Product Specification — Rumah Qur'an Web App

## Latar Belakang
Pencatatan hafalan masih manual. Pertumbuhan santri membuat pengajar dan kepala Rumah Qur'an semakin sulit melakukan pencatatan, monitoring, ri'ayah, dan rekap secara konsisten.

## Tujuan
- Memudahkan pengajar mencatat setoran melalui HP.
- Menyimpan riwayat hafalan secara terpusat.
- Memudahkan kepala melakukan monitoring.
- Menghasilkan laporan perkembangan untuk wali dalam bentuk PDF atau hard copy.
- Mengurangi rekap manual.

## Pengguna MVP
### Admin
Mengelola data operasional: pengguna, santri, wali sebagai kontak, pengajar, halaqah, periode, assignment, dan membership. Admin tidak mencatat, mengoreksi, atau membatalkan hasil setoran secara default.

### Pengajar
Melihat halaqahnya, mencatat setoran, melihat riwayat, dan melakukan koreksi sesuai aturan.

### Kepala
Melihat seluruh data, dashboard, perkembangan santri, audit akademik, koreksi/void setoran sesuai aturan, reopen periode, menjaga role penting, dan membuat laporan.

### Wali Santri
Belum memiliki akun. Menerima laporan PDF/hard copy secara manual.

## Scope MVP
- Login dan role Admin, Kepala, Pengajar.
- Data santri, wali, pengajar, halaqah, dan periode.
- Assignment pengajar dan membership santri.
- Sabaq, Sabqi, Manzil.
- Lancar, Cukup Lancar, Kurang Lancar.
- Riwayat dan koreksi setoran.
- Dashboard kepala.
- Generate, download, dan print laporan PDF.
- Audit operasional dan audit akademik sederhana sesuai role.

## Out of Scope
Login wali, portal wali, absensi, infaq internal, WhatsApp/email otomatis, payment gateway, aplikasi native, AI, audio, gamifikasi, dan multi-cabang kompleks.

## Indikator Keberhasilan
- Minimal 90% setoran pilot tercatat.
- Median input satu setoran maksimal 90 detik.
- Kepala tidak perlu meminta rekap manual.
- Laporan santri dapat dibuat langsung dari data.
- Minimal 80% pengguna pilot menyatakan aplikasi mudah digunakan.
- Tidak ada kebocoran akses antarhalaqah.
- Admin tidak dapat mengubah penilaian hafalan tanpa role Kepala.
- Admin tidak dapat mengubah role Kepala.
- Sistem selalu memiliki minimal satu pengguna aktif dengan role Kepala.

## Pilot
1 kepala, 1 admin, 2 pengajar, 1–2 halaqah, dan 10–20 santri.
