#!/bin/bash
# Backup Health Check Script

echo "Checking backup health at $(date)"

# Check database backups
DB_BACKUP_DIR="./backups/database"
DB_BACKUP_COUNT=$(find $DB_BACKUP_DIR -name "*.db.gz" -mtime -1 | wc -l)
echo "Database backups (last 24 hours): $DB_BACKUP_COUNT"

# Check code backups
CODE_BACKUP_DIR="./backups/code"
CODE_BACKUP_COUNT=$(find $CODE_BACKUP_DIR -name "code_backup_*.tar.gz" -mtime -7 | wc -l)
echo "Code backups (last 7 days): $CODE_BACKUP_COUNT"

# Check configuration backups
CONFIG_BACKUP_DIR="./backups/config"
CONFIG_BACKUP_COUNT=$(find $CONFIG_BACKUP_DIR -name "config_backup_*.tar.gz" -mtime -1 | wc -l)
echo "Configuration backups (last 24 hours): $CONFIG_BACKUP_COUNT"

# Check backup sizes
echo "Backup sizes:"
du -sh $DB_BACKUP_DIR 2>/dev/null || echo "Database backup directory not found"
du -sh $CODE_BACKUP_DIR 2>/dev/null || echo "Code backup directory not found"
du -sh $CONFIG_BACKUP_DIR 2>/dev/null || echo "Configuration backup directory not found"

# Check for backup failures
if [ $DB_BACKUP_COUNT -eq 0 ]; then
    echo "WARNING: No recent database backups found"
fi

if [ $CODE_BACKUP_COUNT -eq 0 ]; then
    echo "WARNING: No recent code backups found"
fi

if [ $CONFIG_BACKUP_COUNT -eq 0 ]; then
    echo "WARNING: No recent configuration backups found"
fi

echo "Backup health check completed at $(date)"