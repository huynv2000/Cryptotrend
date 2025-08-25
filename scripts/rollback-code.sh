#!/bin/bash
# Code Rollback Script

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <git_version_or_tag>"
    exit 1
fi

echo "Starting code rollback at $(date)"

# Create current state backup
CURRENT_BACKUP="./backups/pre-rollback_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=.next \
    .
echo "Current state backed up to: $CURRENT_BACKUP"

# Git rollback
git checkout "$VERSION"

# Clean and reinstall
rm -rf node_modules .next dist
npm install

# Run database migration if needed
npm run db:push

echo "Code rollback completed at $(date)"