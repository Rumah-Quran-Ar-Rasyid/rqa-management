# Operasional Pilot

## Backup MySQL
Jalankan dari root proyek pada mesin yang menjalankan Docker/OrbStack:

```bash
bash scripts/backup-mysql.sh
```

Backup tersimpan terkompresi pada `backups/` atau direktori dari `BACKUP_DIR`. Jalankan minimal harian dan salin hasilnya ke penyimpanan di luar mesin aplikasi. Jangan commit backup ke Git.

## Uji Restore
Restore sengaja hanya diizinkan ke database baru agar tidak menimpa data pilot atau produksi.

```bash
bash scripts/restore-mysql.sh backups/rqa-YYYYMMDD-HHMMSS.sql.gz \
  --database rqa_restore_check \
  --confirm-restore
```

Setelah restore, periksa jumlah organisasi, pengguna, santri, setoran, dan laporan pada database pemeriksaan. Catat tanggal, nama file backup, pelaksana, serta hasil pemeriksaan pada log operasional yayasan. Penggantian database aplikasi produksi dilakukan hanya melalui prosedur deployment yang disetujui, bukan skrip ini.

## Checklist Pilot
- Jalankan `npm run check` dan `npm run build` pada revision yang akan dipilotkan.
- Terapkan migrasi dengan `npm run db:migrate:deploy`.
- Buat backup sebelum migrasi atau perubahan data pilot.
- Uji login Admin/Kepala/Pengajar, input setoran di ponsel, koreksi/void, dashboard, dan PDF.
- Uji restore ke database pemeriksaan sebelum pilot dan secara berkala selama pilot.
