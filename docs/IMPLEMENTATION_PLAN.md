# Implementation Plan

Dokumen ini adalah rencana implementasi MVP kecil Rumah Qur’an Ar-Rasyid dalam satu aplikasi Next.js full-stack. Scope tetap terbatas pada Admin, Kepala, Pengajar, data santri/wali sebagai kontak, halaqah, periode, pencatatan Sabaq/Sabqi/Manzil, dashboard, koreksi dengan audit, dan laporan PDF/cetak.

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
- Periode `CLOSED` tidak menerima input, koreksi, atau void; Kepala harus reopen periode dengan alasan.
- Void setoran masuk MVP terbatas untuk Kepala dengan alasan.

### 2. Business Rule yang Sudah Dikunci dan Sisa Ambigu
- Definisi Sabaq, Sabqi, dan Manzil belum menentukan apakah kategori boleh mencatat rentang yang sama di hari yang sama, lintas hari, atau harus mengikuti progres tertentu.
- Satu record setoran hanya mencakup satu surah; sesi lintas surah dicatat sebagai beberapa record.
- Duplikasi dapat di-override oleh pengajar dengan konfirmasi dan alasan wajib.
- Batas koreksi Pengajar adalah 24 jam sejak record dibuat; timezone organisasi digunakan untuk tanggal yang tampil kepada pengguna.
- Koreksi memperbarui record yang sama; status utama hanya `ACTIVE` dan `VOID`.
- Satu santri hanya boleh memiliki satu membership halaqah aktif pada waktu yang sama.
- Semua tipe assignment aktif boleh mencatat setoran; hanya pembuat setoran yang boleh mengoreksinya dalam 24 jam sejak record dibuat.
- Santri perlu perhatian jika belum pernah memiliki setoran aktif, atau setoran aktif terakhir sama dengan atau sebelum tujuh hari kalender sebelum hari ini menurut timezone organisasi, atau predikat setoran aktif terakhir `LESS_FLUENT`.

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
- Endpoint login publik memakai rate limiting per email yang di-HMAC untuk mengurangi risiko brute force; pesan gagal tetap tidak mengungkapkan status akun. Perlindungan berbasis IP/WAF tetap menjadi konfigurasi deployment yang direkomendasikan.
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

## Prinsip UI dan Strategi Komponen

- Nama yang tampil kepada pengguna adalah “Rumah Qur’an Ar-Rasyid”.
- Gunakan Bahasa Indonesia dan istilah kegiatan Rumah Qur’an. Enum seperti `HEAD`, `LESS_FLUENT`, atau `VOID` hanya digunakan di kode/data dan dipetakan menjadi Kepala, Kurang Lancar, atau Dibatalkan pada UI.
- Form setoran adalah alur paling penting dan wajib dirancang mobile-first, satu kolom, cepat dipindai, serta tetap nyaman pada viewport 360 piksel.
- Setiap halaman/form memiliki tombol utama yang mudah dikenali dan berlabel spesifik. Aksi sekunder tidak boleh bersaing secara visual dengan aksi utama.
- Validasi ditampilkan dekat field terkait. Data yang sudah diisi tidak hilang ketika validasi atau penyimpanan gagal.
- Tabel digunakan untuk pemindaian data di desktop, tetapi pada mobile item penting ditampilkan sebagai daftar responsif tanpa horizontal scroll halaman.
- `shadcn/ui` boleh dipakai sebagai fondasi komponen yang dimiliki oleh source code proyek. Instalasi dilakukan minimal sesuai kebutuhan slice, bukan sekaligus.
- Gunakan komponen yang sama untuk pola yang sama agar status, formulir, dialog konfirmasi, dan feedback konsisten.

Katalog komponen awal yang disetujui:

- Button
- Input
- Select
- Textarea
- Card
- Table
- Dialog
- Alert Dialog
- Badge
- Tabs
- Dropdown Menu
- Date Picker
- Form
- Sonner

