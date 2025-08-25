#!/bin/bash
# Local Backup Script without Git dependency

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/local"
SNAPSHOT_DIR="./backups/snapshots"

echo "Starting local backup at $(date)"

# Create backup directories
mkdir -p $BACKUP_DIR
mkdir -p $SNAPSHOT_DIR

# Create snapshot directory with timestamp
SNAPSHOT_PATH="$SNAPSHOT_DIR/snapshot_$DATE"
mkdir -p $SNAPSHOT_PATH

# 1. Database Backup
echo "Backing up database..."
mkdir -p $SNAPSHOT_PATH/database
if [ -f "./db/custom.db" ]; then
    cp ./db/custom.db $SNAPSHOT_PATH/database/custom.db
    gzip $SNAPSHOT_PATH/database/custom.db
    echo "Database backup completed"
else
    echo "Warning: Database file not found"
fi

# 2. Source Code Backup
echo "Backing up source code..."
mkdir -p $SNAPSHOT_PATH/source
# Copy source files (excluding node_modules, .next, etc.)
cp -r ./src $SNAPSHOT_PATH/source/
cp -r ./prisma $SNAPSHOT_PATH/
cp package.json $SNAPSHOT_PATH/
cp tailwind.config.ts $SNAPSHOT_PATH/
cp next.config.ts $SNAPSHOT_PATH/
cp tsconfig.json $SNAPSHOT_PATH/

# Create archive
cd $SNAPSHOT_PATH && tar -czf source_backup_$DATE.tar.gz source/ prisma/ package.json tailwind.config.ts next.config.ts tsconfig.json
rm -rf source/ prisma/ package.json tailwind.config.ts next.config.ts tsconfig.json
cd - > /dev/null
echo "Source code backup completed"

# 3. Configuration Backup
echo "Backing up configurations..."
mkdir -p $SNAPSHOT_PATH/config
if [ -d "./src/config" ]; then
    cp -r ./src/config $SNAPSHOT_PATH/config/
fi
if [ -f ".env" ]; then
    cp .env $SNAPSHOT_PATH/config/.env_backup
fi
echo "Configuration backup completed"

# 4. AI Models Backup
echo "Backing up AI models..."
mkdir -p $SNAPSHOT_PATH/ai-models
if [ -d "./src/lib/ai-enhanced/models" ]; then
    cp -r ./src/lib/ai-enhanced/models $SNAPSHOT_PATH/ai-models/
fi
echo "AI models backup completed"

# 5. Create manifest file
cat > $SNAPSHOT_PATH/backup_manifest.txt << EOF
Backup Snapshot: $DATE
Timestamp: $(date)
Files Included:
- Database: custom.db
- Source Code: src/, prisma/, config files
- Configuration: config files, .env
- AI Models: ai-enhanced/models/
Backup Status: COMPLETE
EOF

# 6. Create compressed archive of entire snapshot
cd $SNAPSHOT_DIR && tar -czf snapshot_$DATE.tar.gz snapshot_$DATE/
rm -rf snapshot_$DATE/
cd - > /dev/null

# 7. Clean up old backups (keep last 5 snapshots)
cd $SNAPSHOT_DIR
ls -t snapshot_*.tar.gz | tail -n +6 | xargs rm -f
cd - > /dev/null

# 8. Create latest symlink
ln -sf $SNAPSHOT_DIR/snapshot_$DATE.tar.gz $BACKUP_DIR/latest_snapshot.tar.gz

echo "Local backup completed at $(date)"
echo "Snapshot saved to: $SNAPSHOT_DIR/snapshot_$DATE.tar.gz"
echo "Latest snapshot symlink: $BACKUP_DIR/latest_snapshot.tar.gz"