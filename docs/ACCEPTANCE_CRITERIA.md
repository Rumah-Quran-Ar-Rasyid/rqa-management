# MVP Acceptance Criteria

## Login
- Akun aktif dengan kredensial benar dapat login dan diarahkan sesuai role.
- Akun nonaktif ditolak.

## Pengguna dan Role
- Seed pertama membuat satu akun awal dengan role `ADMIN` + `HEAD`.
- Admin dapat membuat user operasional.
- Admin dapat assign/revoke role `TEACHER`.
- Admin tidak dapat assign/revoke role `ADMIN` atau `HEAD`.
- Kepala dapat assign/revoke role `ADMIN` dan `HEAD`.
- Role `HEAD` terakhir tidak dapat dicabut.
- Pengguna aktif terakhir dengan role `HEAD` tidak dapat dinonaktifkan.
- Perubahan role `ADMIN` dan `HEAD` masuk audit operasional.

```gherkin
Given hanya ada satu pengguna aktif dengan role HEAD
When pengguna mencoba mencabut role HEAD dari pengguna tersebut
Then sistem menolak permintaan
```

```gherkin
Given pengguna hanya memiliki role ADMIN
When pengguna mencoba assign role HEAD
Then sistem menolak permintaan
```

## Santri dan Halaqah
- Admin dapat membuat santri dengan nomor unik.
- Admin dapat membuat halaqah, menetapkan pengajar, dan memasukkan santri.
- Pengajar hanya melihat halaqah yang diampu.
- Akses langsung ke halaqah lain ditolak di server.
- Satu santri tidak dapat memiliki dua membership halaqah aktif pada waktu yang sama.
- Satu halaqah tidak dapat memiliki dua pengajar `PRIMARY` aktif pada waktu yang sama.

## Setoran
Given pengajar login dan mengampu halaqah santri, ketika kategori, satu surah, rentang ayat, dan kelancaran valid disimpan, maka setoran muncul pada riwayat dan dashboard kepala.

- Kategori wajib.
- Kelancaran wajib.
- Ayat di luar batas surah ditolak.
- Satu setoran hanya mendukung satu surah.
- Jika pengajar perlu mencatat dua surah, pengajar membuat dua record setoran terpisah.
- Pengajar tidak dapat mencatat santri halaqah lain.
- Identitas pembuat dan waktu tersimpan.
- Setoran pada periode `CLOSED` ditolak untuk semua role.
- Setoran berpotensi duplikat hanya dapat disimpan jika pengguna mengonfirmasi dan mengisi alasan override.

Contoh:

```gherkin
Given pengajar memilih Surah An-Naba
When pengajar memasukkan ayat 1 sampai 20
Then sistem memvalidasi kedua ayat terhadap Surah An-Naba
```

```gherkin
Given sistem menemukan setoran yang berpotensi duplikat
When pengajar memilih tetap menyimpan
And tidak memberikan alasan
Then sistem menolak penyimpanan
```

## Riwayat dan Koreksi
- Riwayat diurutkan terbaru dan dapat difilter.
- Pengajar dapat mengoreksi miliknya dalam 24 jam dengan alasan.
- Setelah 24 jam, perubahan pengajar ditolak.
- Kepala dapat mengoreksi dengan alasan.
- Admin dapat mengoreksi hanya jika akun juga memiliki role `HEAD`.
- Koreksi pada periode `CLOSED` ditolak untuk semua role.
- Audit menyimpan data sebelum dan sesudah.
- Koreksi memperbarui record yang sama dan status tetap `ACTIVE`.

## Void
- Kepala dapat melakukan void setoran dengan alasan.
- Admin dapat melakukan void hanya jika akun juga memiliki role `HEAD`.
- Pengajar tidak dapat melakukan void.
- Void mengubah status record menjadi `VOID`.
- Void masuk audit akademik.
- Data setoran tidak di-hard delete.

## Dashboard
Menampilkan santri/halaqah aktif, setoran hari/minggu, jumlah per kategori, santri perlu perhatian, dan aktivitas terbaru dengan angka yang sesuai data.

