#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  open_in_chrome.sh [--dry-run] <url>

Examples:
  open_in_chrome.sh "https://ad.qq.com/lite/83259046/report"
  open_in_chrome.sh --dry-run "https://ad.qq.com/lite/83259046/report"
EOF
}

dry_run=0

if [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=1
  shift
fi

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

url="$1"

if [[ ! "$url" =~ ^https?:// ]]; then
  echo "URL must start with http:// or https://" >&2
  exit 1
fi

detect_command() {
  case "$(uname -s)" in
    Darwin)
      printf 'open -a "Google Chrome" %q' "$url"
      ;;
    Linux)
      if command -v google-chrome >/dev/null 2>&1; then
        printf 'google-chrome %q' "$url"
      elif command -v chromium >/dev/null 2>&1; then
        printf 'chromium %q' "$url"
      elif command -v chromium-browser >/dev/null 2>&1; then
        printf 'chromium-browser %q' "$url"
      else
        echo "No Chrome-compatible launcher found on this Linux system." >&2
        exit 1
      fi
      ;;
    *)
      echo "open_in_chrome.sh supports macOS and Linux only. Use open_in_chrome.ps1 on Windows." >&2
      exit 1
      ;;
  esac
}

cmd="$(detect_command)"

if [[ $dry_run -eq 1 ]]; then
  printf 'DRY_RUN: %s\n' "$cmd"
  exit 0
fi

eval "$cmd"
echo "Opened in Google Chrome: $url"