Keputusan penggunaan:
- Gunakan Sonner sebagai satu-satunya sistem toast; jangan memasang sistem Toast lain.
- `Dialog` digunakan untuk form atau detail ringkas yang dapat dibatalkan tanpa konsekuensi.
- `Alert Dialog` digunakan untuk konfirmasi aksi sensitif atau destruktif, seperti void, menutup periode, atau mencabut role.
- `Table` digunakan pada desktop dengan representasi daftar responsif pada mobile.
- `Dropdown Menu` hanya untuk kumpulan aksi sekunder. Aksi utama tetap berupa tombol yang terlihat.
- `Tabs` hanya digunakan saat beberapa tampilan benar-benar setara, misalnya ringkasan dan riwayat, bukan untuk menyembunyikan alur utama.
- `Date Picker` digunakan untuk tanggal/rentang tanggal yang membutuhkan konteks kalender; input tanggal sederhana boleh tetap memakai kontrol native.
- Form adalah pola React Hook Form + Zod pada shadcn terbaru, bukan file komponen mandiri. `Field`, Label, dan Separator diperbolehkan sebagai primitive internal Form.
- Primitive pendukung lain yang dibutuhkan komponen katalog, seperti Calendar dan Popover untuk Date Picker, diperbolehkan sebagai dependency internal.
- CLI `shadcn` dijalankan melalui `npx` saat menambah komponen dan tidak disimpan sebagai dependency runtime aplikasi.
- Penambahan komponen di luar katalog ini harus didorong kebutuhan slice dan dicatat pada dokumen ini.
- Shell aplikasi internal memakai header dan sidebar yang tetap terlihat; hanya area konten utama yang menggulir. Pada layar kecil, header navigasi juga tidak ikut menggulir bersama konten.

Peta pemasangan per slice:

| Slice | Komponen baru | Alasan |
|---|---|---|
| 0 | Button, Input, Card, fondasi Form | Fondasi visual dan formulir halaman masuk pada slice berikutnya. Field/Label/Separator hanya primitive internal. |
| 1 | Tidak ada komponen wajib baru | Halaman masuk memakai komponen dasar Slice 0. |
| 2 | Select, Textarea, Table, Dialog, Alert Dialog, Badge, Dropdown Menu, Date Picker, Sonner | CRUD data operasional, status, tanggal, konfirmasi, aksi sekunder, dan feedback mutasi. |
| 3 | Tidak ada komponen wajib baru | Form setoran memakai Form, Select, Input, Textarea, Button, dan Sonner yang sudah tersedia. |
| 4 | Tabs | Memisahkan ringkasan setoran dan riwayat audit saat keduanya tersedia. |
| 5–6 | Tambahkan hanya komponen dalam katalog yang benar-benar dibutuhkan | Gunakan kembali komponen yang sudah ada sebelum menambah dependency. |

## Rencana Vertical Slice Kecil

### Slice 0 — Fondasi Aman
Tujuan: aplikasi bisa berjalan dengan konfigurasi aman dan jalur verifikasi dasar.

Isi:
- Next.js full-stack, TypeScript strict, lint, typecheck, test runner.
- Metadata dan fondasi visual dengan nama “Rumah Qur’an Ar-Rasyid”.
- Inisialisasi minimal `shadcn/ui` dengan Button, Input, Card, dan fondasi Form beserta primitive internalnya.
- Token warna, tipografi, focus state, dan ukuran kontrol yang konsisten serta mudah dibaca.
- Validasi environment server-side.
- Database MySQL schema awal, migration, Prisma v7 driver adapter, seed role, dan seed master surah.
- Seed akun awal `ADMIN` + `HEAD`.
- Health endpoint tanpa data sensitif.
- Helper authorization server-side berbasis organisasi dan role.
- Tabel audit operasional dan audit akademik.

DoD:
- Lint, typecheck, dan test dasar lulus.
- Secret tidak terekspos ke client.
- Database dapat di-migrate dan di-seed ulang untuk lokal/pilot.
- Button, Input, Card, dan fondasi Form tersedia serta lulus typecheck tanpa memasang komponen katalog lain lebih awal.
- Nama produk dan istilah yang tampil tidak menggunakan placeholder atau enum teknis.

Status implementasi per 25 Juli 2026:
- Slice 0 selesai dan terverifikasi pada MySQL 8.4 lokal melalui OrbStack/Docker Compose.
- Schema, migration awal, Prisma Client server-only, seed idempotent, validasi environment, health endpoint, dan halaman fondasi telah dibuat.
- Seed memuat role `ADMIN`, `HEAD`, `TEACHER`, 114 surah, satu organisasi, dan satu akun awal `ADMIN` + `HEAD`.
- Test fondasi mencakup environment, batas organisasi, pengguna nonaktif, pengelolaan role, perlindungan Kepala terakhir, dan integritas master surah.
- Lint, typecheck, test, Prisma validate/generate, dan build produksi sudah lulus.
- Migration `20260724000000_init` telah applied tanpa rollback. Query verifikasi menemukan 1 organisasi, 3 role, 114 surah, dan akun awal aktif dengan role `ADMIN` + `HEAD`.
- Audit dependency masih melaporkan advisory transitif pada versi Next.js/Prisma saat ini tanpa perbaikan non-breaking; jangan menjalankan `npm audit fix --force`. Tinjau kembali sebelum pilot/deployment.

