# Operasional Pilot

## Arsitektur Deployment
Pilot memakai Netlify Free untuk aplikasi Next.js dan Supabase PostgreSQL Free untuk database. Domain awal memakai alamat `*.netlify.app` dengan HTTPS otomatis. Supabase hanya dipakai sebagai PostgreSQL terkelola; autentikasi, session cookie, role, authorization, dan audit tetap berada di aplikasi.

Aplikasi pilot tidak diindeks mesin pencari. `robots.txt`, metadata halaman, dan header Netlify mengirim instruksi `noindex, nofollow`. Ini bukan pengganti authentication atau pembatasan akses jaringan.

Pisahkan koneksi database:

- `DATABASE_URL`: URL Supabase transaction pooler untuk runtime Netlify. Gunakan port pooler yang diberikan Supabase dan parameter `sslmode=require`, `pgbouncer=true`, serta `connection_limit=1`.
- `DIRECT_URL`: direct connection Supabase untuk migrasi, seed, backup, restore, dan preflight dari mesin terpercaya. Jangan menjalankan migrasi dari request aplikasi.
- `AUTH_SECRET`: secret acak minimal 32 karakter.
- `APP_URL`: URL production Netlify, misalnya `https://rumah-quran-ar-rasyid.netlify.app`.

Tidak ada variable di atas yang boleh memakai prefix `NEXT_PUBLIC_`. Jangan mengaktifkan Supabase Auth, membuat tabel session terpisah, atau memindahkan authorization ke client.

## Membuat Supabase Project

1. Buat project Supabase pada region terdekat dengan mayoritas pengguna.
2. Dari Connect, salin transaction pooler ke `DATABASE_URL` dan direct connection ke `DIRECT_URL`.
3. Jika direct IPv6 tidak dapat dijangkau dari jaringan lokal, jalankan tooling melalui environment CI yang mendukungnya atau gunakan session pooler khusus tooling. Pastikan URL tooling tidak memakai transaction mode untuk `pg_dump` atau migrasi.
4. Simpan semua secret di password manager yayasan dan Netlify environment variables.
5. Terapkan migrasi dan seed dari mesin terpercaya:

```bash
npm run db:migrate:deploy
npm run db:seed
```

Baseline PostgreSQL ditujukan untuk database Supabase baru. Repository tidak memindahkan row dari instalasi MySQL lama secara otomatis. Jika suatu instalasi MySQL sudah memuat data nyata, hentikan proses, backup sumber, dan lakukan migrasi data terpisah dengan rekonsiliasi jumlah record serta audit sebelum mengalihkan aplikasi. Database lokal sebelum perubahan hanya berisi data pengembangan; jangan menganggap schema migration sebagai data migration lintas engine.

## Membuat Netlify Site

1. Hubungkan repository Git ke Netlify dan pilih branch pilot.
2. Netlify membaca `netlify.toml`; build command adalah `npm run build`.
3. Isi `DATABASE_URL`, `AUTH_SECRET`, dan `APP_URL` pada production context. `DIRECT_URL` tidak diperlukan oleh runtime dan sebaiknya tidak disimpan di Netlify kecuali ada job operasional yang memang membutuhkannya.
4. Deploy, lalu periksa `/api/health`, login, setoran, dashboard, dan unduhan PDF pada URL `netlify.app`.
5. Matikan deploy preview untuk data nyata atau beri preview database terpisah. Jangan menghubungkan preview branch ke database pilot.

Release database dilakukan sebelum deploy aplikasi yang membutuhkannya. Rollback aplikasi dilakukan dari Netlify Deploys ke revision sebelumnya. Migrasi database tidak di-rollback otomatis; buat backup sebelum migrasi dan lakukan perbaikan maju bila memungkinkan.

## Kontrak Kesiapan

Revision hanya boleh dipromosikan setelah perintah berikut lulus terhadap database target:

```bash
npm run pilot:check
```

