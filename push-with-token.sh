#!/bin/bash

# GitHub Push Script with Token
# Usage: ./push-with-token.sh YOUR_GITHUB_USERNAME YOUR_TOKEN

if [ $# -ne 2 ]; then
    echo "Usage: $0 <github-username> <github-token>"
    echo "Example: $0 myusername ghp_xxxxxxxxxxxxx"
    exit 1
fi

GITHUB_USER=$1
GITHUB_TOKEN=$2

cd /home/ubuntu/Genobank_APIs/auth-service

echo "🚀 Pushing to GitHub as $GITHUB_USER..."

# Initialize if needed
if [ ! -d ".git" ]; then
    git init
    git branch -M main
    git remote add origin https://github.com/Genobank/genobank-auth-service.git
fi

# Add and commit if needed
git add .
if [ -n "$(git status --porcelain)" ]; then
    git commit -m "🎉 Initial commit: GenoBank Unified Authentication Service"
fi

# Push using token
echo "📤 Pushing to GitHub..."
git push https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/Genobank/genobank-auth-service.git main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed!"
    echo "🎉 View at: https://github.com/Genobank/genobank-auth-service"
else
    echo "❌ Push failed. Check your credentials and try again."
fi