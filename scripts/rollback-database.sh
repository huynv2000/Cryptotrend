#!/bin/bash
# Database Rollback Script

BACKUP_FILE=$1
DB_PATH="./db/custom.db"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "Starting database rollback at $(date)"

# Validate backup file
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Create emergency backup before rollback
EMERGENCY_BACKUP="./backups/emergency_rollback_$(date +%Y%m%d_%H%M%S).db"
sqlite3 $DB_PATH ".backup $EMERGENCY_BACKUP"
echo "Emergency backup created: $EMERGENCY_BACKUP"

# Stop application (if running)
pkill -f "node.*next" || true
pkill -f "node.*server" || true

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Decompress and restore
    gzip -dc "$BACKUP_FILE" > "$DB_PATH"
else
    # Direct copy
    cp "$BACKUP_FILE" "$DB_PATH"
fi

# Verify restoration
echo "Verifying database restoration..."
sqlite3 $DB_PATH "SELECT COUNT(*) FROM cryptocurrencies;" || {
    echo "Database verification failed"
    # Restore emergency backup
    cp "$EMERGENCY_BACKUP" "$DB_PATH"
    echo "Restored from emergency backup"
    exit 1
}

echo "Database rollback completed successfully at $(date)"
echo "Emergency backup available at: $EMERGENCY_BACKUP"