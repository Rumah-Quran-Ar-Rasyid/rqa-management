# Initial Data Model

## Entitas
- Organization
- User dan Role
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
- Perubahan role `HEAD` adalah aksi sensitif dan harus masuk audit operasional.
- Role `HEAD` hanya dapat diberikan atau dicabut oleh pengguna aktif yang sudah memiliki role `HEAD`.
- Sistem wajib memiliki minimal satu pengguna aktif dengan role `HEAD`.
- Role `HEAD` terakhir tidak boleh dicabut atau dinonaktifkan.
- Admin dapat melihat audit perubahan role `HEAD` secara read-only, tetapi tidak dapat melakukan perubahan role `HEAD`.

### students
`id`, `organization_id`, `student_number`, `full_name`, `preferred_name`, `gender`, `birth_date`, `joined_at`, `status`, timestamps.

### guardians
`id`, `organization_id`, `full_name`, `phone`, `email`, `status`, timestamps. Tidak memiliki akun login pada MVP.

### student_guardians
`student_id`, `guardian_id`, `relationship`, `is_primary`, `valid_from`, `valid_until`.

### halaqahs
`id`, `organization_id`, `name`, `description`, `status`, timestamps.

### halaqah_teacher_assignments
`halaqah_id`, `teacher_user_id`, `assignment_type`, `valid_from`, `valid_until`.

Assignment: `PRIMARY`, `ASSISTANT`, `SUBSTITUTE`.

Aturan:
- Satu pengajar boleh aktif pada beberapa halaqah.
- Satu halaqah memiliki maksimal satu `PRIMARY` aktif pada waktu yang sama.
- Satu halaqah boleh memiliki beberapa `ASSISTANT`.
- `SUBSTITUTE` digunakan untuk rentang waktu tertentu.
- Semua tipe assignment aktif boleh mencatat setoran pada halaqah terkait.

### halaqah_memberships
`halaqah_id`, `student_id`, `valid_from`, `valid_until`, `status`.

Aturan:
- Satu santri hanya boleh memiliki satu membership halaqah aktif pada waktu yang sama.
- Pindah halaqah dilakukan dengan menutup membership lama dan membuat membership baru.
- Histori setoran tetap menyimpan halaqah dan pengajar saat setoran dibuat.

### academic_periods
`organization_id`, `name`, `start_date`, `end_date`, `status`.

Status: `PLANNED`, `ACTIVE`, `CLOSED`.

Aturan:
- Admin dapat mengelola periode `PLANNED`/`ACTIVE`.
- Kepala dapat menutup periode dan reopen periode `CLOSED` dengan alasan.
- Selama periode `CLOSED`, setoran baru dan koreksi ditolak untuk semua role.
- Reopen dan penutupan periode wajib masuk audit operasional.

### quran_surahs
`surah_number`, `arabic_name`, `latin_name`, `verse_count`.

### memorization_records
`organization_id`, `academic_period_id`, `student_id`, `halaqah_id`, `teacher_user_id`, `submission_date`, `submission_category`, `surah_number`, `start_verse`, `end_verse`, `fluency_predicate`, `teacher_note`, `next_target`, `page_number`, `duplicate_override`, `duplicate_override_reason`, `duplicate_reference_record_id`, `record_status`, audit timestamps/users.

Category: `SABAQ`, `SABQI`, `MANZIL`.
Fluency: `FLUENT`, `FAIRLY_FLUENT`, `LESS_FLUENT`.
Status: `ACTIVE`, `VOID`.

Aturan:
- Satu record setoran hanya mencakup satu surah.
- Jika satu sesi setoran mencakup beberapa surah, setiap surah dicatat sebagai record terpisah.
- Kombinasi duplikasi: `student_id`, `submission_date`, `submission_category`, `surah_number`, `start_verse`, `end_verse`.
- `duplicate_override = false` berarti `duplicate_override_reason` dan `duplicate_reference_record_id` kosong.
- `duplicate_override = true` berarti alasan wajib; reference record disimpan jika tersedia.
- Koreksi memperbarui record yang sama dan menyimpan before/after di audit akademik.

### memorization_record_audits
`organization_id`, `memorization_record_id`, `action`, `before_data`, `after_data`, `reason`, `performed_by`, `performed_at`.

Action: `CREATE`, `UPDATE`, `VOID`.

### operational_audit_logs
`organization_id`, `domain`, `entity_id`, `action`, `before_data`, `after_data`, `reason`, `performed_by`, `performed_at`.

Domain: `USER`, `ROLE`, `STUDENT`, `GUARDIAN`, `HALAQAH`, `TEACHER_ASSIGNMENT`, `STUDENT_MEMBERSHIP`, `ACADEMIC_PERIOD`.

Contoh action periode: `PERIOD_CREATED`, `PERIOD_ACTIVATED`, `PERIOD_CLOSED`, `PERIOD_REOPENED`.

Audit perubahan role sensitif harus menyimpan role target, pengguna target, status sebelum/sesudah, alasan jika diperlukan, pengguna yang melakukan, dan waktu perubahan.

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
- Query data organisasi wajib memfilter `organization_id`.

## Belum Dibuat
Finance, payments, attendance, notifications, guardian login, audio, certificate, achievement, dan WhatsApp.
