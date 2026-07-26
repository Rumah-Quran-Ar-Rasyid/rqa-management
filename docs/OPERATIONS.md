# Operasional Pilot

## Kontrak Kesiapan
Revision hanya boleh dipromosikan ke pilot setelah perintah berikut lulus dari root proyek:

```bash
npm run pilot:check
```

Perintah tersebut menjalankan lint, typecheck, seluruh test, build produksi, status migrasi, pemeriksaan data minimum pilot, serta smoke test HTTP dan viewport 360 piksel. Pemeriksaan data minimum memastikan tepat satu organisasi aktif, minimal satu Kepala aktif, satu Admin aktif, dua Pengajar aktif, satu periode aktif yang mencakup tanggal organisasi, 1-2 halaqah aktif, 10-20 santri aktif, dan assignment serta membership yang berlaku. Pemeriksaan ini tidak menggantikan uji pengguna nyata.

## Menyiapkan Data Pilot
1. Jalankan seed dasar dengan `npm run db:seed` untuk role, master surah, organisasi, dan akun awal Kepala/Admin.
2. Salin `prisma/pilot-data.example.json` ke lokasi aman di luar repository, lalu isi hanya data yang telah disetujui yayasan.
3. Simpan kata sandi awal pada environment variable yang dirujuk oleh field `passwordEnv`; jangan menulis kata sandi ke JSON.
4. Jalankan dry-run, periksa ringkasan, lalu terapkan:

```bash
npm run db:seed:pilot -- --file /lokasi/aman/pilot-data.json
npm run db:seed:pilot -- --file /lokasi/aman/pilot-data.json --apply
```

Seed pilot idempotent berdasarkan email, nama halaqah, dan nomor santri. Seed tidak menghapus data, menolak database yang sudah memiliki setoran/laporan, dan hanya ditujukan untuk persiapan awal sebelum pemakaian. Setelah setoran pertama tercatat, perubahan data dilakukan dari aplikasi dan bukan dengan menjalankan seed ulang.

## Deployment Satu Aplikasi
Deployment referensi menggunakan satu container Next.js dan satu MySQL yang dikelola terpisah atau tersedia pada host. Build image:

```bash
docker build -t rqa-management:<revision> .
```

Saat menjalankan container, isi `DATABASE_URL`, `AUTH_SECRET` minimal 32 karakter, `APP_URL` HTTPS publik, `HOSTNAME=0.0.0.0`, dan `PORT=3000`. Terapkan `npm run db:migrate:deploy` sebagai langkah release sebelum mengganti container aplikasi. Jalankan satu replica pada MVP; tidak ada worker, microservice, atau penyimpanan PDF permanen.

Reverse proxy wajib:
- Mengakhiri TLS/HTTPS dan meneruskan header host/protokol yang benar.
- Membatasi akses dengan allowlist IP/VPN atau WAF selama pilot jika aplikasi dibuka ke internet.
- Meneruskan hanya port aplikasi; MySQL tidak diekspos ke internet.
- Memeriksa `GET /api/health` untuk liveness tanpa menganggap endpoint tersebut sebagai readiness database.
- Menyimpan log akses tanpa mencatat cookie, password, atau isi laporan.

Rollback aplikasi dilakukan dengan menjalankan kembali image revision sebelumnya. Migrasi database tidak di-rollback otomatis; buat backup sebelum migrasi dan gunakan prosedur restore yang disetujui bila pemulihan data benar-benar diperlukan.

## Backup MySQL
Jalankan dari root proyek pada mesin yang menjalankan Docker/OrbStack:

```bash
bash scripts/backup-mysql.sh
```

Backup tersimpan terkompresi pada `backups/` atau direktori dari `BACKUP_DIR`. Jalankan minimal harian dan salin hasilnya ke penyimpanan di luar mesin aplikasi. Jangan commit backup ke Git.

Otomasi backup harus menjalankan `npm run db:backup`, memeriksa exit code dan ukuran file, mengenkripsi/menyalin hasil ke penyimpanan di luar host, serta memberi notifikasi bila gagal. Retensi dan akses penyimpanan ditetapkan yayasan. Jangan mengandalkan Docker volume sebagai backup.

## Uji Restore
Restore sengaja hanya diizinkan ke database baru agar tidak menimpa data pilot atau produksi.

```bash
bash scripts/restore-mysql.sh backups/rqa-YYYYMMDD-HHMMSS.sql.gz \
  --database rqa_restore_check \
  --confirm-restore
```

Setelah restore, periksa jumlah organisasi, pengguna, santri, setoran, dan laporan pada database pemeriksaan. Catat tanggal, nama file backup, pelaksana, serta hasil pemeriksaan pada log operasional yayasan. Penggantian database aplikasi produksi dilakukan hanya melalui prosedur deployment yang disetujui, bukan skrip ini.

Gunakan `npm run db:verify-restore -- --database rqa_restore_check` untuk memeriksa tabel penting dan konsistensi dasar pada database hasil restore. Perintah verifikasi bersifat baca-saja, tetapi memakai `MYSQL_ROOT_PASSWORD` karena user aplikasi sengaja tidak diberi akses ke database pemeriksaan.

## Checklist Pilot
- Jalankan `npm run pilot:check` pada revision dan database yang akan dipilotkan.
- Terapkan migrasi dengan `npm run db:migrate:deploy`.
- Buat backup sebelum migrasi atau perubahan data pilot.
- Uji login Admin/Kepala/Pengajar, input setoran di ponsel, koreksi/void, dashboard, dan PDF.
- Uji restore ke database pemeriksaan sebelum pilot dan secara berkala selama pilot.
- Catat revision image, hasil preflight, backup terakhir, uji restore terakhir, dan keputusan go/no-go.
