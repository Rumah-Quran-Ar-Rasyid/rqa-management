# Initial Data Model

Implementasi awal menggunakan MySQL/MariaDB dengan Prisma ORM v7 dan driver adapter MariaDB. Database access hanya dilakukan dari server.

## Entitas
- Organization
- User dan Role
- User Session
- Student
- Guardian sebagai kontak
- Halaqah
- Teacher Assignment
- Halaqah Membership
- Academic Period
- Quran Surah
- Memorization Record
- Memorization Record Audit
- Operational Audit Log
- Generated Report

## Tabel dan Field Penting

### organizations
`id`, `name`, `slug`, `status`, `timezone`, timestamps.

### users
`id`, `organization_id`, `name`, `email`, `phone`, `password_hash`, `status`, `last_login_at`, timestamps.

Status: `INVITED`, `ACTIVE`, `SUSPENDED`, `INACTIVE`.

### roles / user_roles
Role seed: `ADMIN`, `HEAD`, `TEACHER`.

Aturan:
- Seed pertama membuat satu akun awal `ADMIN` + `HEAD`.
- Admin membuat akun Pengajar baru dalam status `ACTIVE` dengan role `TEACHER` awal.
- Perubahan role `HEAD` adalah aksi sensitif dan harus masuk audit operasional.
- Role `HEAD` hanya dapat diberikan atau dicabut oleh pengguna aktif yang sudah memiliki role `HEAD`.
- Sistem wajib memiliki minimal satu pengguna aktif dengan role `HEAD`.
- Role `HEAD` terakhir tidak boleh dicabut atau dinonaktifkan.
- Admin dapat melihat audit perubahan role `HEAD` secara read-only, tetapi tidak dapat melakukan perubahan role `HEAD`.
- Pengguna tidak dapat mengubah status sendiri. Admin tanpa role `HEAD` juga tidak dapat mengubah status pengguna yang masih memiliki role `HEAD` aktif.

### user_sessions
`id`, `organization_id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`.

Aturan:
- Browser hanya menyimpan token sesi acak; database hanya menyimpan hash HMAC-SHA-256.
- Sesi berlaku tujuh hari dan tidak diperpanjang otomatis pada MVP.
- Logout mengisi `revoked_at` dan menghapus cookie sesi.
- Sesi hanya valid jika belum dicabut, belum kedaluwarsa, organisasi aktif, pengguna aktif, dan pengguna masih memiliki minimal satu role aktif.
- Foreign key pengguna memakai pasangan `user_id` + `organization_id` agar sesi lintas organisasi ditolak database.

### students
`id`, `organization_id`, `student_number`, `full_name`, `preferred_name`, `gender`, `birth_date`, `joined_at`, `status`, timestamps.

Status: `ACTIVE`, `INACTIVE`, `ARCHIVED`.

Aturan:
- Nomor santri unik per organisasi.
- Admin dapat membuat dan mengubah identitas santri, serta mengaktifkan, menonaktifkan, atau mengarsipkan santri.
- Arsip menggantikan penghapusan. Santri `ARCHIVED` tidak dapat diubah atau diaktifkan kembali pada MVP.
- Setiap pembuatan, perubahan detail, dan perubahan status masuk audit operasional.

### guardians
`id`, `organization_id`, `full_name`, `phone`, `email`, `status`, timestamps. Tidak memiliki akun login pada MVP.

Pada potongan awal, form santri dapat mencatat satu wali utama opsional. Wali tambahan, perubahan wali utama, dan penggunaan satu wali untuk beberapa santri akan dilengkapi pada potongan relasi berikutnya.

### student_guardians
`student_id`, `guardian_id`, `relationship`, `is_primary`, `valid_from`, `valid_until`.

Aturan awal:
- Jika wali utama dicatat bersama santri, sistem membuat `guardian` dan `student_guardian` aktif dalam transaksi yang sama.
- Wali utama yang sudah tercatat dapat diperbarui bersama data santri; mengosongkan form wali tidak menghapus relasi yang sudah ada.

### halaqahs
`id`, `organization_id`, `name`, `description`, `status`, timestamps.

Status: `ACTIVE`, `INACTIVE`, `ARCHIVED`.

