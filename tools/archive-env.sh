#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-${ROOT_DIR}/.local/env-archives}"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
ARCHIVE_PATH="${OUTPUT_DIR}/workspace-env-${TIMESTAMP}.tar.gz"

mkdir -p "${OUTPUT_DIR}"

ENV_FILES=()
while IFS= read -r -d '' ENV_FILE; do
  ENV_FILES+=("${ENV_FILE}")
done < <(
  cd "${ROOT_DIR}"
  find template -type f \( -name '.env' -o -name '.env.*' \) -print0 | sort -z
)

if (( ${#ENV_FILES[@]} == 0 )); then
  printf 'No environment files found under template/.\n' >&2
  exit 1
fi

tar -czf "${ARCHIVE_PATH}" -C "${ROOT_DIR}" "${ENV_FILES[@]}"
chmod 600 "${ARCHIVE_PATH}"

printf 'Saved environment archive: %s\n' "${ARCHIVE_PATH}"
printf 'Included files:\n'
printf ' - %s\n' "${ENV_FILES[@]}"
printf '\nThis archive may contain secrets. Keep it local and do not commit it.\n'
