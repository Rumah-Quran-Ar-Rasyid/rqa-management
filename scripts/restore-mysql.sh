#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Pemakaian: bash scripts/restore-mysql.sh FILE.sql.gz --database DATABASE_BARU --confirm-restore" >&2
  exit 1
}

[[ $# -ge 4 ]] || usage
backup_file="$1"
shift
target_database=""
confirmed=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --database) target_database="${2:-}"; shift 2 ;;
    --confirm-restore) confirmed=true; shift ;;
    *) usage ;;
  esac
done

[[ -f "$backup_file" && "$confirmed" == true ]] || usage
[[ "$target_database" =~ ^[A-Za-z0-9_]+$ ]] || usage
[[ -f .env ]] || { echo "File .env tidak ditemukan." >&2; exit 1; }

set -a
source .env
set +a

exists="$(docker compose exec -T mysql sh -c 'exec mysql -N -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '\''$1'\''"' sh "$target_database")"
if [[ -n "$exists" ]]; then
  echo "Database tujuan sudah ada. Restore hanya diizinkan ke database baru." >&2
  exit 1
fi

docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE \`$1\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"' sh "$target_database"
gzip -dc "$backup_file" | docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$1"' sh "$target_database"

echo "Restore selesai ke database baru: $target_database"
