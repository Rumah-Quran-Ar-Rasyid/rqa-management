# Panduan Pilot Operasional

## Tujuan
Memastikan Rumah Qur'an Ar-Rasyid dapat dipakai dalam alur harian oleh Admin, Kepala, dan Pengajar tanpa menambah scope MVP.

## Peserta dan Batas Data
- 1 Kepala, 1 Admin, 2 Pengajar, 1-2 halaqah, dan 10-20 santri.
- Gunakan data pilot yang telah disetujui yayasan. Jangan menjalankan `db:seed:demo` pada database pilot.
- Wali hanya sebagai kontak; jangan membuat atau membagikan akun wali.
- Jangan mencatat infaq atau absensi dalam aplikasi selama pilot.

## Persiapan
- Catat revision aplikasi, tanggal, fasilitator, dan peserta pilot.
- Jalankan `npm run check`, `npm run build`, `npm run db:migrate:deploy`, serta backup sebelum mulai.
- Buat akun Pengajar dengan kata sandi awal yang aman dan aktifkan satu periode pembelajaran.
- Siapkan minimal satu santri aktif pada tiap halaqah dan assignment Pengajar yang berlaku.

## Skenario Uji

### Admin
1. Buat Pengajar, santri, halaqah, penugasan, dan membership.
2. Pastikan Pengajar hanya dapat melihat halaqah yang diampu.
3. Pastikan Admin tanpa role Kepala tidak dapat mengoreksi/void setoran atau mengelola role Kepala.

### Pengajar
1. Masuk dari ponsel pada lebar layar sekitar 360 piksel.
2. Catat satu setoran Sabaq, Sabqi, dan Manzil pada santri halaqah sendiri.
3. Isi catatan atau target bila relevan, lalu simpan.
4. Uji peringatan duplikasi dengan setoran yang sama; override hanya setelah alasan diisi.
5. Buka riwayat dan koreksi setoran milik sendiri dalam batas 24 jam.

Catat waktu dari halaman form dibuka hingga setoran tersimpan. Target median adalah maksimal 90 detik dan minimal 4 dari 5 pengguna dapat menyelesaikan input tanpa bantuan.

### Kepala
1. Buka dashboard, filter periode/halaqah, dan periksa aktivitas serta santri yang perlu perhatian.
2. Koreksi satu setoran dengan alasan, lalu pastikan audit akademik tercatat.
3. Batalkan satu setoran dengan alasan dan pastikan setoran tidak lagi dihitung pada dashboard/laporan.
4. Buat pratinjau laporan, terbitkan PDF, dan unduh/cetaknya.
5. Koreksi data setelah laporan terbit, lalu pastikan laporan lama tetap sama dan versi pembaruan dipilih secara eksplisit.

## Log Temuan
Catat satu baris per temuan:

| Tanggal | Peran | Perangkat | Skenario | Hasil | Dampak | Catatan/Reproduksi |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  | Lulus/Gagal | Blocker/Tinggi/Rendah |  |

Blocker berarti pengguna tidak dapat menyelesaikan alur utama atau ada risiko akses/data. Blocker harus diperbaiki sebelum pilot dilanjutkan.

## Penutupan Pilot
- Rekap median waktu input, jumlah setoran yang berhasil dicatat, dan persentase pengguna yang dapat memakai form tanpa bantuan.
- Tinjau semua temuan Blocker dan Tinggi bersama Kepala/Admin.
- Jalankan backup, restore pemeriksaan, dan catat hasilnya sesuai `OPERATIONS.md`.
- Putuskan apakah MVP siap dipakai lebih luas atau perlu perbaikan terbatas sebelum iterasi berikutnya.
