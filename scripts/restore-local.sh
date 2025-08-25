#!/bin/bash
# Local Restore Script

SNAPSHOT_FILE=$1
RESTORE_DIR=${2:-"./restore"}

if [ -z "$SNAPSHOT_FILE" ]; then
    echo "Usage: $0 <snapshot_file> [restore_directory]"
    echo "Available snapshots:"
    ls -la ./backups/snapshots/snapshot_*.tar.gz
    exit 1
fi

if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "Error: Snapshot file not found: $SNAPSHOT_FILE"
    exit 1
fi

echo "Starting restore from snapshot: $SNAPSHOT_FILE"
echo "Restore directory: $RESTORE_DIR"

# Create restore directory
mkdir -p $RESTORE_DIR

# Extract snapshot
cd $RESTORE_DIR
tar -xzf $SNAPSHOT_FILE
cd - > /dev/null

# Find snapshot directory
SNAPSHOT_DIR=$(find $RESTORE_DIR -name "snapshot_*" -type d | head -1)

if [ -z "$SNAPSHOT_DIR" ]; then
    echo "Error: Could not find snapshot directory"
    exit 1
fi

echo "Snapshot directory: $SNAPSHOT_DIR"

# Show manifest
if [ -f "$SNAPSHOT_DIR/backup_manifest.txt" ]; then
    echo "Backup Manifest:"
    cat "$SNAPSHOT_DIR/backup_manifest.txt"
    echo ""
fi

# Restore options
echo "Restore options:"
echo "1. Database only"
echo "2. Source code only"
echo "3. Configuration only"
echo "4. AI models only"
echo "5. Complete restore"
echo "6. Exit"

read -p "Select restore option (1-6): " option

case $option in
    1)
        echo "Restoring database..."
        if [ -f "$SNAPSHOT_DIR/database/custom.db.gz" ]; then
            gunzip -c "$SNAPSHOT_DIR/database/custom.db.gz" > "./db/custom.db"
            echo "Database restored"
        else
            echo "Database backup not found"
        fi
        ;;
    2)
        echo "Restoring source code..."
        if [ -f "$SNAPSHOT_DIR/source_backup_*.tar.gz" ]; then
            # Backup current source first
            cp -r ./src ./src_backup_$(date +%Y%m%d_%H%M%S)
            # Extract new source
            tar -xzf "$SNAPSHOT_DIR/source_backup_*.tar.gz" -C ./
            echo "Source code restored"
        else
            echo "Source code backup not found"
        fi
        ;;
    3)
        echo "Restoring configuration..."
        if [ -d "$SNAPSHOT_DIR/config" ]; then
            cp -r "$SNAPSHOT_DIR/config"/* ./
            echo "Configuration restored"
        else
            echo "Configuration backup not found"
        fi
        ;;
    4)
        echo "Restoring AI models..."
        if [ -d "$SNAPSHOT_DIR/ai-models" ]; then
            cp -r "$SNAPSHOT_DIR/ai-models"/* ./src/lib/ai-enhanced/
            echo "AI models restored"
        else
            echo "AI models backup not found"
        fi
        ;;
    5)
        echo "Performing complete restore..."
        # Backup current state
        ./scripts/backup-local.sh
        
        # Restore database
        if [ -f "$SNAPSHOT_DIR/database/custom.db.gz" ]; then
            gunzip -c "$SNAPSHOT_DIR/database/custom.db.gz" > "./db/custom.db"
        fi
        
        # Restore source code
        if [ -f "$SNAPSHOT_DIR/source_backup_*.tar.gz" ]; then
            cp -r ./src ./src_backup_$(date +%Y%m%d_%H%M%S)
            tar -xzf "$SNAPSHOT_DIR/source_backup_*.tar.gz" -C ./
        fi
        
        # Restore configuration
        if [ -d "$SNAPSHOT_DIR/config" ]; then
            cp -r "$SNAPSHOT_DIR/config"/* ./
        fi
        
        # Restore AI models
        if [ -d "$SNAPSHOT_DIR/ai-models" ]; then
            cp -r "$SNAPSHOT_DIR/ai-models"/* ./src/lib/ai-enhanced/
        fi
        
        echo "Complete restore finished"
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Clean up restore directory
rm -rf $RESTORE_DIR

echo "Restore completed at $(date)"