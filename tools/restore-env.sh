#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE=false
ARCHIVE_PATH=""

for ARG in "$@"; do
  if [[ "${ARG}" == "--force" ]]; then
    FORCE=true
  elif [[ -z "${ARCHIVE_PATH}" ]]; then
    ARCHIVE_PATH="${ARG}"
  else
    printf 'Usage: %s [archive.tar.gz] [--force]\n' "${BASH_SOURCE[0]}" >&2
    exit 2
  fi
done

if [[ -z "${ARCHIVE_PATH}" ]]; then
  ARCHIVE_PATH="$(find "${ROOT_DIR}/.local/env-archives" -type f -name '*.tar.gz' -print 2>/dev/null | sort | tail -n 1 || true)"
fi

if [[ -z "${ARCHIVE_PATH}" || ! -f "${ARCHIVE_PATH}" ]]; then
  printf 'Environment archive not found. Create one with: pnpm env:archive\n' >&2
  exit 1
fi

if [[ "${ARCHIVE_PATH}" != /* ]]; then
  ARCHIVE_PATH="${ROOT_DIR}/${ARCHIVE_PATH}"
fi

ARCHIVE_ENTRIES="$(tar -tzf "${ARCHIVE_PATH}")"
while IFS= read -r ENTRY; do
  [[ -z "${ENTRY}" ]] && continue
  case "${ENTRY}" in
    template/*.env|template/*/.env|template/*/.env.*) ;;
    *)
      printf 'Refusing archive entry outside template environment files: %s\n' "${ENTRY}" >&2
      exit 1
      ;;
  esac
done <<< "${ARCHIVE_ENTRIES}"

EXISTING_FILES=()
while IFS= read -r ENTRY; do
  [[ -z "${ENTRY}" || "${ENTRY}" == */ ]] && continue
  if [[ -f "${ROOT_DIR}/${ENTRY}" ]]; then
    EXISTING_FILES+=("${ENTRY}")
  fi
done <<< "${ARCHIVE_ENTRIES}"

if (( ${#EXISTING_FILES[@]} > 0 )) && [[ "${FORCE}" != true ]]; then
  printf 'The following files already exist:\n'
  printf ' - %s\n' "${EXISTING_FILES[@]}"
  printf 'Re-run with --force to overwrite them.\n' >&2
  exit 1
fi

tar -xzf "${ARCHIVE_PATH}" -C "${ROOT_DIR}"
chmod 600 "${ROOT_DIR}"/template/*/.env* 2>/dev/null || true

printf 'Restored environment files from: %s\n' "${ARCHIVE_PATH}"
printf '%s\n' "${ARCHIVE_ENTRIES}" | sed '/\/$/d; s/^/ - /'