### Slice 1 — Login dan Boundary Data
Tujuan: pengguna aktif bisa login, pengguna nonaktif ditolak, dan semua halaman data terlindungi.

Isi:
- Login/logout, password hash, session cookie HttpOnly/Secure/SameSite.
- Halaman masuk mobile-friendly dengan identitas “Rumah Qur’an Ar-Rasyid”, label yang jelas, dan tombol “Masuk” sebagai aksi utama.
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

Status implementasi per 25 Juli 2026:
- Slice 1 selesai untuk boundary autentikasi yang tersedia saat ini.
- Login/logout memakai database session tujuh hari. Cookie menyimpan token acak, sedangkan database menyimpan hash HMAC-SHA-256, masa berlaku, dan waktu pencabutan.
- Cookie memakai `HttpOnly`, `SameSite=Lax`, `Path=/`, dan `Secure` pada production.
- Halaman `/app` dilindungi server guard; akses tanpa session valid diarahkan ke `/login`.
- Session langsung ditolak jika dicabut, kedaluwarsa, organisasi/pengguna nonaktif, atau pengguna tidak lagi memiliki role aktif.
- Login MVP mengharuskan tepat satu organisasi aktif per instalasi agar organisasi tidak dipilih secara ambigu.
- Permission multi-role, pemisahan pengelolaan role, batas organisasi, dan perlindungan Kepala aktif terakhir sudah tersedia sebagai policy yang dites. Endpoint mutasi role baru dibuat pada Slice 2 dan wajib memakai policy tersebut.
- UI halaman masuk dan kerangka internal menggunakan komponen Slice 0, Bahasa Indonesia, target sentuh minimal 44 piksel, dan tidak menampilkan enum teknis.
- Smoke test MySQL memverifikasi login, redirect, atribut cookie, akses halaman internal, logout, pencabutan session, dan penolakan cookie lama.
- Login dibatasi lima kegagalan per email dalam 15 menit; kegagalan kelima mengunci percobaan selama 15 menit. Kunci dan reset dihitung server-side dengan email yang di-HMAC, lalu dilindungi test policy.

### Slice 2 — Setup Minimal Halaqah
Tujuan: Admin dapat menyiapkan data minimum agar satu pengajar bisa mencatat setoran. Kepala dapat melihat data tersebut, atau ikut mengelola jika akunnya juga memiliki role Admin.

Isi:
- CRUD terbatas untuk santri, wali sebagai kontak, pengajar/user, periode, halaqah.
- Daftar desktop memakai tabel; pada mobile, informasi dan aksi utama tersedia sebagai daftar responsif tanpa horizontal scroll halaman.
- Dialog digunakan untuk form/detail ringkas, Alert Dialog untuk konfirmasi sensitif, Badge untuk status, Dropdown Menu untuk aksi sekunder, dan Sonner untuk hasil aksi yang tidak menggantikan validasi field.
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

