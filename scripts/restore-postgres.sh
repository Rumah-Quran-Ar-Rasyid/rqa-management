#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Pemakaian: bash scripts/restore-postgres.sh FILE.dump --target-url URL --confirm-restore" >&2
  exit 1
}

[[ $# -ge 4 ]] || usage
backup_file="$1"
shift
target_url=""
confirmed=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-url) target_url="${2:-}"; shift 2 ;;
    --confirm-restore) confirmed=true; shift ;;
    *) usage ;;
  esac
done

[[ -f "$backup_file" && "$confirmed" == true ]] || usage
[[ "$target_url" == postgres://* || "$target_url" == postgresql://* ]] || usage

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

if [[ -n "${DIRECT_URL:-}" ]]; then
  same_database="$(SOURCE_DATABASE_URL="$DIRECT_URL" TARGET_DATABASE_URL="$target_url" node -e '
    const identity = (value) => {
      const url = new URL(value);
      const port = url.port || "5432";
      return `${url.hostname.toLowerCase()}:${port}${url.pathname}`;
    };
    process.stdout.write(identity(process.env.SOURCE_DATABASE_URL) === identity(process.env.TARGET_DATABASE_URL) ? "yes" : "no");
  ')"
  if [[ "$same_database" == "yes" ]]; then
    echo "Target restore tidak boleh sama dengan DIRECT_URL sumber." >&2
    exit 1
  fi
fi

restore_url="$(TARGET_DATABASE_URL="$target_url" node -e '
  const url = new URL(process.env.TARGET_DATABASE_URL);
  for (const key of ["schema", "pgbouncer", "connection_limit"]) url.searchParams.delete(key);
  if (!process.env.PG_RESTORE_NATIVE && ["127.0.0.1", "localhost"].includes(url.hostname)) url.hostname = "host.docker.internal";
  process.stdout.write(url.toString());
')"

run_pg_restore() {
  if command -v pg_restore >/dev/null 2>&1; then
    pg_restore "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm --network host -v "$(pwd):/work" -w /work postgres:17-alpine pg_restore "$@"
  else
    echo "pg_restore wajib tersedia, langsung atau melalui Docker." >&2
    exit 1
  fi
}

checksum_file="${backup_file}.sha256"
if [[ -f "$checksum_file" ]]; then
  checksum_dir="$(cd "$(dirname "$checksum_file")" && pwd)"
  checksum_name="$(basename "$checksum_file")"
  if command -v shasum >/dev/null 2>&1; then
    (cd "$checksum_dir" && shasum -a 256 -c "$checksum_name")
  elif command -v sha256sum >/dev/null 2>&1; then
    (cd "$checksum_dir" && sha256sum -c "$checksum_name")
  else
    echo "Checksum tersedia tetapi tool verifikasi SHA-256 tidak ditemukan." >&2
    exit 1
  fi
fi

run_pg_restore --dbname="$restore_url" --clean --if-exists --no-owner --no-privileges --exit-on-error "$backup_file"
echo "Restore selesai ke database pemeriksaan."
