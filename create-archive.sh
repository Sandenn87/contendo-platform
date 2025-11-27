#!/bin/bash

# Script to create a clean archive of all files that should be in the repository
# This excludes node_modules, .env files, dist folders, etc.

ARCHIVE_NAME="contendo-platform-files.tar.gz"
TEMP_DIR=$(mktemp -d)

echo "📦 Creating archive of Contendo Platform files..."
echo ""

# Copy all files except those in .gitignore
echo "📋 Gathering files..."

# Use git to list files that should be tracked (respects .gitignore)
if [ -d ".git" ]; then
    echo "✅ Using Git to identify tracked files..."
    git ls-files | while read file; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            mkdir -p "$TEMP_DIR/$(dirname "$file")"
            cp -r "$file" "$TEMP_DIR/$file" 2>/dev/null || true
        fi
    done
else
    echo "⚠️  Git not initialized, copying all files except ignored ones..."
    # Fallback: copy everything and let user filter manually
    rsync -av --exclude='node_modules' \
              --exclude='.env' \
              --exclude='.env.local' \
              --exclude='dist' \
              --exclude='build' \
              --exclude='logs' \
              --exclude='*.log' \
              --exclude='.git' \
              --exclude='.DS_Store' \
              --exclude='uploads' \
              . "$TEMP_DIR/"
fi

# Create archive
echo ""
echo "🗜️  Creating archive: $ARCHIVE_NAME"
cd "$TEMP_DIR"
tar -czf "/Users/sandennkilloran/Desktop/$ARCHIVE_NAME" .

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Archive created successfully!"
echo "📍 Location: /Users/sandennkilloran/Desktop/$ARCHIVE_NAME"
echo ""
echo "📊 Archive contents:"
tar -tzf "/Users/sandennkilloran/Desktop/$ARCHIVE_NAME" | wc -l | xargs echo "   Files:"
echo ""
echo "💡 You can now upload this file to your repository or extract it elsewhere."

