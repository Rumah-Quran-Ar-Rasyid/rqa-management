# Rumah Qur’an Ar-Rasyid

Aplikasi web internal Rumah Qur’an Ar-Rasyid untuk mencatat dan memonitor setoran hafalan santri.

MVP fokus pada:
- Login untuk Admin, Kepala, dan Pengajar.
- Data santri, wali sebagai kontak, pengajar, halaqah, dan periode.
- Pencatatan Sabaq, Sabqi, dan Manzil.
- Predikat Lancar, Cukup Lancar, dan Kurang Lancar.
- Riwayat setoran, koreksi dengan audit, dashboard kepala, dan laporan PDF/cetak.

Di luar scope MVP: login wali, portal wali, absensi, infaq internal, WhatsApp/email otomatis, payment gateway, aplikasi native, AI, audio recording, microservices, dan Kubernetes.

Kandidat setelah MVP stabil dan pilot selesai dicatat di [docs/PRODUCT.md](./docs/PRODUCT.md) dan [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md). Kandidat tersebut mencakup rapor pencapaian akademik yang lebih lengkap, absensi, dan evaluasi integrasi administrasi infaq; semuanya tetap di luar scope MVP sampai keputusan bisnis baru disetujui.

## Dokumentasi

Sebelum mengubah kode, baca:
- [AGENTS.md](./AGENTS.md)
- Semua file Markdown di [docs/](./docs)

Dokumentasi utama:
- [docs/PRODUCT.md](./docs/PRODUCT.md): tujuan, pengguna, scope, dan indikator keberhasilan.
- [docs/PERMISSIONS.md](./docs/PERMISSIONS.md): role, permission, audit access, dan authorization rules.
- [docs/DATA_MODEL.md](./docs/DATA_MODEL.md): struktur data awal dan constraint penting.
- [docs/MEMORIZATION_RULES.md](./docs/MEMORIZATION_RULES.md): aturan setoran, koreksi, void, duplikasi, periode, dan laporan.
- [docs/USER_FLOWS.md](./docs/USER_FLOWS.md): alur utama pengguna.
- [docs/ACCEPTANCE_CRITERIA.md](./docs/ACCEPTANCE_CRITERIA.md): kriteria MVP dianggap selesai.
- [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md): rencana vertical slice.
- [docs/OPERATIONS.md](./docs/OPERATIONS.md): backup, restore aman, dan checklist pilot.

Setiap perubahan requirement, business rule, authorization, data model, atau rencana implementasi harus memperbarui dokumen terkait sebelum atau bersama perubahan kode.

## Keputusan MVP yang Dikunci

- Admin mengelola data operasional, bukan penilaian hafalan.
- Kepala memegang otorisasi akademik seperti koreksi/void setoran dan reopen periode.
- Hak melihat audit dipisahkan dari hak melakukan aksi yang tercatat di audit.
- Role Kepala hanya dapat dikelola oleh pengguna aktif yang sudah memiliki role Kepala.
- Sistem wajib menjaga minimal satu pengguna aktif dengan role Kepala.
- Wali hanya kontak dan tidak memiliki akun login.
- Setiap organisasi hanya memiliki satu periode pembelajaran aktif pada satu waktu.
- Halaqah dikelola Admin dengan status Aktif, Nonaktif, atau Diarsipkan; tidak ada hard delete.
- Santri dapat dicatat dengan satu kontak wali utama opsional; wali tidak memiliki akun login.
- Penugasan Pengajar hanya dibuat pada halaqah aktif untuk akun Pengajar aktif; penugasan Pengganti memiliki tanggal selesai dan tidak ada hard delete.
- Membership santri hanya dibuat pada santri dan halaqah aktif; perpindahan menutup membership lama sehari sebelum penempatan baru tanpa menghapus riwayat.
- Satu record setoran hanya mencakup satu surah.
- PDF laporan dibuat dari snapshot data laporan, bukan file permanen.
- Snapshot laporan adalah checkpoint penerbitan resmi; periode laporan dan tanggal terbit disimpan terpisah, sedangkan versi lama tetap konsisten ketika ada pembaruan.

## Prinsip Antarmuka

- Nama yang tampil kepada pengguna adalah “Rumah Qur’an Ar-Rasyid”.
- Antarmuka memakai Bahasa Indonesia dan istilah kegiatan Rumah Qur’an, bukan enum atau permission teknis.
- Form setoran dibuat mobile-first, cepat, konsisten, dan memiliki tombol utama yang jelas.
- `shadcn/ui` boleh digunakan secara minimal. Komponen ditambahkan hanya ketika dibutuhkan oleh slice aktif.

## Getting Started

Prasyarat lokal:

- Node.js 20.19 atau lebih baru.
- OrbStack/Docker dengan Docker Compose.

Salin `.env.example` menjadi `.env`, lalu isi koneksi database, secret aplikasi, dan kredensial seed awal. Password seed minimal 12 karakter dan tidak memiliki nilai bawaan.

Siapkan database:

```bash
npm install
docker compose up -d
docker compose ps
npm run db:validate
npm run db:migrate:deploy
npm run db:seed
```

Container lokal memakai MySQL 8.4 pada `127.0.0.1:3306` dan menyimpan data pada Docker volume agar tetap tersedia setelah container dihentikan.

Jalankan aplikasi:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Endpoint health tersedia di [http://localhost:3000/api/health](http://localhost:3000/api/health).

Setelah seed, akun awal dapat masuk menggunakan nilai `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` dari `.env`. Akun tersebut memiliki akses Admin + Kepala. Wali tidak memiliki akun login.

Menjalankan `npm run db:seed` ulang akan menyelaraskan nama, status, dan password akun awal dengan nilai seed saat ini tanpa menghapus data operasional. Session aktif akun awal akan dicabut agar password baru langsung berlaku.

## Data Demo Lokal

Setelah `npm run db:seed`, isi data demo lokal dengan:

```bash
npm run db:seed:demo
```

Script ini dapat dijalankan ulang tanpa menghapus data. Script membuat akun Pengajar demo, dua halaqah, enam santri, periode aktif bila belum ada, penugasan, membership, empat setoran contoh beserta auditnya, dan satu snapshot laporan demo untuk Rayyan. Default akun demo adalah `pengajar.demo@rqa.local` dengan password `demo-pengajar-2026`; keduanya dapat diubah melalui `.env`.

Jangan jalankan seed demo pada database pilot atau produksi.

Status pengembangan saat ini: Slice 0-6 telah tersedia. Artefak repository Slice 7 mencakup seed pilot tervalidasi, preflight readiness, smoke test mobile 360 piksel, verifikasi restore, deployment satu container, dan runbook. Uji pengguna nyata, data pilot yang disetujui, serta proteksi jaringan tetap harus diselesaikan pada lingkungan yayasan sesuai [docs/OPERATIONS.md](./docs/OPERATIONS.md) dan [docs/PILOT_GUIDE.md](./docs/PILOT_GUIDE.md).

## Quality Gate

Sebelum menyelesaikan task implementasi:

```bash
npm run check
npm run build
```

Untuk calon revision pilot, gunakan quality gate lengkap berikut setelah migrasi dan data pilot disiapkan:

```bash
npm run pilot:check
```

## Learn More

Referensi framework:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
