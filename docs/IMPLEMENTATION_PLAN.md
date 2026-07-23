# Implementation Plan

Dokumen ini adalah rencana implementasi MVP kecil untuk satu aplikasi Next.js full-stack. Scope tetap terbatas pada Admin, Kepala, Pengajar, data santri/wali sebagai kontak, halaqah, periode, pencatatan Sabaq/Sabqi/Manzil, dashboard, koreksi dengan audit, dan laporan PDF/cetak.

Tidak termasuk MVP: login wali, portal wali, absensi, infaq internal, WhatsApp/email otomatis, payment gateway, aplikasi native, AI, audio recording, gamifikasi, multi-cabang kompleks, microservices, atau Kubernetes.

## Ringkasan Review Spesifikasi

### 1. Requirement yang Sudah Dikunci
- Hak akses Admin dikunci sebagai pengelola data operasional, bukan penilaian hafalan.
- Kepala dikunci sebagai pemegang monitoring dan otorisasi akademik.
- Hak melihat audit dipisahkan dari hak melakukan aksi yang tercatat di audit.
- Role `HEAD` hanya dapat dikelola oleh pengguna aktif yang sudah memiliki role `HEAD`.
- Sistem wajib menjaga minimal satu pengguna aktif dengan role `HEAD`.
- Laporan dapat memakai periode pembelajaran atau rentang tanggal khusus, tetapi internalnya selalu `period_start` dan `period_end`.
- PDF MVP dibuat dari `report_snapshot`, bukan file permanen.
- Export seluruh data tidak masuk MVP kecuali backup/restore operasional.
- Periode `CLOSED` tidak menerima input atau koreksi; Kepala harus reopen periode dengan alasan.
- Void setoran masuk MVP terbatas untuk Kepala dengan alasan.

### 2. Business Rule yang Sudah Dikunci dan Sisa Ambigu
- Definisi Sabaq, Sabqi, dan Manzil belum menentukan apakah kategori boleh mencatat rentang yang sama di hari yang sama, lintas hari, atau harus mengikuti progres tertentu.
- Satu record setoran hanya mencakup satu surah; sesi lintas surah dicatat sebagai beberapa record.
- Duplikasi dapat di-override oleh pengajar dengan konfirmasi dan alasan wajib.
- Batas koreksi 24 jam memakai timezone organisasi.
- Koreksi memperbarui record yang sama; status utama hanya `ACTIVE` dan `VOID`.
- Satu santri hanya boleh memiliki satu membership halaqah aktif pada waktu yang sama.
- Semua tipe assignment aktif boleh mencatat setoran; hanya pembuat setoran yang boleh mengoreksinya dalam 24 jam.
- Santri perlu perhatian jika tidak ada setoran selama 7 hari kalender atau setoran terakhir `LESS_FLUENT`.

### 3. Risiko Authorization dan Keamanan Data
- Semua query data harus selalu difilter `organization_id`; risiko terbesar adalah kebocoran data antarorganisasi atau antarhalaqah melalui direct URL/API.
- Pengajar hanya boleh membaca dan menulis data halaqah yang sedang ditugaskan; validasi harus mengecek assignment aktif, membership aktif, periode, dan organisasi pada server.
- Wali adalah kontak, bukan user. Jangan membuat `guardian` bisa login, memiliki password, session, atau role.
- Generated PDF dapat memuat data sensitif santri. Endpoint preview/download harus memeriksa authorization server-side dan tidak mengandalkan path file publik.
- Audit operasional dan audit akademik dipisah agar akses Admin, Kepala, dan Pengajar dapat dibatasi jelas.
- Audit akademik berisi before/after data. Aksesnya harus dibatasi dan tidak boleh terekspos penuh ke Admin atau Pengajar.
- Admin dapat melihat audit perubahan role `HEAD` secara read-only, tetapi tidak dapat mengubah role `HEAD`.
- Kepala dapat melihat detail event periode karena periode memengaruhi setoran, koreksi, laporan, dan kepercayaan data.
- Cookie session perlu HttpOnly, Secure, SameSite, dan user nonaktif harus ditolak pada login serta pada validasi session berikutnya.
- Data laporan dan catatan pengajar harus menghindari informasi sensitif di luar perkembangan hafalan.

