# Raspberry Pi 4 deployment

The deployment target is Raspberry Pi OS Desktop 64-bit with the default Wayland/labwc desktop. Raspberry Pi OS Desktop is recommended here because Chromium needs a graphical session.

## Install

After flashing Raspberry Pi OS and enabling SSH in Raspberry Pi Imager:

```bash
cd ~
git clone https://github.com/JonathanRJDK/rodesSignageSoftware.git rodes-signage
cd ~/rodes-signage
sudo ./scripts/install-pi.sh
sudo reboot
```

The installer:

- installs Python, Chromium and `unclutter`
- copies the application to `/opt/rodes-signage`
- enables `rodes-signage-server.service`
- creates labwc autostart for the kiosk launcher
- restarts Chromium if it exits
- masks suspend/hibernate targets

The application itself is local and does not require internet after installation.

## Check the installation

```bash
sudo systemctl status rodes-signage-server
journalctl -u rodes-signage-server -f
curl http://127.0.0.1:8080/
```

The kiosk output is started when the graphical labwc session starts. Its log is available at:

```bash
cat /tmp/rodes-signage-kiosk.log
```

## Update the signage

```bash
cd ~/rodes-signage
git pull
sudo ./scripts/install-pi.sh
sudo reboot
```

The installer intentionally keeps the source checkout and the runtime copy separate, so a failed update does not replace the running copy until the installer is run.
