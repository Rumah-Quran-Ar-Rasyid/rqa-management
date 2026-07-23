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
- Memorization Audit
- Generated Report

## Tabel dan Field Penting

### organizations
`id`, `name`, `slug`, `status`, `timezone`, timestamps.

### users
`id`, `organization_id`, `name`, `email`, `phone`, `password_hash`, `status`, `last_login_at`, timestamps.

Status: `INVITED`, `ACTIVE`, `SUSPENDED`, `INACTIVE`.

### roles / user_roles
Role seed: `ADMIN`, `HEAD`, `TEACHER`.

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

### halaqah_memberships
`halaqah_id`, `student_id`, `valid_from`, `valid_until`, `status`.

### academic_periods
`organization_id`, `name`, `start_date`, `end_date`, `status`.

Status: `PLANNED`, `ACTIVE`, `CLOSED`.

### quran_surahs
`surah_number`, `arabic_name`, `latin_name`, `verse_count`.

### memorization_records
`organization_id`, `academic_period_id`, `student_id`, `halaqah_id`, `teacher_user_id`, `submission_date`, `submission_category`, rentang surah/ayat, `fluency_predicate`, `teacher_note`, `next_target`, `record_status`, audit timestamps/users.

Category: `SABAQ`, `SABQI`, `MANZIL`.
Fluency: `FLUENT`, `FAIRLY_FLUENT`, `LESS_FLUENT`.
Status: `ACTIVE`, `CORRECTED`, `VOID`.

### memorization_record_audits
`memorization_record_id`, `action`, `before_data`, `after_data`, `reason`, `performed_by`, `performed_at`.

### generated_reports
`organization_id`, `student_id`, `academic_period_id`, `period_start`, `period_end`, `report_number`, `file_path`, `generated_at`, `generated_by`.

## Belum Dibuat
Finance, payments, attendance, notifications, guardian login, audio, certificate, achievement, dan WhatsApp.