### 4. Risiko Desain Database
- Perlu constraint unik yang jelas: email user per organisasi, nomor santri per organisasi, slug organisasi, nomor laporan per organisasi/periode, dan master surah.
- Tabel membership dan assignment butuh validasi overlap rentang tanggal agar satu santri/pengajar tidak memiliki state aktif yang membingungkan.
- `memorization_records` perlu menyimpan snapshot penting seperti halaqah, pengajar, periode, dan rentang ayat agar histori tetap benar setelah pindah halaqah.
- `generated_reports` menggunakan `report_snapshot`; `file_path` tidak dibutuhkan pada MVP.
- Soft delete/status harus konsisten; data utama sebaiknya memakai status/arsip, bukan hard delete.
- JSON audit before/after harus punya struktur stabil agar dapat dibaca ulang dan dites, bukan sekadar dump bebas.
- Perlu seed master `quran_surahs` yang akurat sebelum validasi setoran dapat dipercaya.

### 5. Dependency Antar Slice
- Auth dan server authorization harus ada sebelum halaman data yang menampilkan informasi santri/halaqah.
- Organization, user, role, periode, master surah, santri, wali, halaqah, assignment, dan membership adalah fondasi sebelum pencatatan setoran.
- Validasi setoran bergantung pada master surah, periode aktif, assignment pengajar, membership santri, status santri, dan status halaqah.
- Dashboard bergantung pada data setoran dan rule "perlu perhatian".
- Koreksi, void, dan laporan harus menunggu model setoran serta audit stabil.
- PDF bergantung pada data santri, halaqah, pengajar, periode, riwayat setoran, dan ringkasan.
- Pilot bergantung pada test authorization, backup/restore, seed data, dan mobile usability.

### 6. Realisme untuk Satu Developer
- MVP realistis untuk satu developer jika dikerjakan sebagai vertical slice kecil dan dipilotkan pada 1 kepala, 1 admin, 2 pengajar, 1-2 halaqah, dan 10-20 santri.
- Rencana lama terlalu horizontal karena menunda nilai utama sampai beberapa slice data selesai. Risiko terbesar adalah auth, scope CRUD yang melebar, PDF, dan backup/restore.
- Target realistis: mulai dengan alur penuh untuk satu organisasi dan satu halaqah, lalu perluas secara bertahap ke pindah halaqah, dashboard lengkap, laporan PDF, dan operasional pilot.

## Rencana Vertical Slice Kecil

### Slice 0 — Fondasi Aman
Tujuan: aplikasi bisa berjalan dengan konfigurasi aman dan jalur verifikasi dasar.

Isi:
- Next.js full-stack, TypeScript strict, lint, typecheck, test runner.
- Validasi environment server-side.
- Database schema awal, migration, seed role, seed master surah.
- Seed akun awal `ADMIN` + `HEAD`.
- Health endpoint tanpa data sensitif.
- Helper authorization server-side berbasis organisasi dan role.
- Tabel audit operasional dan audit akademik.

DoD:
- Lint, typecheck, dan test dasar lulus.
- Secret tidak terekspos ke client.
- Database dapat di-migrate dan di-seed ulang untuk lokal/pilot.

### Slice 1 — Login dan Boundary Data
Tujuan: pengguna aktif bisa login, pengguna nonaktif ditolak, dan semua halaman data terlindungi.

Isi:
- Login/logout, password hash, session cookie HttpOnly/Secure/SameSite.
- Role `ADMIN`, `HEAD`, `TEACHER` dengan multi-role.
- Permission teknis untuk memisahkan `VIEW_OPERATIONAL_AUDIT`, `MANAGE_USER`, `MANAGE_TEACHER_ROLE`, `MANAGE_ADMIN_ROLE`, dan `MANAGE_HEAD_ROLE`.
- Middleware/server guard untuk halaman data.
- Test authorization awal: unauthenticated, inactive user, role mismatch, dan organization mismatch.
- Guard minimal satu pengguna aktif dengan role `HEAD`.

