#!/bin/bash
# Configuration Backup Script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/config"

echo "Starting configuration backup at $(date)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration files
cp -r ./src/config $BACKUP_DIR/config_$DATE
cp -r ./prisma $BACKUP_DIR/prisma_$DATE
cp package.json $BACKUP_DIR/package_$DATE.json
cp tailwind.config.ts $BACKUP_DIR/tailwind_$DATE.config.ts
cp next.config.ts $BACKUP_DIR/next_$DATE.config.ts

# Create archive
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
    -C $BACKUP_DIR \
    config_$DATE \
    prisma_$DATE \
    package_$DATE.json \
    tailwind_$DATE.config.ts \
    next_$DATE.config.ts

# Clean up temporary files
rm -rf $BACKUP_DIR/config_$DATE
rm -rf $BACKUP_DIR/prisma_$DATE
rm -f $BACKUP_DIR/package_$DATE.json
rm -f $BACKUP_DIR/tailwind_$DATE.config.ts
rm -f $BACKUP_DIR/next_$DATE.config.ts

echo "Configuration backup completed at $(date)"