Santri perlu perhatian apabila:
- Tidak memiliki setoran selama 7 hari kalender.
- Mendapat predikat `LESS_FLUENT` pada setoran terakhir.

## Laporan
- Kepala/Admin dapat memilih santri dan periode pembelajaran atau rentang tanggal khusus.
- Ada pratinjau.
- PDF memuat identitas, ringkasan, riwayat, catatan, dan tanggal pembuatan.
- PDF dapat didownload dan dicetak.
- Periode tanpa data menampilkan pesan dan tidak otomatis membuat PDF kosong.
- Metadata dan snapshot laporan tersimpan.
- PDF dibuat dari snapshot agar laporan lama tidak berubah ketika data sumber dikoreksi.

## Periode
- Admin dapat membuat dan mengelola periode `PLANNED`/`ACTIVE`.
- Admin tanpa role `HEAD` tidak dapat reopen periode `CLOSED`.
- Kepala dapat menutup dan reopen periode dengan alasan.
- Reopen dan penutupan periode masuk audit operasional.
- Kepala dapat melihat detail audit event periode, termasuk status sebelumnya, status baru, alasan, pelaku, dan waktu.
- Banner tampil selama periode hasil reopen masih aktif.

```gherkin
Given periode berstatus CLOSED
And pengguna hanya memiliki role ADMIN
When pengguna mencoba membuka kembali periode
Then sistem menolak permintaan
```

```gherkin
Given periode berstatus CLOSED
And pengguna memiliki role HEAD
When pengguna memasukkan alasan dan membuka kembali periode
Then status periode menjadi ACTIVE
And event PERIOD_REOPENED tersimpan dalam audit operasional
```

## Audit
- Audit operasional menyimpan perubahan pengguna, role, santri, wali, halaqah, assignment, membership, dan periode.
- Audit akademik menyimpan pembuatan, koreksi, void setoran, perubahan field akademik, dan duplicate override.
- Admin dapat melihat detail audit operasional, tetapi tidak melihat detail akademik sensitif.
- Hak melihat audit operasional tidak memberi Admin hak untuk melakukan semua aksi yang tercatat di audit.
- Admin hanya dapat melihat audit perubahan role `HEAD` secara read-only.
- Kepala dapat melihat detail audit akademik dan event periode yang menjadi kewenangannya.
- Pengajar hanya dapat melihat riwayat perubahan setoran miliknya secara terbatas.

## Mobile Usability
- Nama “Rumah Qur’an Ar-Rasyid” tampil konsisten pada halaman masuk dan kerangka aplikasi.
- Teks antarmuka tidak menampilkan enum, permission, atau identifier teknis secara mentah.
- Form setoran nyaman digunakan pada viewport selebar 360 piksel.
- Field setoran disusun satu kolom pada mobile dengan label yang selalu terlihat.
- Tombol utama memiliki hierarki visual yang jelas dan label aksi yang spesifik, seperti “Simpan Setoran”.
- Target sentuh kontrol utama minimal 44 × 44 piksel.
- Minimal 4 dari 5 pengguna pilot dapat mencatat tanpa bantuan.
- Median input maksimal 90 detik.
- Tidak ada horizontal scroll pada halaman; data tabel tetap dapat dibaca sebagai daftar pada mobile.
- Pesan validasi tampil dekat field terkait, jelas, dan data form tidak hilang.
- Status menyimpan, berhasil, gagal, dan data kosong terlihat jelas.

## Keamanan dan Operasional
- Semua halaman data membutuhkan login.
- Authorization di server.
- Password tidak plaintext.
- Cookie HttpOnly, Secure, SameSite.
- Secret tidak masuk client.
- Backup harian dan prosedur restore tersedia serta diuji.
- Source code tersimpan di repository yayasan.
- Health endpoint tersedia.

## Definition of Done Pilot
Semua alur utama berjalan, lint/typecheck/test kritis lulus, tidak ada bug blocker, pencatatan nyaman di HP, dashboard kepala berfungsi, laporan PDF dapat dibuat, dan backup/restore sudah diuji.
