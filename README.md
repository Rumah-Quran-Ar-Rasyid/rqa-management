# Rumah Qur'an Management

Aplikasi web internal Rumah Qur'an untuk mencatat dan memonitor setoran hafalan santri.

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

## Getting Started

Jalankan development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Quality Gate

Sebelum menyelesaikan task implementasi, jalankan lint, typecheck, dan test sesuai script proyek.

## Learn More

Referensi framework:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
