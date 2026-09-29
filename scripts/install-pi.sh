#!/usr/bin/env bash
set -euo pipefail

APP_SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="/opt/rodes-signage"
RODES_USER="${SUDO_USER:-${USER}}"
SYSTEMD_SERVICE="/etc/systemd/system/rodes-signage-server.service"
LABWC_DIR="/home/${RODES_USER}/.config/labwc"
LABWC_AUTOSTART="${LABWC_DIR}/autostart"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo: sudo ./scripts/install-pi.sh" >&2
  exit 1
fi
if [[ ! -f "${APP_SOURCE}/index.html" || ! -f "${APP_SOURCE}/config/config.json" ]]; then
  echo "Run this script from inside the Rodes Signage project." >&2
  exit 1
fi
if ! id "${RODES_USER}" >/dev/null 2>&1; then
  echo "User '${RODES_USER}' does not exist." >&2
  exit 1
fi

echo "Installing Rodes Signage for user '${RODES_USER}'..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y python3 chromium unclutter

install -d -o "${RODES_USER}" -g "${RODES_USER}" "${APP_DIR}"
cp -a "${APP_SOURCE}/." "${APP_DIR}/"
chown -R "${RODES_USER}:${RODES_USER}" "${APP_DIR}"
sed "s/^User=RODES_USER$/User=${RODES_USER}/" "${APP_DIR}/systemd/rodes-signage-server.service" > "${SYSTEMD_SERVICE}"
chmod 644 "${SYSTEMD_SERVICE}"

install -d -o "${RODES_USER}" -g "${RODES_USER}" "${LABWC_DIR}"
touch "${LABWC_AUTOSTART}"
chown "${RODES_USER}:${RODES_USER}" "${LABWC_AUTOSTART}"
if ! grep -q '/scripts/start-kiosk.sh' "${LABWC_AUTOSTART}"; then
  cat >> "${LABWC_AUTOSTART}" <<EOF

# Rodes Signage kiosk launcher
${APP_DIR}/scripts/start-kiosk.sh > /tmp/rodes-signage-kiosk.log 2>&1 &
EOF
fi
if ! grep -q 'disable-screen-blanking' "${LABWC_AUTOSTART}"; then
  cat >> "${LABWC_AUTOSTART}" <<EOF

# Disable screen blanking where the current session supports it
${APP_DIR}/scripts/disable-screen-blanking.sh &
EOF
fi

chmod +x "${APP_DIR}/scripts/"*.sh
chown -R "${RODES_USER}:${RODES_USER}" "${LABWC_DIR}"
systemctl daemon-reload
systemctl enable --now rodes-signage-server.service
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target || true

echo "Installation complete. Reboot with: sudo reboot"
echo "Server status: sudo systemctl status rodes-signage-server"
echo "Server logs:   journalctl -u rodes-signage-server -f"