Perintah menjalankan lint, typecheck, test, build produksi, status migrasi melalui `DIRECT_URL`, pemeriksaan data minimum, serta smoke HTTP dan viewport 360 piksel. Data minimum adalah tepat satu organisasi aktif, minimal satu Kepala aktif, satu Admin aktif, dua Pengajar aktif, satu periode aktif, 1–2 halaqah, 10–20 santri, assignment, membership, dan 114 surah.

## Menyiapkan Data Pilot

1. Jalankan seed dasar untuk role, master surah, organisasi, dan akun awal.
2. Salin `prisma/pilot-data.example.json` ke lokasi aman di luar repository.
3. Simpan password awal pada environment variable yang dirujuk `passwordEnv`; jangan tulis password ke JSON.
4. Jalankan dry-run lalu apply:

```bash
npm run db:seed:pilot -- --file /lokasi/aman/pilot-data.json
npm run db:seed:pilot -- --file /lokasi/aman/pilot-data.json --apply
```

Seed pilot memakai `DIRECT_URL`, idempotent berdasarkan email/nama halaqah/nomor santri, tidak menghapus data, dan menolak apply setelah ada setoran atau laporan. Untuk koneksi Supabase yang memiliki latensi lebih tinggi, seluruh transaction interaktif aplikasi diberi batas tunggu 10 detik dan batas eksekusi 30 detik; aturan atomik serta audit tetap berlaku.

## Backup PostgreSQL

Prasyarat lokal adalah PostgreSQL client dengan major version sama atau lebih baru dari server. Bila client tidak terpasang, script memakai image `postgres:17-alpine` melalui Docker. Jalankan:

```bash
npm run db:backup
```

Script menggunakan `DIRECT_URL`, `pg_dump --format=custom`, memvalidasi hasil dengan `pg_restore --list`, dan membuat checksum SHA-256 di `backups/`. Simpan salinan terenkripsi di luar Supabase/mesin operator. Free tier tidak boleh dianggap sebagai satu-satunya backup.

## Uji Restore

Restore hanya menerima `--target-url` database atau project pemeriksaan kosong yang berbeda dari `DIRECT_URL` sumber:

```bash
npm run db:restore -- backups/rqa-YYYYMMDD-HHMMSS.dump \
  --target-url "$RESTORE_DATABASE_URL" \
  --confirm-restore

npm run db:verify-restore -- --target-url "$RESTORE_DATABASE_URL"
```

Script menolak URL target yang sama, memverifikasi checksum, dan memakai `pg_restore --clean --if-exists` hanya pada database pemeriksaan yang diberikan eksplisit. Jangan gunakan URL database pilot sebagai target restore.

## Checklist Pilot

- Backup sebelum migrasi atau perubahan data penting.
- Jalankan migrasi, seed pilot, lalu `npm run pilot:check`.
- Pastikan Netlify production memakai URL pooler dan tidak memiliki `DIRECT_URL` tanpa kebutuhan.
- Uji login setiap role, input dari ponsel, koreksi/void, dashboard, dan PDF.
- Uji restore berkala ke project/database pemeriksaan.
- Catat revision, URL deployment, hasil preflight, backup, restore, dan keputusan go/no-go.

## Checklist Release Netlify

- `npm run release:check` lulus dengan `DIRECT_URL` database target.
- Backup custom PostgreSQL dan checksum tersimpan di luar mesin operator.
- Migrasi diterapkan sebelum deploy aplikasi yang membutuhkannya.
- Netlify production hanya memiliki `DATABASE_URL`, `AUTH_SECRET`, dan `APP_URL`; tidak ada password seed atau `DIRECT_URL` tanpa alasan operasional.
- Deploy preview tidak terhubung ke database pilot.
- Setelah deploy: health, redirect tanpa session, login tiga role, setoran, dashboard, dan PDF lulus.
- Bila aplikasi bermasalah, rollback deploy Netlify. Jangan rollback migration dengan menghapus tabel; gunakan perbaikan maju atau prosedur restore yang disetujui.
