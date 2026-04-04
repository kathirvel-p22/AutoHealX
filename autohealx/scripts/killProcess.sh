#!/bin/bash
# AutoHealX — Kill Process Script
# Usage: ./killProcess.sh <PID>
# This script safely kills a process by PID

PID=$1

if [ -z "$PID" ]; then
  echo "ERROR: No PID provided. Usage: ./killProcess.sh <PID>"
  exit 1
fi

# Check if process exists
if ! kill -0 "$PID" 2>/dev/null; then
  echo "ERROR: Process $PID does not exist"
  exit 1
fi

# Get process name before killing
PROC_NAME=$(ps -p "$PID" -o comm= 2>/dev/null || echo "unknown")

echo "Killing process: $PROC_NAME (PID: $PID)"
kill -9 "$PID"

if [ $? -eq 0 ]; then
  echo "SUCCESS: Process $PROC_NAME ($PID) killed"
  exit 0
else
  echo "FAILED: Could not kill process $PID"
  exit 1
fi
