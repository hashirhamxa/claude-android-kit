#!/usr/bin/env bash
# install.sh — Claude Android Kit installer
# Usage: ./install.sh [--profile minimal|core|full] [--without hooks] [--dry-run] [--force] [--uninstall]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="$(cat "${SCRIPT_DIR}/VERSION" 2>/dev/null || echo "0.2.0")"
INSTALL_ROOT="${HOME}/.claude"
STATE_FILE="${INSTALL_ROOT}/.cak-install-state.json"

# ── defaults ──────────────────────────────────────────────────────────────────
PROFILE="core"
DRY_RUN="false"
UNINSTALL="false"
FORCE="false"
WITHOUT_HOOKS="false"
FILES_COPIED=0
FILES_SKIPPED=0
FILES_ERRORS=0
INSTALLED=""   # newline-separated list of installed destination paths

# ── parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="${2:?'--profile requires a value: minimal, core, or full'}"
      shift 2
      ;;
    --dry-run)    DRY_RUN="true";    shift ;;
    --uninstall)  UNINSTALL="true";  shift ;;
    --force)      FORCE="true";      shift ;;
    --without)
      if [[ "${2:-}" == "hooks" ]]; then
        WITHOUT_HOOKS="true"
      else
        printf '[ERROR] --without only accepts "hooks"\n' >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      cat <<'HELP'
Usage: ./install.sh [OPTIONS]

  --profile <name>    minimal | core (default) | full
  --without hooks     exclude hooks even in full profile
  --dry-run           print what would be copied, touch nothing
  --uninstall         remove all CAK-managed files using the state file
  --force             overwrite existing files without prompting
  -h, --help          show this message

Profiles:
  minimal   rules + agents
  core      rules + agents + commands + skills  (default)
  full      core + hooks + scripts
HELP
      exit 0
      ;;
    *)
      printf '[ERROR] Unknown flag: %s\n' "$1" >&2
      exit 1
      ;;
  esac
done

case "$PROFILE" in
  minimal|core|full) ;;
  *)
    printf '[ERROR] Unknown profile "%s". Valid: minimal, core, full\n' "$PROFILE" >&2
    exit 1
    ;;
esac

# ── colours (degrade gracefully when not a tty) ───────────────────────────────
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; RESET=''
fi

log_copy()  { printf "${GREEN}[COPY]${RESET}    %s\n"    "$1"; }
log_skip()  { printf "${YELLOW}[SKIP]${RESET}    %s\n"   "$1"; }
log_warn()  { printf "${YELLOW}[WARN]${RESET}    %s\n"   "$1"; }
log_error() { printf "${RED}[ERROR]${RESET}   %s\n"      "$1" >&2; }
log_dry()   { printf "${GREEN}[DRY RUN]${RESET} %s → %s\n" "$1" "$2"; }

# ── helpers ───────────────────────────────────────────────────────────────────

install_file() {
  local src="$1" dest="$2"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_dry "$src" "$dest"
    FILES_COPIED=$((FILES_COPIED + 1))
    return
  fi

  if [[ -e "$dest" ]] && [[ "$FORCE" != "true" ]]; then
    log_skip "$dest"
    FILES_SKIPPED=$((FILES_SKIPPED + 1))
    return
  fi

  local dir; dir="$(dirname "$dest")"
  mkdir -p "$dir"

  if cp -- "$src" "$dest"; then
    log_copy "$dest"
    INSTALLED="${INSTALLED}${dest}"$'\n'
    FILES_COPIED=$((FILES_COPIED + 1))
  else
    log_error "Failed: $src → $dest"
    FILES_ERRORS=$((FILES_ERRORS + 1))
  fi
}

install_tree() {
  local src_dir="$1" dest_dir="$2"
  [[ -d "$src_dir" ]] || return 0
  local f rel
  while IFS= read -r -d '' f; do
    rel="${f#"${src_dir}/"}"
    install_file "$f" "${dest_dir}/${rel}"
  done < <(find "$src_dir" -type f -print0 | sort -z)
}

# ── UNINSTALL ─────────────────────────────────────────────────────────────────
if [[ "$UNINSTALL" == "true" ]]; then
  if [[ ! -f "$STATE_FILE" ]]; then
    log_error "State file not found: ${STATE_FILE}"
    printf 'Cannot safely uninstall without the state file. Remove files manually.\n' >&2
    exit 1
  fi

  printf 'Reading: %s\n' "$STATE_FILE"

  if command -v python3 &>/dev/null; then
    PATHS="$(python3 -c "
