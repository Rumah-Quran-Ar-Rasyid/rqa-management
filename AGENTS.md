# Project Instructions for Coding Agents

## Context
Aplikasi ini digunakan Rumah Qur'an untuk mencatat dan memonitor setoran hafalan santri.

Selalu baca seluruh file di folder `docs/` sebelum mengubah kode.

## MVP Scope
- Pengguna: Admin, Kepala, Pengajar.
- Data santri, wali sebagai kontak, pengajar, halaqah, dan periode.
- Pencatatan Sabaq, Sabqi, dan Manzil.
- Predikat Lancar, Cukup Lancar, dan Kurang Lancar.
- Riwayat setoran, dashboard kepala, dan laporan PDF.
- Wali belum memiliki akun login.
- Infaq tetap memakai aplikasi eksternal.

## Architecture
- Satu aplikasi Next.js full-stack.
- Modular monolith.
- Database access hanya di server.
- Authorization diperiksa di server.
- Jangan membuat microservices atau menambah infrastruktur tanpa kebutuhan nyata.

## Engineering Rules
- TypeScript strict mode.
- Validasi input menggunakan Zod.
- Jangan mengekspos secret ke client.
- Hindari `any`.
- Gunakan audit untuk perubahan setoran.
- Gunakan status/arsip, bukan hard delete.
- Tambahkan test untuk authorization dan business rule penting.
- Jalankan lint, typecheck, dan test sebelum menyelesaikan task.

## Out of Scope
Jangan membuat login wali, portal wali, absensi, infaq internal, WhatsApp otomatis, payment gateway, aplikasi native, fitur AI, audio recording, microservices, atau Kubernetes.

## Working Method
Sebelum coding: baca konteks, tulis asumsi, file terdampak, dan rencana kecil.
Setelah coding: ringkas perubahan, test yang dijalankan, hasil lint/typecheck, dan risiko tersisa.
