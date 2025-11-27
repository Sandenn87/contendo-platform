#!/bin/bash

# Create a ZIP file with all project files (excluding ignored files)

ARCHIVE_NAME="contendo-platform-files.zip"
ARCHIVE_PATH="/Users/sandennkilloran/Desktop/$ARCHIVE_NAME"

echo "📦 Creating ZIP archive of Contendo Platform files..."
echo ""

# Remove old archive if exists
rm -f "$ARCHIVE_PATH"

# Create zip with all tracked files
if [ -d ".git" ]; then
    echo "✅ Using Git to identify files to include..."
    
    # Stage all files first
    git add . > /dev/null 2>&1
    
    # Create zip from tracked files
    git ls-files | zip -q "$ARCHIVE_PATH" -@
    
    echo "✅ Archive created: $ARCHIVE_PATH"
    echo ""
    echo "📊 Files included:"
    git ls-files | wc -l | xargs echo "   Total files:"
    echo ""
    echo "📋 Sample files:"
    git ls-files | head -10 | sed 's/^/   - /'
    echo ""
else
    echo "⚠️  Git not initialized. Creating archive manually..."
    
    # Manual approach - exclude common ignored files
    zip -r "$ARCHIVE_PATH" . \
        -x "*.env" \
        -x "*.env.local" \
        -x "node_modules/*" \
        -x "src/client/node_modules/*" \
        -x "dist/*" \
        -x "src/client/dist/*" \
        -x "build/*" \
        -x "logs/*" \
        -x "*.log" \
        -x ".git/*" \
        -x ".DS_Store" \
        -x "uploads/*" \
        -x "*.tmp" \
        -x "coverage/*" \
        > /dev/null 2>&1
    
    echo "✅ Archive created: $ARCHIVE_PATH"
fi

echo ""
echo "💡 Next steps:"
echo "   1. Find the file at: $ARCHIVE_PATH"
echo "   2. Upload it to your repository or extract it"
echo "   3. Or use Git commands directly (recommended)"
echo ""

