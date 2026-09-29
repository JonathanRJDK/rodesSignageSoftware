#!/usr/bin/env bash
set -u

APP_URL="${RODES_SIGNAGE_URL:-http://127.0.0.1:8080}"
CHROMIUM="$(command -v chromium || command -v chromium-browser || true)"

if [[ -z "$CHROMIUM" ]]; then
  echo "Rodes Signage: Chromium was not found" >&2
  exit 1
fi

while true; do
  profile_dir="$(mktemp -d /tmp/rodes-signage-chromium.XXXXXX)"
  "$CHROMIUM" --user-data-dir="$profile_dir" --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --enable-features=OverlayScrollbar --disable-gpu "$APP_URL"
  exit_code=$?
  rm -rf "$profile_dir"
  echo "Rodes Signage: Chromium exited with code $exit_code; restarting in 3 seconds" >&2
  sleep 3
done
