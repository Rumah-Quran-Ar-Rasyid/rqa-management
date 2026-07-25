# Roles and Permissions

## Role
- `ADMIN`
- `HEAD`
- `TEACHER`

Satu pengguna dapat memiliki lebih dari satu role.

Prinsip role:
- `ADMIN`: mengelola data operasional, bukan penilaian hafalan.
- `HEAD`: monitoring dan otorisasi akademik.
- `TEACHER`: pencatatan hafalan pada halaqah yang diampu.

Jika satu orang menjalankan administrasi dan fungsi kepala, berikan dua role: `ADMIN` + `HEAD`.

Permission teknis harus memisahkan hak melihat audit dari hak melakukan aksi. Contoh:
- `VIEW_OPERATIONAL_AUDIT`
- `VIEW_ACADEMIC_AUDIT`
- `MANAGE_USER`
- `MANAGE_TEACHER_ROLE`
- `MANAGE_ADMIN_ROLE`
- `MANAGE_HEAD_ROLE`
- `MANAGE_ACADEMIC_PERIOD`
- `CLOSE_ACADEMIC_PERIOD`
- `REOPEN_ACADEMIC_PERIOD`
- `VIEW_HALAQAH`
- `MANAGE_HALAQAH`
- `VIEW_STUDENT`
- `MANAGE_STUDENT`
- `VIEW_TEACHER_ASSIGNMENT`
- `MANAGE_TEACHER_ASSIGNMENT`
- `VIEW_HALAQAH_MEMBERSHIP`
- `MANAGE_HALAQAH_MEMBERSHIP`
- `CREATE_MEMORIZATION_RECORD`

## Matriks Hak Akses
| Aktivitas | Admin | Kepala | Pengajar |
|---|---:|---:|---:|
| Login | Ya | Ya | Ya |
| Dashboard keseluruhan | Ringkasan operasional | Ya | Tidak |
| Membuat user operasional | Ya | Tidak | Tidak |
| Assign/revoke role `TEACHER` | Ya | Tidak | Tidak |
| Assign/revoke role `ADMIN` | Tidak | Ya | Tidak |
| Assign/revoke role `HEAD` | Tidak | Ya | Tidak |
| Kelola santri/wali | Ya | Lihat | Tidak |
| Kelola halaqah | Ya | Lihat | Tidak |
| Kelola periode PLANNED/ACTIVE | Ya | Lihat | Tidak |
| Tutup periode | Tidak | Ya dengan alasan | Tidak |
| Reopen periode CLOSED | Tidak | Ya dengan alasan | Tidak |
| Assignment pengajar | Ya | Lihat | Tidak |
| Membership santri | Ya | Lihat | Tidak |
| Lihat seluruh halaqah | Ya | Ya | Tidak |
| Lihat halaqah yang diampu | Ya | Ya | Ya |
| Input setoran | Tidak | Tidak | Halaqahnya |
| Lihat riwayat | Semua | Semua | Halaqahnya |
| Koreksi setoran | Tidak | Ya dengan alasan | Miliknya dalam 24 jam |
| Void setoran | Tidak | Ya dengan alasan | Tidak |
| Generate laporan | Ya | Ya | Tidak |
| Audit operasional | Detail | Ringkasan | Tidak |
| Audit akademik | Tidak melihat detail sensitif | Detail | Terbatas pada miliknya |
| Export seluruh data | Tidak pada MVP | Tidak pada MVP | Tidak |