import json
d = json.load(open('${STATE_FILE}'))
print('\n'.join(d.get('files', [])))
")"
  elif command -v node &>/dev/null; then
    PATHS="$(node -e "
const d = require('${STATE_FILE}');
(d.files || []).forEach(f => process.stdout.write(f + '\n'));
")"
  else
    log_error "python3 or node is required to parse the state file."
    exit 1
  fi

  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    if [[ "$DRY_RUN" == "true" ]]; then
      printf '[DRY RUN] Would remove: %s\n' "$path"
    elif [[ -f "$path" ]]; then
      rm -- "$path"
      printf 'Removed: %s\n' "$path"
    else
      printf 'Already gone: %s\n' "$path"
    fi
  done <<< "$PATHS"

  if [[ "$DRY_RUN" != "true" ]]; then
    rm -f -- "$STATE_FILE"
    printf 'Removed state file: %s\n' "$STATE_FILE"
    printf 'CAK uninstalled.\n'
  fi
  exit 0
fi

# ── INSTALL ───────────────────────────────────────────────────────────────────
if [[ "$DRY_RUN" == "true" ]]; then
  printf '[DRY RUN] Installing CAK (profile: %s) — no files will be written\n\n' "$PROFILE"
else
  printf 'Installing CAK (profile: %s)…\n\n' "$PROFILE"
  mkdir -p "${INSTALL_ROOT}"
fi

# Rules — all profiles
for pack in common kotlin android kmp; do
  install_tree "${SCRIPT_DIR}/rules/${pack}" "${INSTALL_ROOT}/rules/cak/${pack}"
done

# Agents — all profiles
install_tree "${SCRIPT_DIR}/agents" "${INSTALL_ROOT}/agents"

# Commands + Skills — core and full
if [[ "$PROFILE" == "core" || "$PROFILE" == "full" ]]; then
  install_tree "${SCRIPT_DIR}/commands" "${INSTALL_ROOT}/commands"
  install_tree "${SCRIPT_DIR}/skills"   "${INSTALL_ROOT}/skills"
fi

# Hooks + Scripts — full only (unless --without hooks)
if [[ "$PROFILE" == "full" ]]; then
  if [[ "$WITHOUT_HOOKS" == "true" ]]; then
    log_warn "Skipping hooks/scripts (--without hooks passed)"
  elif ! command -v node &>/dev/null; then
    log_warn "Node.js not found — skipping hook and script install."
    log_warn "Install Node.js then re-run with --profile full to add hooks."
  else
    install_file "${SCRIPT_DIR}/hooks/hooks.json" "${INSTALL_ROOT}/hooks/hooks.json"
    install_tree "${SCRIPT_DIR}/scripts" "${INSTALL_ROOT}/scripts"
  fi
fi

# Templates — never auto-copied; print guidance
printf '\nTemplates are not auto-installed. Copy manually when starting a new project:\n'
printf '  Android  cp %s/templates/CLAUDE.android.template.md <project>/CLAUDE.md\n' "$SCRIPT_DIR"
printf '  KMP      cp %s/templates/CLAUDE.kmm.template.md <project>/CLAUDE.md\n' "$SCRIPT_DIR"

# ── write state file ──────────────────────────────────────────────────────────
if [[ "$DRY_RUN" != "true" && "$FILES_COPIED" -gt 0 ]]; then
  ISO_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  files_json=""
  first=1
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    escaped="${path//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    if [[ "$first" -eq 1 ]]; then
      files_json="\"${escaped}\""
      first=0
    else
      files_json="${files_json},\"${escaped}\""
    fi
  done <<< "$INSTALLED"

  printf '{"version":"%s","profile":"%s","installedAt":"%s","files":[%s]}\n' \
    "$VERSION" "$PROFILE" "$ISO_DATE" "$files_json" > "$STATE_FILE"
  printf '\nState saved: %s\n' "$STATE_FILE"
fi

# ── summary ───────────────────────────────────────────────────────────────────
printf '\n'
if [[ "$DRY_RUN" == "true" ]]; then
  printf 'CAK dry run complete (profile: %s) — no files were written\n' "$PROFILE"
else
  printf 'CAK installed (profile: %s, %d files copied, %d skipped)\n' \
    "$PROFILE" "$FILES_COPIED" "$FILES_SKIPPED"
  if [[ "$FILES_ERRORS" -gt 0 ]]; then
    printf "${RED}%d error(s) — check output above.${RESET}\n" "$FILES_ERRORS"
  fi
fi
