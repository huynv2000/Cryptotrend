#!/bin/bash
# Code Backup Script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/code"

echo "Starting code backup at $(date)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Git operations
git add .
git commit -m "Auto-backup: $DATE"
git tag -a "backup-$DATE" -m "Automated backup"

# Create archive
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=.next \
    .

echo "Code backup completed at $(date)"