DoD:
- Pengguna aktif masuk sesuai role.
- Pengguna nonaktif tidak bisa login atau memakai session lama.
- Direct access ke halaman data tanpa hak ditolak di server.
- Role `HEAD` terakhir tidak dapat dicabut atau dinonaktifkan.

### Slice 2 — Setup Minimal Halaqah
Tujuan: Admin dapat menyiapkan data minimum agar satu pengajar bisa mencatat setoran. Kepala dapat melihat data tersebut, atau ikut mengelola jika akunnya juga memiliki role Admin.

Isi:
- CRUD terbatas untuk santri, wali sebagai kontak, pengajar/user, periode, halaqah.
- Assignment pengajar aktif ke halaqah.
- Membership santri aktif ke halaqah.
- Pindah halaqah sederhana: tutup membership lama, buat membership baru.
- Admin mengelola data operasional; Kepala melihat data master kecuali akun juga memiliki role Admin.
- Admin dapat membuat user operasional dan mengelola role `TEACHER`.
- Kepala mengelola role sensitif `ADMIN` dan `HEAD`.

DoD:
- Nomor santri unik per organisasi.
- Wali tetap kontak tanpa akun login.
- Pengajar hanya melihat halaqah yang ditugaskan.
- Santri nonaktif atau halaqah nonaktif tidak muncul untuk input setoran baru.
- Satu santri tidak memiliki dua membership halaqah aktif pada waktu yang sama.
- Satu halaqah tidak memiliki dua pengajar `PRIMARY` aktif pada waktu yang sama.

### Slice 3 — Setoran End-to-End
Tujuan: satu pengajar dapat mencatat Sabaq/Sabqi/Manzil dari HP dan Kepala langsung melihat hasilnya.

Isi:
- Form mobile-first untuk memilih halaqah, santri, kategori, satu surah, rentang ayat, predikat, catatan, dan target.
- Validasi Zod/server untuk kategori, predikat, master surah, rentang ayat, periode, assignment, membership, status aktif, dan organisasi.
- Peringatan duplikasi santri + tanggal + kategori + surah + ayat awal + ayat akhir, dengan konfirmasi dan alasan sebelum simpan.
- Riwayat santri dengan filter periode/kategori.
- Ringkasan kepala paling kecil: setoran hari ini/minggu ini dan aktivitas terbaru.

DoD:
- Setoran valid tersimpan dan muncul di riwayat serta dashboard kepala.
- Pengajar tidak bisa mencatat santri halaqah lain melalui UI maupun direct request.
- Median input ditargetkan maksimal 90 detik pada uji pilot.
- Jika satu sesi mencakup beberapa surah, pengajar membuat beberapa record.

### Slice 4 — Koreksi, Void, dan Audit
Tujuan: perubahan setoran dapat dipertanggungjawabkan tanpa hard delete.

Isi:
- Koreksi record dengan alasan wajib dan audit before/after.
- Pengajar hanya dapat mengoreksi setoran miliknya dalam 24 jam berdasarkan timezone organisasi.
- Kepala dapat mengoreksi dengan alasan setelah 24 jam.
- Void setoran dengan alasan wajib untuk Kepala.
- Status record hanya `ACTIVE` dan `VOID`; koreksi adalah audit action `UPDATE`.
- Periode `CLOSED` menolak input dan koreksi; Kepala dapat reopen periode dengan alasan melalui audit operasional.

DoD:
- Audit menyimpan actor, waktu, action, reason, before_data, dan after_data.
- Perubahan tanpa alasan ditolak.
- Pengajar ditolak saat melewati batas waktu atau bukan pemilik record.
- Tidak ada hard delete untuk data setoran.
- Admin dapat melakukan koreksi/void hanya jika akun juga memiliki role `HEAD`.
- Detail event periode `PERIOD_CLOSED` dan `PERIOD_REOPENED` dapat dilihat Kepala.

