# Memorization Rules

## Kategori Setoran
- `SABAQ`: Hafalan Baru.
- `SABQI`: Murojaah Baru.
- `MANZIL`: Murojaah Lama.

Setiap setoran wajib memiliki tepat satu kategori.

## Predikat Kelancaran
- `FLUENT`: Lancar.
- `FAIRLY_FLUENT`: Cukup Lancar.
- `LESS_FLUENT`: Kurang Lancar.

Definisi awal:
- Lancar: tanpa atau sedikit bantuan.
- Cukup Lancar: selesai dengan beberapa koreksi/bantuan.
- Kurang Lancar: belum stabil dan perlu diulang.

## Field Wajib
- Santri, halaqah, pengajar, tanggal, periode.
- Kategori.
- Surah awal/akhir dan ayat awal/akhir.
- Predikat kelancaran.

## Field Opsional
- Catatan pengajar.
- Target berikutnya.
- Halaman mushaf.

## Validasi
- Surah berasal dari master data.
- Ayat harus tersedia pada surah.
- Rentang akhir tidak boleh sebelum rentang awal.
- Pengajar hanya mencatat santri halaqahnya.
- Santri/halaqah nonaktif tidak menerima setoran baru.
- Periode tertutup tidak menerima setoran tanpa izin kepala.

## Duplikasi
Berikan peringatan untuk kombinasi santri + tanggal + kategori + rentang yang sama. Pengguna boleh melanjutkan setelah konfirmasi.

## Koreksi
- Pengajar dapat mengoreksi setoran miliknya maksimal 24 jam.
- Setelah itu hanya kepala/admin berwenang.
- Alasan wajib.
- Data sebelum/sesudah disimpan.
- Tidak ada hard delete.

Status record: `ACTIVE`, `CORRECTED`, `VOID`.

## Catatan untuk Laporan
Gunakan bahasa santun, tidak membandingkan santri, tidak memuat data sensitif, dan fokus pada perkembangan serta tindak lanjut.

## Laporan
Dapat dibuat mingguan, bulanan, semester, atau rentang tanggal. PDF adalah snapshot; jika data dikoreksi, laporan perlu dibuat ulang.
