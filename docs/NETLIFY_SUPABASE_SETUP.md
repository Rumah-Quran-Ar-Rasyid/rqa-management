# Setup Netlify Free dan Supabase PostgreSQL Free

Panduan ini ditujukan untuk operator yang belum berpengalaman DevOps. Gunakan URL `netlify.app` selama pilot; domain berbayar belum diperlukan.

## 1. Buat Supabase

1. Masuk ke Supabase, pilih **New project**, lalu simpan password database di password manager.
2. Buka **Connect** setelah project siap.
3. Salin **Transaction pooler** sebagai `DATABASE_URL`. Tambahkan parameter berikut bila belum tersedia:

```text
sslmode=require&pgbouncer=true&connection_limit=1
```

4. Salin **Direct connection** sebagai `DIRECT_URL` untuk mesin operator. Tambahkan `sslmode=require`.
5. Jangan mengaktifkan Supabase Auth. Jangan menyalin anon key atau service-role key ke aplikasi karena tidak dibutuhkan.

Contoh bentuk URL—jangan menyalin placeholder ini:

```text
DATABASE_URL=postgresql://USER:PASSWORD@POOLER-HOST:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:PASSWORD@DIRECT-HOST:5432/postgres?sslmode=require
```

## 2. Siapkan Database

Di terminal lokal proyek, isi `.env` dengan `DIRECT_URL`, kredensial seed, dan secret. Lalu jalankan:

```bash
npm install
npm run db:validate
npm run db:migrate:deploy
npm run db:seed
```

Jangan jalankan `db:seed:demo` pada Supabase pilot. Siapkan file pilot yang disetujui lalu jalankan dry-run dan apply sesuai `OPERATIONS.md`.

Setup ini mengasumsikan Supabase masih kosong. Ia tidak menyalin data dari MySQL secara otomatis. Jika ada data nyata pada MySQL, jangan lanjut ke seed; minta proses migrasi data terpisah dan rekonsiliasi terlebih dahulu.

## 3. Buat Netlify Site

1. Push revision ke repository Git yayasan.
2. Di Netlify pilih **Add new site → Import an existing project**.
3. Pilih repository dan branch pilot. Build setting dibaca dari `netlify.toml`.
4. Buka **Site configuration → Environment variables**, lalu isi:

| Variable | Isi |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler |
| `AUTH_SECRET` | Secret acak minimal 32 karakter |
| `APP_URL` | URL final `https://...netlify.app` |

5. Jangan isi `DIRECT_URL`, password seed, atau data pilot di Netlify runtime.
6. Jalankan deploy. Setelah nama site diketahui, pastikan `APP_URL` sama persis lalu deploy ulang.

## 4. Verifikasi

- Buka `/api/health`; hasil harus `status: ok` dan tidak memuat database/secret.
- Buka `/app` tanpa login; harus diarahkan ke `/login`.
- Login sebagai Admin, Kepala, dan Pengajar.
- Uji setoran pada ponsel, dashboard, koreksi/void, serta unduh PDF.
- Periksa bahwa cookie production memakai `Secure`, `HttpOnly`, dan `SameSite=Lax`.
- Jalankan `npm run pilot:check` dari mesin operator terhadap database Supabase sebelum keputusan go-live.

## 5. Batas Free Tier

Free tier cocok untuk pilot kecil, bukan jaminan operasional permanen. Kuota, sleep/inactivity, retensi backup, dan kebijakan provider dapat berubah. Simpan backup terenkripsi di luar Supabase, uji restore, dan jangan gunakan data nyata pada deploy preview.