Status implementasi per 25 Juli 2026:
- Slice 2A selesai: daftar pengguna responsif, pembuatan akun Pengajar, perubahan status aktif/nonaktif, pengelolaan role, audit operasional, dan toast hasil aksi telah tersedia.
- Admin dapat membuat akun aktif dengan role Pengajar awal. Kepala dapat mengelola role Admin dan Kepala; Admin tidak dapat mengelola role tersebut kecuali akunnya juga memiliki role Kepala.
- Perubahan status, pemberian/pencabutan role, audit, dan pencabutan session saat diperlukan berjalan dalam transaksi serializable serta selalu difilter organisasi.
- Kepala aktif terakhir tidak dapat dicabut atau dinonaktifkan. Admin tanpa role Kepala juga tidak dapat menonaktifkan pengguna yang masih memiliki role Kepala aktif; pengguna tidak dapat mengubah status sendiri.
- Tampilan desktop memakai tabel; mobile memakai daftar kartu tanpa bergantung pada scroll horizontal halaman.
- Kerangka aplikasi menggunakan sidebar pada desktop, navigasi ringkas pada mobile, serta pencarian lokal pada daftar pengguna agar alur operasional cepat dipindai.
- Slice periode pada 2B selesai: Admin dapat membuat periode `PLANNED` dan mengaktifkannya; Kepala dapat menutup atau membuka kembali periode dengan alasan. Semua transisi diaudit dan detailnya dapat dilihat pada riwayat periode.
- Satu organisasi hanya dapat memiliki satu periode aktif. Aktivasi dan reopen diperiksa di dalam transaksi serializable agar periode aktif tidak ambigu.
- Periode memakai tabel pada desktop, daftar kartu pada mobile, dialog form, konfirmasi untuk transisi sensitif, dan banner saat periode hasil reopen masih aktif.
- Slice halaqah pada 2B selesai: Admin dapat membuat, mengubah, mengaktifkan, menonaktifkan, dan mengarsipkan halaqah; Kepala hanya membaca daftar. Semua mutasi dicatat sebagai audit operasional dan selalu difilter organisasi.
- Halaqah memakai status Aktif, Nonaktif, atau Diarsipkan. Arsip menggantikan hard delete dan bersifat final pada MVP.
- Tampilan halaqah memakai tabel desktop, kartu mobile, pencarian lokal, form dialog, menu aksi ringkas, serta konfirmasi sebelum arsip.
- Potongan santri/wali utama pada 2C selesai: Admin dapat membuat dan mengubah santri, mencatat satu wali utama opsional, mengubah status, atau mengarsipkan tanpa hard delete. Kepala hanya membaca daftar.
- Nomor santri unik per organisasi. Kontak wali yang mulai diisi wajib menyertakan nama, hubungan, dan nomor telepon; wali tetap tanpa login, password, session, atau role.
- Pembuatan santri beserta wali utama dan relasinya berjalan dalam transaksi serializable, seluruh mutasi masuk audit operasional, dan semua query difilter organisasi.
- Tampilan santri memakai tabel desktop, kartu mobile, pencarian lokal, form satu kolom pada mobile, menu aksi ringkas, serta konfirmasi sebelum arsip.
- Potongan penugasan Pengajar pada 2C selesai: Admin dapat menetapkan Pengajar aktif ke halaqah aktif, melihat histori penugasan, dan mengakhiri penugasan yang masih berjalan dengan tanggal selesai. Kepala hanya melihat daftar kecuali akunnya juga memiliki role Admin.
- Pengajar Utama divalidasi tidak bertumpang tindih pada halaqah yang sama dalam transaksi serializable. Pengajar Pengganti wajib memiliki tanggal selesai. Semua mutasi penugasan masuk audit operasional dan seluruh query difilter organisasi.
- Tampilan penugasan memakai tabel desktop, kartu mobile, form dialog satu kolom, serta dialog konfirmasi untuk mengakhiri penugasan.
- Potongan membership santri pada 2C selesai: Admin dapat menempatkan santri aktif pada halaqah aktif dan memindahkannya melalui satu form; Kepala hanya melihat daftar kecuali akunnya juga memiliki role Admin.
- Perpindahan menutup membership aktif lama sehari sebelum tanggal mulai baru lalu membuat membership baru dalam transaksi serializable. Riwayat yang bertumpang tindih ditolak, setiap mutasi masuk audit operasional, dan seluruh query difilter organisasi.
- Tampilan membership memakai tabel desktop, kartu mobile, dan form dialog satu kolom yang menampilkan halaqah aktif santri sebelum dipindah.
- Wali tambahan dan relasi satu wali dengan beberapa santri masih belum dibuat; keduanya bukan dependency untuk slice setoran awal.

### Slice 3 — Setoran End-to-End
Tujuan: satu pengajar dapat mencatat Sabaq/Sabqi/Manzil dari HP dan Kepala langsung melihat hasilnya.

Isi:
- Form mobile-first satu kolom untuk memilih halaqah, santri, kategori, satu surah, rentang ayat, predikat, catatan, dan target.
- Pilihan santri dan surah harus cepat dicari/dipilih; label menggunakan istilah Rumah Qur’an dan tidak menampilkan enum teknis.
- Tombol “Simpan Setoran” menjadi aksi utama yang jelas, dengan status proses yang mencegah penyimpanan ganda.
- Validasi Zod/server untuk kategori, predikat, master surah, rentang ayat, periode, assignment, membership, status aktif, dan organisasi.
- Peringatan duplikasi santri + tanggal + kategori + surah + ayat awal + ayat akhir, dengan konfirmasi dan alasan sebelum simpan.
- Riwayat santri dengan filter periode/kategori.
- Ringkasan kepala paling kecil: setoran hari ini/minggu ini dan aktivitas terbaru.

