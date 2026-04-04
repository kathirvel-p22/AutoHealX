#!/bin/bash
# AutoHealX — Clear System Cache Script
# Works on Linux; requires root for drop_caches

echo "Clearing system cache..."

# Sync filesystem buffers
sync

# Drop page cache, dentries, inodes (requires root)
if [ "$EUID" -eq 0 ]; then
  echo 3 > /proc/sys/vm/drop_caches
  echo "SUCCESS: Kernel cache cleared (page cache, dentries, inodes)"
else
  echo "INFO: Not running as root — kernel cache not cleared"
  echo "Run as root for full cache clear: sudo ./clearCache.sh"
fi

# Clear tmp files older than 1 day
find /tmp -type f -atime +1 -delete 2>/dev/null
echo "SUCCESS: Temp files cleaned"

exit 0
