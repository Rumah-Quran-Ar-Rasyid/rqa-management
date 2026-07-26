#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "DIRECT_URL wajib diisi untuk backup PostgreSQL." >&2
  exit 1
fi

backup_url="$(node -e '
  const url = new URL(process.env.DIRECT_URL);
  for (const key of ["schema", "pgbouncer", "connection_limit"]) url.searchParams.delete(key);
  if (!process.env.PG_DUMP_NATIVE && ["127.0.0.1", "localhost"].includes(url.hostname)) url.hostname = "host.docker.internal";
  process.stdout.write(url.toString());
')"

run_pg_dump() {
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm --network host -v "$(pwd):/work" -w /work postgres:17-alpine pg_dump "$@"
  else
    echo "pg_dump wajib tersedia, langsung atau melalui Docker." >&2
    exit 1
  fi
}

run_pg_restore() {
  if command -v pg_restore >/dev/null 2>&1; then
    pg_restore "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm -v "$(pwd):/work" -w /work postgres:17-alpine pg_restore "$@"
  else
    echo "pg_restore wajib tersedia, langsung atau melalui Docker." >&2
    exit 1
  fi
}

backup_dir="${BACKUP_DIR:-backups}"
timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="${backup_dir}/rqa-${timestamp}.dump"

mkdir -p "$backup_dir"
run_pg_dump --dbname="$backup_url" --format=custom --no-owner --no-privileges --file="$backup_file"
test -s "$backup_file"
run_pg_restore --list "$backup_file" >/dev/null

if command -v shasum >/dev/null 2>&1; then
  (cd "$backup_dir" && shasum -a 256 "$(basename "$backup_file")" > "$(basename "$backup_file").sha256")
elif command -v sha256sum >/dev/null 2>&1; then
  (cd "$backup_dir" && sha256sum "$(basename "$backup_file")" > "$(basename "$backup_file").sha256")
else
  echo "Peringatan: checksum SHA-256 tidak dibuat karena tool tidak tersedia." >&2
fi

echo "Backup selesai: $backup_file"