DoD:
- Setoran valid tersimpan dan muncul di riwayat serta dashboard kepala.
- Pengajar tidak bisa mencatat santri halaqah lain melalui UI maupun direct request.
- Median input ditargetkan maksimal 90 detik pada uji pilot.
- Form dapat digunakan pada viewport 360 piksel tanpa horizontal scroll atau elemen saling menutup.
- Validasi tampil dekat field terkait dan tidak menghapus input yang sudah diisi.
- Jika satu sesi mencakup beberapa surah, pengajar membuat beberapa record.

Status implementasi per 25 Juli 2026:
- Potongan input setoran Pengajar selesai: halaman `/app/setoran` bersifat mobile-first, hanya dapat diakses Pengajar, dan hanya menampilkan halaqah yang ditugaskan serta santri dengan membership aktif.
- Server memvalidasi periode aktif, assignment, membership, status santri/halaqah, organisasi, master surah, serta rentang ayat sebelum menyimpan. Tanggal setoran ditetapkan server berdasarkan timezone organisasi.
- Setoran duplikat pada hari yang sama memerlukan konfirmasi dan alasan. Record serta audit akademik `CREATE` disimpan dalam satu transaksi serializable.
- Riwayat terbaru milik Pengajar ditampilkan pada halaman yang sama dalam tabel desktop dan kartu mobile.
- Ringkasan Kepala awal selesai pada Beranda: setoran hari ini/minggu ini, jumlah santri/halaqah aktif, kategori setoran mingguan, dan aktivitas terbaru. Semua agregat dibatasi organisasi serta record setoran aktif; minggu berjalan dimulai Senin menurut timezone organisasi.
- Daftar santri perlu perhatian selesai: hanya memuat santri aktif, memakai setoran aktif terakhir, menandai ambang tujuh hari secara inklusif, dan menampilkan alasan perhatian.
- Filter riwayat Pengajar selesai: periode dan kategori diproses di server, hasil tetap dibatasi organisasi dan pembuat setoran, serta dipaginasi 20 hasil per halaman.
- Seed demo lokal tersedia secara terpisah melalui `npm run db:seed:demo`; script tersebut idempotent dan tidak boleh dipakai pada database pilot atau produksi.

### Slice 4 — Koreksi, Void, dan Audit
Tujuan: perubahan setoran dapat dipertanggungjawabkan tanpa hard delete.

Isi:
- Koreksi record dengan alasan wajib dan audit before/after.
- Pengajar hanya dapat mengoreksi setoran miliknya dalam 24 jam sejak record dibuat.
- Kepala dapat mengoreksi dengan alasan setelah 24 jam.
- Void setoran dengan alasan wajib untuk Kepala.
- Status record hanya `ACTIVE` dan `VOID`; koreksi adalah audit action `UPDATE`.
- Periode `CLOSED` menolak input, koreksi, dan void; Kepala dapat reopen periode dengan alasan melalui audit operasional.

DoD:
- Audit menyimpan actor, waktu, action, reason, before_data, dan after_data.
- Perubahan tanpa alasan ditolak.
- Pengajar ditolak saat melewati batas waktu atau bukan pemilik record.
- Tidak ada hard delete untuk data setoran.
- Admin dapat melakukan koreksi/void hanya jika akun juga memiliki role `HEAD`.
- Detail event periode `PERIOD_CLOSED` dan `PERIOD_REOPENED` dapat dilihat Kepala.

Status implementasi per 25 Juli 2026:
- Slice 4 selesai: detail setoran membatasi data berdasarkan organisasi dan kepemilikan Pengajar; Kepala dapat membuka detail dari aktivitas dashboard.
- Koreksi dan void selalu memeriksa status record/periode pada server dan menyimpan mutasi beserta audit akademik dalam transaksi serializable.
- Kepala melihat detail perubahan audit; Pengajar hanya melihat riwayat audit terbatas untuk record miliknya; Admin tidak menerima detail audit akademik.

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

Status implementasi per 25 Juli 2026:
- Potongan filter dashboard selesai: Kepala dapat memilih periode dan halaqah dari Beranda, filter diproses server-side, dan query filter divalidasi terhadap organisasi.
- Filter memengaruhi jumlah setoran hari ini/minggu ini, jumlah Sabaq/Sabqi/Manzil, dan aktivitas terbaru.
- Jumlah santri/halaqah aktif serta daftar santri perlu perhatian tetap memakai kondisi aktif organisasi saat ini agar pemilihan periode historis tidak mengubah definisi perhatian.
- Kepala dapat membuka detail setoran dari aktivitas terbaru dan detail akademik santri aktif dari daftar perhatian.
- Detail santri hanya tersedia untuk Kepala, divalidasi terhadap organisasi dan status Aktif di server, serta tidak memuat kontak wali. Halaman menampilkan ringkasan setoran aktif, halaqah saat ini, status perhatian, dan maksimal 10 setoran aktif terbaru.

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