Aturan:
- Nama halaqah unik per organisasi, termasuk yang sudah diarsipkan.
- Admin membuat halaqah baru dengan status `ACTIVE`, dapat mengubah nama/keterangan, serta mengaktifkan atau menonaktifkan halaqah.
- Arsip menggantikan penghapusan. Halaqah `ARCHIVED` tidak dapat diubah atau diaktifkan kembali pada MVP.
- Setiap pembuatan, perubahan detail, dan perubahan status masuk audit operasional.

### halaqah_teacher_assignments
`halaqah_id`, `teacher_user_id`, `assignment_type`, `valid_from`, `valid_until`.

Assignment: `PRIMARY`, `ASSISTANT`, `SUBSTITUTE`.

Aturan:
- Satu pengajar boleh aktif pada beberapa halaqah.
- Satu halaqah memiliki maksimal satu `PRIMARY` aktif pada waktu yang sama.
- Satu halaqah boleh memiliki beberapa `ASSISTANT`.
- Penugasan hanya dapat dibuat untuk halaqah aktif dan akun Pengajar aktif pada organisasi yang sama.
- `SUBSTITUTE` wajib memiliki `valid_until`; rentang tanggal bersifat inklusif.
- Penugasan yang belum berakhir ditutup dengan mengisi `valid_until`, bukan dihapus.
- Validasi tumpang tindih `PRIMARY` dilakukan dalam transaksi serializable.
- Semua tipe assignment aktif boleh mencatat setoran pada halaqah terkait.

### halaqah_memberships
`halaqah_id`, `student_id`, `valid_from`, `valid_until`, `status`.

Aturan:
- Satu santri hanya boleh memiliki satu membership halaqah aktif pada waktu yang sama.
- Membership hanya dapat dibuat untuk santri aktif dan halaqah aktif dalam organisasi yang sama.
- Rentang tanggal bersifat inklusif. Pindah halaqah dilakukan dalam satu transaksi dengan menutup membership lama sehari sebelum `valid_from` baru, lalu membuat membership baru berstatus aktif.
- Tanggal pindah wajib setelah tanggal mulai membership lama; sistem menolak riwayat yang bertumpang tindih.
- Membership tidak dihapus. Membership lama memakai status `CLOSED` dan menyimpan `valid_until`.
- Histori setoran tetap menyimpan halaqah dan pengajar saat setoran dibuat.

### academic_periods
`organization_id`, `name`, `start_date`, `end_date`, `status`.

Status: `PLANNED`, `ACTIVE`, `CLOSED`.

Aturan:
- Admin dapat mengelola periode `PLANNED`/`ACTIVE`.
- Kepala dapat menutup periode dan reopen periode `CLOSED` dengan alasan.
- Satu organisasi hanya dapat memiliki satu periode `ACTIVE` pada satu waktu. Mengaktifkan atau reopen periode ditolak selama masih ada periode aktif lain.
- Siklus status: `PLANNED` menjadi `ACTIVE` oleh Admin; `ACTIVE` menjadi `CLOSED` oleh Kepala; `CLOSED` hanya dapat kembali menjadi `ACTIVE` oleh Kepala dengan alasan.
- Selama periode `CLOSED`, setoran baru dan koreksi ditolak untuk semua role.
- Reopen dan penutupan periode wajib masuk audit operasional.

### quran_surahs
`surah_number`, `arabic_name`, `latin_name`, `verse_count`.

### memorization_records
`organization_id`, `academic_period_id`, `student_id`, `halaqah_id`, `teacher_user_id`, `submission_date`, `submission_category`, `surah_number`, `start_verse`, `end_verse`, `fluency_predicate`, `teacher_note`, `next_target`, `page_number`, `duplicate_override`, `duplicate_override_reason`, `duplicate_reference_record_id`, `record_status`, snapshot nama santri/halaqah/pengajar/periode, audit timestamps/users.

Category: `SABAQ`, `SABQI`, `MANZIL`.
Fluency: `FLUENT`, `FAIRLY_FLUENT`, `LESS_FLUENT`.
Status: `ACTIVE`, `VOID`.

