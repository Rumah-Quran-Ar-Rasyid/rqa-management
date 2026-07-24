# Rumah Qur’an Ar-Rasyid

Aplikasi web internal Rumah Qur’an Ar-Rasyid untuk mencatat dan memonitor setoran hafalan santri.

MVP fokus pada:
- Login untuk Admin, Kepala, dan Pengajar.
- Data santri, wali sebagai kontak, pengajar, halaqah, dan periode.
- Pencatatan Sabaq, Sabqi, dan Manzil.
- Predikat Lancar, Cukup Lancar, dan Kurang Lancar.
- Riwayat setoran, koreksi dengan audit, dashboard kepala, dan laporan PDF/cetak.

Di luar scope MVP: login wali, portal wali, absensi, infaq internal, WhatsApp/email otomatis, payment gateway, aplikasi native, AI, audio recording, microservices, dan Kubernetes.

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

Setiap perubahan requirement, business rule, authorization, data model, atau rencana implementasi harus memperbarui dokumen terkait sebelum atau bersama perubahan kode.

## Keputusan MVP yang Dikunci

- Admin mengelola data operasional, bukan penilaian hafalan.
- Kepala memegang otorisasi akademik seperti koreksi/void setoran dan reopen periode.
- Hak melihat audit dipisahkan dari hak melakukan aksi yang tercatat di audit.
- Role Kepala hanya dapat dikelola oleh pengguna aktif yang sudah memiliki role Kepala.
- Sistem wajib menjaga minimal satu pengguna aktif dengan role Kepala.
- Wali hanya kontak dan tidak memiliki akun login.
- Satu record setoran hanya mencakup satu surah.
- PDF laporan dibuat dari snapshot data laporan, bukan file permanen.

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

Status pengembangan saat ini: Slice 0 (fondasi) dan Slice 1 (login, logout, database session, serta proteksi halaman internal) telah tersedia. Urutan berikutnya tetap mengikuti [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md).

## Quality Gate

Sebelum menyelesaikan task implementasi:

```bash
npm run check
npm run build
```

## Learn More

Referensi framework:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
