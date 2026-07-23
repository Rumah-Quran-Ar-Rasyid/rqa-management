# User Flows

## 1. Admin Menyiapkan Data
Admin login → membuat pengajar → membuat santri → mencatat wali → membuat halaqah → menetapkan pengajar → memasukkan santri → mengaktifkan periode.

Aturan:
- Satu pengajar dapat mengampu beberapa halaqah.
- Satu halaqah dapat memiliki pengajar utama dan pendamping.
- Satu wali dapat memiliki beberapa anak.
- Santri dapat pindah halaqah tanpa kehilangan histori.
- Admin mengelola data operasional, bukan mencatat atau mengubah penilaian hafalan.
- Admin dapat membuat user operasional dan mengelola role `TEACHER`.
- Admin tidak dapat assign, revoke, atau mengubah role `HEAD`.
- Jika Admin juga berperan sebagai Kepala, akun diberi role `ADMIN` + `HEAD`.

## 2. Kepala Mengelola Role Penting
Kepala login → membuka pengguna → memilih user → mengubah role `ADMIN` atau `HEAD` → konfirmasi → sistem menyimpan audit operasional.

Aturan:
- Role `HEAD` hanya dapat diberikan atau dicabut oleh pengguna aktif yang sudah memiliki role `HEAD`.
- Sistem wajib memiliki minimal satu pengguna aktif dengan role `HEAD`.
- Role `HEAD` terakhir tidak boleh dicabut atau dinonaktifkan.
- Seed pertama membuat satu akun awal `ADMIN` + `HEAD`; tidak ada menu Super Admin pada MVP.

## 3. Pengajar Mencatat Setoran
Pengajar login → memilih halaqah → memilih santri → melihat setoran terakhir → memilih kategori → memilih satu surah dan rentang ayat → memilih kelancaran → menulis catatan/target opsional → konfirmasi → simpan.

Hasil:
- Masuk ke riwayat santri.
- Terlihat oleh kepala.
- Dapat masuk ke laporan wali.

Jika sistem menemukan setoran berpotensi duplikat, pengajar melihat peringatan. Pengajar boleh tetap menyimpan setelah mencentang konfirmasi dan mengisi alasan singkat.

## 4. Pengajar Melihat Riwayat
Pengajar login → halaqah → santri → riwayat → filter periode/kategori → detail.

## 5. Kepala Monitoring
Kepala login → dashboard → pilih periode/halaqah → lihat aktivitas → lihat santri yang perlu perhatian → buka detail santri.

Dashboard awal:
- Santri dan halaqah aktif.
- Setoran hari ini/minggu ini.
- Jumlah Sabaq, Sabqi, Manzil.
- Santri tanpa setoran selama 7 hari kalender.
- Santri dengan predikat Kurang Lancar pada setoran terakhir.
- Aktivitas terbaru.

## 6. Koreksi Setoran
Pengajar/kepala membuka setoran → Koreksi → ubah data → isi alasan → simpan → sistem menyimpan audit sebelum/sesudah.

Aturan:
- Pengajar hanya dapat mengoreksi setoran miliknya dalam 24 jam berdasarkan timezone organisasi.
- Kepala dapat mengoreksi dengan alasan.
- Periode `CLOSED` menolak koreksi untuk semua role.
- Koreksi memperbarui record yang sama dan menyimpan audit akademik.

## 7. Void Setoran
Kepala membuka setoran → Void → isi alasan → konfirmasi → status setoran menjadi `VOID` → sistem menyimpan audit akademik.

Aturan:
- Admin tidak melakukan void setoran kecuali juga memiliki role `HEAD`.
- Pengajar tidak dapat melakukan void setoran.
- Tidak ada hard delete.

## 8. Reopen Periode
Kepala membuka periode `CLOSED` → Reopen → isi alasan → status menjadi `ACTIVE` → sistem menyimpan audit operasional → banner reopen tampil sampai periode ditutup kembali.

Aturan:
- Admin tanpa role `HEAD` tidak dapat reopen periode.
- Selama periode `CLOSED`, setoran baru dan koreksi ditolak untuk semua role.
- Kepala dapat melihat detail audit event periode: status sebelumnya, status baru, alasan, pelaku, dan waktu.
- Setelah perubahan selesai, Kepala menutup kembali periode dengan audit.

## 9. Generate Laporan
Admin/Kepala → pilih santri → pilih periode pembelajaran atau rentang tanggal khusus → pratinjau → generate PDF dari snapshot → download atau print.

Isi laporan:
- Identitas yayasan, santri, halaqah, pengajar, dan periode.
- Ringkasan Sabaq, Sabqi, Manzil.
- Ringkasan kelancaran.
- Riwayat setoran dan catatan.
- Tanggal pembuatan dan kolom tanda tangan jika diperlukan.

Aturan:
- Default laporan menggunakan periode pembelajaran aktif.
- Secara internal laporan disimpan sebagai `period_start` dan `period_end`.
- Metadata dan snapshot laporan disimpan agar laporan lama tetap konsisten setelah koreksi data.
- PDF dibuat ulang dari snapshot saat diperlukan.

## 10. Pindah Halaqah
Admin menutup membership lama → membuat membership baru → histori setoran lama tetap terkait dengan halaqah dan pengajar sebelumnya.
