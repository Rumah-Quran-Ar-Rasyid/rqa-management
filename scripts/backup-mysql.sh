#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "File .env tidak ditemukan." >&2
  exit 1
fi

set -a
source .env
set +a

backup_dir="${BACKUP_DIR:-backups}"
timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="${backup_dir}/rqa-${timestamp}.sql.gz"

mkdir -p "$backup_dir"
docker compose exec -T mysql sh -c \
  'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --events --set-gtid-purged=OFF "$MYSQL_DATABASE"' \
  | gzip > "$backup_file"

test -s "$backup_file"
gzip -t "$backup_file"
if command -v shasum >/dev/null 2>&1; then
  (cd "$(dirname "$backup_file")" && shasum -a 256 "$(basename "$backup_file")" > "$(basename "$backup_file").sha256")
elif command -v sha256sum >/dev/null 2>&1; then
  (cd "$(dirname "$backup_file")" && sha256sum "$(basename "$backup_file")" > "$(basename "$backup_file").sha256")
else
  echo "Peringatan: checksum SHA-256 tidak dibuat karena tool tidak tersedia." >&2
fi
echo "Backup selesai: $backup_file"
