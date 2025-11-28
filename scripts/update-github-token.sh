#!/bin/bash

# Script to update GitHub token in git remote URL

echo "🔐 GitHub Token Update Script"
echo "============================="
echo ""
echo "This script will update your git remote URL with a new GitHub token."
echo ""

# Prompt for new token
read -sp "Enter your NEW GitHub Personal Access Token (with 'workflow' scope): " NEW_TOKEN
echo ""

if [ -z "$NEW_TOKEN" ]; then
    echo "❌ Error: Token cannot be empty"
    exit 1
fi

# Update git remote URL
echo "Updating git remote URL..."
git remote set-url origin "https://${NEW_TOKEN}@github.com/Sandenn87/contendo-platform.git"

echo ""
echo "✅ Git remote URL updated!"
echo ""
echo "Testing connection..."
git ls-remote --heads origin main > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
    echo ""
    echo "You can now push GitHub Actions workflows."
else
    echo "⚠️  Connection test failed. Please verify your token has the correct scopes."
    exit 1
fi

