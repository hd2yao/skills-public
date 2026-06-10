#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  launch_debug_chrome.sh [--dry-run] [--port PORT] [--profile-dir DIR] <url>
EOF
}

dry_run=0
port=9222
profile_dir="${TMPDIR:-/tmp}/qq-ads-report-download-chrome-profile"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --port)
      port="$2"
      shift 2
      ;;
    --profile-dir)
      profile_dir="$2"
      shift 2
      ;;
    -*)
      usage >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

url="$1"

if [[ ! "$url" =~ ^https?:// ]]; then
  echo "URL must start with http:// or https://" >&2
  exit 1
fi

mkdir -p "$profile_dir"

detect_command() {
  case "$(uname -s)" in
    Darwin)
      printf 'open -na "Google Chrome" --args --remote-debugging-port=%q --user-data-dir=%q --new-window %q' "$port" "$profile_dir" "$url"
      ;;
    Linux)
      if command -v google-chrome >/dev/null 2>&1; then
        printf 'google-chrome --remote-debugging-port=%q --user-data-dir=%q --new-window %q' "$port" "$profile_dir" "$url"
      elif command -v chromium >/dev/null 2>&1; then
        printf 'chromium --remote-debugging-port=%q --user-data-dir=%q --new-window %q' "$port" "$profile_dir" "$url"
      elif command -v chromium-browser >/dev/null 2>&1; then
        printf 'chromium-browser --remote-debugging-port=%q --user-data-dir=%q --new-window %q' "$port" "$profile_dir" "$url"
      else
        echo "No Chrome-compatible launcher found on this Linux system." >&2
        exit 1
      fi
      ;;
    *)
      echo "launch_debug_chrome.sh supports macOS and Linux only. Use launch_debug_chrome.ps1 on Windows." >&2
      exit 1
      ;;
  esac
}

cmd="$(detect_command)"

if [[ $dry_run -eq 1 ]]; then
  printf 'DRY_RUN: %s\n' "$cmd"
  exit 0
fi

eval "$cmd >/dev/null 2>&1 &"
echo "Opened debug Chrome on port $port: $url"
echo "Profile dir: $profile_dir"
