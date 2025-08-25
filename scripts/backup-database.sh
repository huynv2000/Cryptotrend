#!/bin/bash
# Database Backup Script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/database"
DB_PATH="./db/custom.db"

echo "Starting database backup at $(date)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup using Prisma
npx prisma db push --preview-feature 2>/dev/null
cp $DB_PATH $BACKUP_DIR/custom_db_$DATE.db

# Verify backup
if [ -f "$BACKUP_DIR/custom_db_$DATE.db" ]; then
    echo "Database backup successful: custom_db_$DATE.db"
    
    # Compress backup
    gzip $BACKUP_DIR/custom_db_$DATE.db
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.db.gz" -mtime +7 -delete
    
    echo "Backup compressed and old backups cleaned up"
else
    echo "Database backup failed"
    exit 1
fi

echo "Database backup completed at $(date)"