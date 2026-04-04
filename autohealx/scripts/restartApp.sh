#!/bin/bash
# AutoHealX — Restart Application Script
# Usage: ./restartApp.sh <app-name>

APP=$1

if [ -z "$APP" ]; then
  echo "ERROR: No app name provided. Usage: ./restartApp.sh <app-name>"
  exit 1
fi

echo "Attempting to restart: $APP"

# Try systemctl first (Linux services)
if command -v systemctl &>/dev/null; then
  if systemctl is-active --quiet "$APP" 2>/dev/null; then
    systemctl restart "$APP"
    echo "SUCCESS: Restarted $APP via systemctl"
    exit 0
  fi
fi

# Try pkill + relaunch
pkill -f "$APP" 2>/dev/null
sleep 1
echo "Process $APP stopped (if it was running)"
echo "Manual restart required for non-service apps"
exit 0
