#!/bin/bash
# Configuration Rollback Script

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date_YYYYMMDD>"
    exit 1
fi

echo "Starting configuration rollback at $(date)"

BACKUP_DIR="/backups/config"
BACKUP_FILE="$BACKUP_DIR/config_backup_$BACKUP_DATE.tar.gz"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Create current configuration backup
CURRENT_BACKUP="./backups/current_config_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" \
    ./src/config \
    ./prisma \
    ./package.json \
    ./tailwind.config.ts \
    ./next.config.ts
echo "Current configuration backed up to: $CURRENT_BACKUP"

# Extract backup
tar -xzf "$BACKUP_FILE" -C /tmp

# Restore configuration files
cp -r /tmp/config_$BACKUP_DATE/* ./src/config/
cp -r /tmp/prisma_$BACKUP_DATE/* ./prisma/
cp /tmp/package_$BACKUP_DATE.json ./package.json
cp /tmp/tailwind_$BACKUP_DATE.config.ts ./tailwind.config.ts
cp /tmp/next_$BACKUP_DATE.config.ts ./next.config.ts

# Clean up
rm -rf /tmp/config_$BACKUP_DATE
rm -rf /tmp/prisma_$BACKUP_DATE
rm -f /tmp/package_$BACKUP_DATE.json
rm -f /tmp/tailwind_$BACKUP_DATE.config.ts
rm -f /tmp/next_$BACKUP_DATE.config.ts

echo "Configuration rollback completed at $(date)"