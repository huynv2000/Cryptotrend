#!/bin/bash
# Local Backup Health Check Script

echo "Checking local backup health at $(date)"

# Check snapshot directory
SNAPSHOT_DIR="./backups/snapshots"
BACKUP_DIR="./backups/local"

if [ ! -d "$SNAPSHOT_DIR" ]; then
    echo "ERROR: Snapshot directory not found: $SNAPSHOT_DIR"
    exit 1
fi

# Count snapshots
SNAPSHOT_COUNT=$(find $SNAPSHOT_DIR -name "snapshot_*.tar.gz" | wc -l)
echo "Total snapshots: $SNAPSHOT_COUNT"

# Check latest snapshot
LATEST_SNAPSHOT=$(ls -t $SNAPSHOT_DIR/snapshot_*.tar.gz | head -1)
if [ -n "$LATEST_SNAPSHOT" ]; then
    echo "Latest snapshot: $(basename $LATEST_SNAPSHOT)"
    echo "Latest snapshot size: $(du -h $LATEST_SNAPSHOT | cut -f1)"
    
    # Test snapshot integrity
    if tar -tzf "$LATEST_SNAPSHOT" > /dev/null 2>&1; then
        echo "Latest snapshot integrity: GOOD"
    else
        echo "Latest snapshot integrity: CORRUPTED"
    fi
else
    echo "No snapshots found"
fi

# Check backup sizes
echo "Backup sizes:"
if [ -d "$SNAPSHOT_DIR" ]; then
    du -sh $SNAPSHOT_DIR 2>/dev/null || echo "Snapshot directory not accessible"
fi
if [ -d "$BACKUP_DIR" ]; then
    du -sh $BACKUP_DIR 2>/dev/null || echo "Local backup directory not accessible"
fi

# Check snapshot age
if [ -n "$LATEST_SNAPSHOT" ]; then
    SNAPSHOT_AGE=$(find "$LATEST_SNAPSHOT" -mtime +1 | wc -l)
    if [ $SNAPSHOT_AGE -eq 0 ]; then
        echo "Snapshot age: Recent (within 24 hours)"
    else
        echo "Snapshot age: OLD ($(find "$LATEST_SNAPSHOT" -mtime +1 -mtime +30 | wc -l) days old)"
    fi
fi

# Check available disk space
echo "Disk space information:"
df -h . | tail -1 | awk '{print "Available space: " $4 " (" $5 " used)"}'

# Check critical files
echo "Critical files check:"
CRITICAL_FILES=(
    "./db/custom.db"
    "./src/lib/ai-enhanced/models/lstm.ts"
    "./src/lib/ai-enhanced/models/arima.ts"
    "./src/lib/ai-enhanced/models/prophet.ts"
    "./src/lib/ai-enhanced/models/ensemble.ts"
    "./prisma/schema.prisma"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
    fi
done

# Backup health summary
echo ""
echo "Backup Health Summary:"
if [ $SNAPSHOT_COUNT -gt 0 ]; then
    echo "✓ Backup system operational"
    echo "✓ $SNAPSHOT_COUNT snapshots available"
    if [ -n "$LATEST_SNAPSHOT" ] && tar -tzf "$LATEST_SNAPSHOT" > /dev/null 2>&1; then
        echo "✓ Latest snapshot integrity verified"
    else
        echo "✗ Latest snapshot corrupted"
    fi
else
    echo "✗ No snapshots available"
fi

echo "Backup health check completed at $(date)"