Catatan:
- Hak melihat audit tidak berarti hak melakukan seluruh aksi yang tercatat di audit.
- Admin boleh membuat dan mengelola pengguna operasional, tetapi tidak boleh assign, revoke, atau mengubah role `HEAD`.
- Role `HEAD` hanya dapat diberikan atau dicabut oleh pengguna aktif yang sudah memiliki role `HEAD`.
- Sistem wajib memiliki minimal satu pengguna aktif dengan role `HEAD`.
- Role `HEAD` terakhir tidak boleh dicabut atau dinonaktifkan.
- Admin tanpa role `HEAD` tidak dapat menonaktifkan pengguna yang masih memiliki role `HEAD` aktif.
- Pengguna tidak dapat mengubah status akunnya sendiri.
- Role hanya dapat diberikan kepada pengguna aktif. Jika role aktif terakhir dicabut dari pengguna, session aktif pengguna tersebut dicabut.
- Seed pertama membuat satu akun awal `ADMIN` + `HEAD`. Setelah itu, pengelolaan role `HEAD` dilakukan oleh pengguna yang sudah memiliki role `HEAD`.
- Admin dapat membuat periode `PLANNED` dan mengaktifkannya jika belum ada periode aktif. Kepala dapat menutup periode aktif atau membuka kembali periode ditutup dengan alasan.
- Admin dapat membuat, mengubah, mengaktifkan, menonaktifkan, atau mengarsipkan halaqah. Kepala hanya melihat daftar halaqah pada tahap ini.
- Halaqah yang diarsipkan tidak dapat diubah atau diaktifkan kembali pada MVP.
- Admin dapat membuat, mengubah, mengaktifkan, menonaktifkan, atau mengarsipkan santri. Kepala hanya melihat daftar santri dan kontak wali utama pada tahap ini.
- Wali adalah kontak tanpa akun login, password, session, atau role.
- Admin dapat membuat penugasan Pengajar pada halaqah aktif dan mengakhiri penugasan yang masih berjalan. Kepala hanya melihat penugasan, kecuali juga memiliki role Admin.
- Admin dapat menempatkan santri aktif pada halaqah aktif serta memindahkannya. Kepala hanya melihat keanggotaan, kecuali juga memiliki role Admin.
- Selama periode `CLOSED`, input setoran dan koreksi ditolak untuk semua role. Kepala harus reopen periode terlebih dahulu dengan alasan.
- Semua tipe assignment pengajar aktif (`PRIMARY`, `ASSISTANT`, `SUBSTITUTE`) boleh mencatat setoran pada halaqah terkait.
- Hak `CREATE_MEMORIZATION_RECORD` hanya dimiliki role Pengajar. Admin dan Kepala tidak dapat mencatat setoran kecuali aturan MVP berubah secara eksplisit.
- Hanya pengajar pembuat setoran yang boleh mengoreksi setoran tersebut dalam batas 24 jam.

## Aturan Authorization
- Akses ditolak secara default.
- Pemeriksaan dilakukan di server, bukan hanya menyembunyikan tombol.
- Halaman data memvalidasi sesi terhadap database pada setiap request.
- Pengajar hanya mengakses halaqah yang ditugaskan kepadanya.
- Santri harus aktif pada halaqah terkait.
- Semua data harus berada pada organisasi yang sama.
- Pengguna nonaktif tidak dapat login.
- Ketika pengguna dinonaktifkan, semua session aktifnya dicabut dalam transaksi yang sama.
- Wali adalah kontak dan tidak memiliki akun login, password, session, atau role.
- Endpoint preview/download PDF harus memeriksa authorization di server.

## Aturan Session
- Session disimpan di database selama tujuh hari dan tidak memakai sliding expiration pada MVP.
- Cookie hanya menyimpan token acak dengan atribut `HttpOnly`, `SameSite=Lax`, `Path=/`, dan `Secure` pada production.
- Database hanya menyimpan hash token berbasis `AUTH_SECRET`; token mentah tidak disimpan.
- Logout mencabut session di database sebelum cookie dihapus.
- Perubahan status pengguna atau organisasi menjadi nonaktif membuat session lama langsung tidak dapat dipakai.
- Login MVP berjalan untuk satu organisasi aktif per instalasi. Jika konfigurasi memiliki nol atau lebih dari satu organisasi aktif, login ditolak agar organisasi tidak dipilih secara ambigu.

## Audit

### Audit Operasional
Mencakup perubahan pengguna, role, data santri, wali, halaqah, assignment pengajar, membership santri, dan periode pembelajaran.

Hak akses:
- Admin: detail audit operasional.
- Kepala: ringkasan audit operasional, detail audit perubahan role `ADMIN`/`HEAD`, dan detail event periode yang menjadi kewenangannya.
- Pengajar: tidak ada.

Admin dapat melihat detail audit operasional untuk kebutuhan administrasi. Namun, Admin tidak boleh assign, revoke, atau mengubah role `HEAD`, dan perubahan role `HEAD` tetap bersifat read-only bagi Admin.

Khusus event periode seperti `PERIOD_CREATED`, `PERIOD_ACTIVATED`, `PERIOD_CLOSED`, dan `PERIOD_REOPENED`, Kepala dapat melihat detail audit karena periode memengaruhi data akademik, setoran, koreksi, dan laporan.

Detail event periode mencakup:
- Status sebelumnya.
- Status baru.
- Alasan perubahan.
- Pengguna yang melakukan.
- Waktu perubahan.

### Audit Akademik
Mencakup pembuatan setoran, koreksi setoran, void setoran, perubahan kategori, surah/ayat, predikat, catatan, target, dan duplicate override.

Hak akses:
- Kepala: detail audit akademik.
- Admin: tidak melihat detail akademik sensitif.
- Pengajar: riwayat perubahan setoran miliknya secara terbatas.
