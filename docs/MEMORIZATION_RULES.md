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
- Satu surah dan ayat awal/akhir.
- Predikat kelancaran.

## Field Opsional
- Catatan pengajar.
- Target berikutnya.
- Halaman mushaf.

## Validasi
- Surah berasal dari master data.
- Satu record setoran hanya dapat mencakup satu surah.
- Jika satu sesi setoran mencakup beberapa surah, setiap surah dicatat sebagai record terpisah.
- Ayat awal minimal 1.
- Ayat akhir tidak boleh melebihi jumlah ayat pada surah.
- Rentang akhir tidak boleh sebelum rentang awal.
- Pengajar hanya mencatat santri halaqahnya.
- Santri/halaqah nonaktif tidak menerima setoran baru.
- Periode `CLOSED` tidak menerima setoran baru atau koreksi untuk semua role.
- Jika perlu memasukkan atau mengoreksi data lama, Kepala harus reopen periode dengan alasan, melakukan perubahan, lalu menutup kembali periode.

## Duplikasi
Berikan peringatan untuk kombinasi santri + tanggal + kategori + surah + ayat awal + ayat akhir yang sama.

Aturan:
- Pengajar boleh melanjutkan setelah mencentang konfirmasi dan mengisi alasan singkat.
- `duplicate_override` disimpan pada record.
- `duplicate_override_reason` wajib jika override dilakukan.
- `duplicate_reference_record_id` disimpan jika record pembanding tersedia.
- Tidak perlu approval Kepala pada MVP.

## Koreksi
- Pengajar dapat mengoreksi setoran miliknya maksimal 24 jam.
- Setelah itu hanya Kepala berwenang.
- Alasan wajib.
- Data sebelum/sesudah disimpan.
- Koreksi memperbarui record yang sama dan dicatat sebagai audit action `UPDATE`.
- Tidak ada hard delete.

## Void
- Hanya Kepala yang dapat melakukan void setoran dengan alasan.
- Void mengubah status record menjadi `VOID` dan dicatat sebagai audit action `VOID`.
- Admin dapat melakukan void hanya jika akun juga memiliki role `HEAD`.
- Pengajar tidak dapat melakukan void.

Status record: `ACTIVE`, `VOID`.

## Perlu Perhatian
Santri masuk daftar perlu perhatian jika:
- Tidak memiliki setoran selama 7 hari kalender.
- Predikat pada setoran terakhir adalah `LESS_FLUENT`.

## Periode Pembelajaran
Setiap organisasi hanya memiliki satu periode `ACTIVE` pada satu waktu.

Periode yang sudah `CLOSED` tidak dapat menerima setoran baru atau koreksi.

Hanya pengguna dengan role `HEAD` yang dapat membuka kembali periode `CLOSED`.

Reopen periode wajib menyertakan alasan.

Setiap perubahan status periode wajib masuk ke audit operasional.

Event `PERIOD_REOPENED` dan `PERIOD_CLOSED` dapat dilihat secara detail oleh Kepala.

## Catatan untuk Laporan
Gunakan bahasa santun, tidak membandingkan santri, tidak memuat data sensitif, dan fokus pada perkembangan serta tindak lanjut.

## Laporan
Dapat dibuat dari preset periode pembelajaran atau rentang tanggal khusus. Secara internal laporan memakai `period_start` dan `period_end`.

PDF dibuat dari snapshot laporan. Jika data dikoreksi, laporan lama tidak berubah otomatis dan laporan baru perlu dibuat ulang.