Aturan:
- Satu record setoran hanya mencakup satu surah.
- Jika satu sesi setoran mencakup beberapa surah, setiap surah dicatat sebagai record terpisah.
- Kombinasi duplikasi: `student_id`, `submission_date`, `submission_category`, `surah_number`, `start_verse`, `end_verse`.
- `duplicate_override = false` berarti `duplicate_override_reason` dan `duplicate_reference_record_id` kosong.
- `duplicate_override = true` berarti alasan wajib; reference record disimpan jika tersedia.
- Setoran baru hanya dibuat oleh Pengajar yang memiliki assignment dan membership santri yang masih berlaku pada tanggal setoran, serta berada dalam periode aktif.
- Tanggal setoran ditentukan server berdasarkan timezone organisasi agar validasi periode dan duplikasi konsisten.
- Pembuatan setoran selalu membuat audit akademik action `CREATE` dalam transaksi yang sama.
- Koreksi memperbarui record yang sama dan menyimpan before/after beserta alasan di audit akademik.
- Void mengubah `record_status` menjadi `VOID`, menyimpan before/after beserta alasan di audit akademik, dan tidak menghapus record.
- Snapshot nama santri, halaqah, pengajar, dan periode disimpan ketika setoran dibuat agar histori tetap dapat dibaca setelah data master berubah.

### memorization_record_audits
`organization_id`, `memorization_record_id`, `action`, `before_data`, `after_data`, `reason`, `performed_by`, `performed_at`.

Action: `CREATE`, `UPDATE`, `VOID`.

Aturan akses audit akademik:
- Kepala melihat detail perubahan before/after.
- Pengajar hanya melihat riwayat terbatas untuk record miliknya.
- Admin tidak melihat audit akademik sensitif.

### operational_audit_logs
`organization_id`, `domain`, `entity_id`, `action`, `before_data`, `after_data`, `reason`, `performed_by`, `performed_at`.

Domain: `USER`, `ROLE`, `STUDENT`, `GUARDIAN`, `HALAQAH`, `TEACHER_ASSIGNMENT`, `STUDENT_MEMBERSHIP`, `ACADEMIC_PERIOD`.

Contoh action periode: `PERIOD_CREATED`, `PERIOD_ACTIVATED`, `PERIOD_CLOSED`, `PERIOD_REOPENED`.

Audit perubahan role sensitif harus menyimpan role target, pengguna target, status sebelum/sesudah, alasan jika diperlukan, pengguna yang melakukan, dan waktu perubahan.

Contoh action pengguna/role yang telah digunakan: `USER_CREATED`, `USER_STATUS_CHANGED`, `ROLE_ASSIGNED`, dan `ROLE_REVOKED`.

Detail audit periode yang dapat dilihat Kepala mencakup status sebelumnya, status baru, alasan perubahan, pengguna yang melakukan, dan waktu perubahan.

### generated_reports
`organization_id`, `student_id`, `academic_period_id`, `period_start`, `period_end`, `report_number`, `report_snapshot`, `generated_at`, `generated_by`.

Aturan:
- `academic_period_id` boleh kosong jika laporan dibuat dari rentang tanggal khusus.
- `report_snapshot` disimpan sebagai JSON dengan struktur stabil.
- PDF MVP dibuat dari `report_snapshot`, bukan dari file permanen.
- Laporan lama tetap konsisten setelah data setoran dikoreksi.
- Jika data dikoreksi, pengguna membuat laporan baru sehingga versi lama dan baru dapat dibedakan.

## Constraint Penting
- `organizations.slug` unik.
- `users.email` unik per organisasi.
- `students.student_number` unik per organisasi.
- `quran_surahs.surah_number` unik.
- `generated_reports.report_number` unik per organisasi.
- `user_sessions.token_hash` unik.
- Periode `ACTIVE` tunggal divalidasi dalam transaction pada application layer karena MySQL tidak menyediakan partial unique index.
- Query data organisasi wajib memfilter `organization_id`.
- Foreign key entitas organisasi memakai pasangan `id` + `organization_id` agar relasi lintas organisasi ditolak oleh database.
- Constraint rentang aktif yang saling overlap, satu membership santri aktif, dan satu pengajar `PRIMARY` aktif tetap harus divalidasi dalam transaction pada application layer karena MySQL tidak menyediakan partial unique index.

## Belum Dibuat
Finance, payments, attendance, notifications, guardian login, audio, certificate, achievement, dan WhatsApp.
