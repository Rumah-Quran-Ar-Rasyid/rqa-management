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
  'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  | gzip > "$backup_file"

test -s "$backup_file"
echo "Backup selesai: $backup_file"
