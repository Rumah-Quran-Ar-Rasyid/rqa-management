# User Flows

## 1. Admin Menyiapkan Data
Admin login → membuat pengajar → membuat santri → mencatat wali → membuat halaqah → menetapkan pengajar → memasukkan santri → mengaktifkan periode.

Aturan:
- Satu pengajar dapat mengampu beberapa halaqah.
- Satu halaqah dapat memiliki pengajar utama dan pendamping.
- Satu wali dapat memiliki beberapa anak.
- Santri dapat pindah halaqah tanpa kehilangan histori.

## 2. Pengajar Mencatat Setoran
Pengajar login → memilih halaqah → memilih santri → melihat setoran terakhir → memilih kategori → memilih surah/ayat → memilih kelancaran → menulis catatan/target opsional → konfirmasi → simpan.

Hasil:
- Masuk ke riwayat santri.
- Terlihat oleh kepala.
- Dapat masuk ke laporan wali.

## 3. Pengajar Melihat Riwayat
Pengajar login → halaqah → santri → riwayat → filter periode/kategori → detail.

## 4. Kepala Monitoring
Kepala login → dashboard → pilih periode/halaqah → lihat aktivitas → lihat santri yang perlu perhatian → buka detail santri.

Dashboard awal:
- Santri dan halaqah aktif.
- Setoran hari ini/minggu ini.
- Jumlah Sabaq, Sabqi, Manzil.
- Santri tanpa setoran pada periode tertentu.
- Santri dengan predikat Kurang Lancar.
- Aktivitas terbaru.

## 5. Koreksi Setoran
Pengajar/kepala membuka setoran → Koreksi → ubah data → isi alasan → simpan → sistem menyimpan audit sebelum/sesudah.

## 6. Generate Laporan
Admin/kepala → pilih santri → pilih periode → pratinjau → generate PDF → download atau print.

Isi laporan:
- Identitas yayasan, santri, halaqah, pengajar, dan periode.
- Ringkasan Sabaq, Sabqi, Manzil.
- Ringkasan kelancaran.
- Riwayat setoran dan catatan.
- Tanggal pembuatan dan kolom tanda tangan jika diperlukan.

## 7. Pindah Halaqah
Admin menutup membership lama → membuat membership baru → histori setoran lama tetap terkait dengan halaqah dan pengajar sebelumnya.
