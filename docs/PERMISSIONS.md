# Roles and Permissions

## Role
- `ADMIN`
- `HEAD`
- `TEACHER`

Satu pengguna dapat memiliki lebih dari satu role.

## Matriks Hak Akses
| Aktivitas | Admin | Kepala | Pengajar |
|---|---:|---:|---:|
| Login | Ya | Ya | Ya |
| Dashboard keseluruhan | Terbatas | Ya | Tidak |
| Kelola santri/wali | Ya | Ya | Tidak |
| Kelola halaqah/periode | Ya | Ya | Tidak |
| Assignment pengajar/santri | Ya | Ya | Tidak |
| Lihat seluruh halaqah | Ya | Ya | Tidak |
| Lihat halaqah yang diampu | Ya | Ya | Ya |
| Input setoran | Opsional | Opsional | Halaqahnya |
| Lihat riwayat | Semua | Semua | Halaqahnya |
| Koreksi setoran | Terbatas | Ya dengan alasan | Miliknya sesuai batas waktu |
| Void setoran | Terbatas | Ya dengan alasan | Tidak |
| Generate laporan | Ya | Ya | Opsional untuk halaqahnya |
| Audit log | Terbatas | Ya | Tidak |
| Export seluruh data | Terbatas | Ya | Tidak |

## Aturan Authorization
- Akses ditolak secara default.
- Pemeriksaan dilakukan di server, bukan hanya menyembunyikan tombol.
- Pengajar hanya mengakses halaqah yang ditugaskan kepadanya.
- Santri harus aktif pada halaqah terkait.
- Semua data harus berada pada organisasi yang sama.
- Pengguna nonaktif tidak dapat login.