### Slice 5 — Dashboard Kepala yang Berguna
Tujuan: Kepala dapat memonitor aktivitas dan santri yang butuh perhatian tanpa rekap manual.

Isi:
- Filter periode dan halaqah.
- Jumlah santri/halaqah aktif.
- Setoran hari ini/minggu ini.
- Jumlah Sabaq, Sabqi, Manzil.
- Santri tanpa setoran pada rentang tertentu.
- Santri dengan predikat `LESS_FLUENT` pada setoran terakhir.
- Aktivitas terbaru.

DoD:
- Angka dashboard sesuai data dan menghormati organisasi.
- Pengajar tidak bisa membuka dashboard keseluruhan.
- Kepala dapat membuka detail santri dari dashboard.

### Slice 6 — Laporan PDF/Cetak
Tujuan: Kepala/Admin dapat membuat laporan santri dari data yang sudah ada.

Isi:
- Pilih santri dan periode pembelajaran atau rentang tanggal khusus.
- Preview sebelum generate.
- PDF berisi identitas, ringkasan Sabaq/Sabqi/Manzil, ringkasan kelancaran, riwayat, catatan, tanggal pembuatan, dan area tanda tangan jika diperlukan.
- Metadata dan `report_snapshot` disimpan.
- Periode/rentang tanpa data menampilkan pesan dan tidak membuat PDF kosong.

DoD:
- PDF bisa di-download dan di-print.
- Endpoint preview/download memeriksa authorization server-side.
- Jika data dikoreksi, laporan lama tidak diam-diam berubah tanpa generate ulang.
- PDF dibuat ulang dari snapshot saat diperlukan.

### Slice 7 — Pilot Operasional
Tujuan: aplikasi siap dipakai terbatas oleh yayasan.

Isi:
- Seed data pilot.
- Test authorization dan business rule penting.
- Uji mobile tanpa horizontal scroll.
- Backup harian dan prosedur restore yang diuji.
- Panduan singkat pengguna internal.
- Deployment sederhana untuk satu aplikasi Next.js.

DoD:
- Semua alur utama berjalan untuk pilot.
- Lint, typecheck, dan test kritis lulus.
- Tidak ada bug blocker.
- Backup/restore pernah diuji.
- Kepala dapat melihat dashboard dan membuat laporan PDF.

## Keputusan yang Sudah Dikunci
- Admin mengelola data operasional; Kepala mengelola otorisasi akademik.
- Akun yang membutuhkan dua tanggung jawab memakai multi-role `ADMIN` + `HEAD`.
- Kepala tidak menjadi pengelola utama data master kecuali juga memiliki role `ADMIN`.
- Hak melihat audit tidak berarti hak melakukan seluruh aksi yang tercatat di audit.
- Role `HEAD` hanya dapat diberikan/dicabut oleh pengguna aktif yang sudah memiliki role `HEAD`.
- Sistem wajib menjaga minimal satu pengguna aktif dengan role `HEAD`.
- Koreksi memperbarui record yang sama dan menyimpan audit before/after.
- Status setoran utama hanya `ACTIVE` dan `VOID`.
- Periode `CLOSED` tidak dapat menerima setoran atau koreksi; Kepala harus reopen dengan alasan.
- Laporan memakai periode pembelajaran atau rentang tanggal khusus, lalu disimpan sebagai `period_start` dan `period_end`.
- PDF dibuat dari `report_snapshot`, bukan file permanen.
- Satu santri hanya memiliki satu membership halaqah aktif pada waktu yang sama.
- Satu halaqah hanya memiliki satu pengajar `PRIMARY` aktif pada waktu yang sama.
- Semua tipe assignment aktif dapat mencatat setoran.
- Satu record setoran hanya mencakup satu surah.
- Duplicate override disimpan eksplisit pada record dan membutuhkan alasan.