Status implementasi per 25 Juli 2026:
- Admin dan Kepala dapat memilih santri dan periode pembelajaran atau rentang tanggal, lalu melihat pratinjau setoran aktif sebelum membuat laporan.
- Generate menyimpan metadata dan `report_snapshot` pada `generated_reports`; endpoint unduh mengautorisasi ulang pengguna dan merender PDF langsung dari snapshot tanpa file permanen.
- Rentang tanpa setoran aktif ditolak dengan pesan jelas. Seed demo membuat satu laporan contoh idempoten untuk Rayyan.
- Laporan kini memiliki checkpoint `issuedAt`, versi, status `ISSUED`/`SUPERSEDED`, dan relasi pengganti. Periode laporan berbeda dari tanggal penerbitan; laporan dari periode Ditutup tidak memerlukan reopen.
- Penerbitan versi pembaruan harus dipilih eksplisit. Unduhan ulang laporan berlaku tidak membuat snapshot baru; versi lama tetap dapat diunduh dari snapshotnya.

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

Status implementasi per 26 Juli 2026:
- Pembatasan login selesai: lima kegagalan pada email yang sama dalam 15 menit mengunci percobaan selama 15 menit. Kunci disimpan dengan hash HMAC email, tidak menyimpan email mentah percobaan gagal, dan dihapus setelah login berhasil.
- Migrasi `20260726010000_add_login_throttles` telah diterapkan pada MySQL lokal. Test policy mencakup penguncian, reset jendela waktu, dan berakhirnya waktu kunci.
- Backup dan restore diuji pada 26 Juli 2026: dump MySQL dibuat melalui `npm run db:backup`, lalu dipulihkan ke database pemeriksaan baru melalui `npm run db:restore -- ... --confirm-restore`. Database aplikasi tidak disentuh; hasil pemeriksaan memuat 1 organisasi, 2 pengguna, 8 setoran, dan 1 laporan.
- Panduan pelaksanaan pilot, skenario uji per role, target mobile, dan format log temuan tersedia di `PILOT_GUIDE.md`.
- Sisa Slice 7 adalah pelaksanaan kesiapan operasional: uji pilot mobile dengan Pengajar, data pilot yang disetujui yayasan, serta konfigurasi deployment dan perlindungan berbasis IP/WAF bila aplikasi dibuka ke internet.

### Backlog Pasca-MVP — Rapor Pencapaian dan Administrasi
Status: belum dijadwalkan. Mulai hanya setelah Slice 7 selesai, hasil pilot stabil, dan keputusan bisnis di bawah disetujui. Backlog ini tidak memperluas MVP yang sedang berjalan.

Urutan yang direkomendasikan:
1. Discovery rapor akademik: putuskan apakah kelas berbeda dari halaqah, sumber data Tilawati/Tahsin, catatan periode, kalender hari efektif, rumus target hafalan, dan ambang predikat. Validasi pula penyebut Sabqi/Manzil, bukan mengasumsikan 31 hari untuk semua periode.
2. Vertical slice rapor akademik lanjutan: simpan data sumber yang disetujui, hitung persentase di server, tampilkan pada pratinjau, dan bekukan hasilnya dalam snapshot laporan versi baru.
3. Discovery absensi: definisi hadir/izin/sakit/alpa, pelaku input, kalender, serta formula persentase. Absensi memerlukan domain dan audit tersendiri sebelum masuk laporan.
4. Discovery administrasi infaq: tetapkan integrasi baca dengan aplikasi eksternal atau modul keuangan internal. Modul internal membutuhkan authorization keuangan, audit mutasi, rekonsiliasi, dan kebijakan data sebelum development.

Kandidat informasi rapor pasca-MVP:
- NIS, nama santri, kelas, Tilawati/Tahsin bulanan, target hafalan, Sabqi, Manzil, catatan wali kelas/Pengajar, dan persentase kehadiran.
- Informasi administrasi hanya setelah scope keuangan disetujui: SPP dan potongan, Kencleng Subuh, Infaq Program, tanggal input, dan metode pembayaran.

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
