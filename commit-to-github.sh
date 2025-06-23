#!/bin/bash

# GenoBank Auth Service - GitHub Commit Script
# This script safely prepares and commits the auth service to GitHub

set -e

echo "🚀 Preparing GenoBank Auth Service for GitHub..."

# Change to auth-service directory
cd /home/ubuntu/Genobank_APIs/auth-service

# Run security check first
echo "🔍 Running security check..."
if ! ./check-secrets.sh; then
    echo "❌ Security check failed. Please fix issues before committing."
    exit 1
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git config init.defaultBranch main
fi

# Add remote if not exists
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/Genobank/genobank-auth-service.git
fi

# Add all files respecting .gitignore
echo "📋 Staging files..."
git add .

# Show what will be committed
echo ""
echo "📊 Files to be committed:"
git status --short

# Count files
total_files=$(git status --short | wc -l)
echo ""
echo "Total files: $total_files"

# Create commit
echo ""
echo "💾 Creating commit..."
git commit -m "🎉 Initial commit: GenoBank Unified Authentication Service

A centralized authentication service for all GenoBank.io applications.

## Features
- 🔐 Web3 wallet authentication (MetaMask, WalletConnect, BioWallet)
- 🌐 Google OAuth via Magic SDK
- 🔄 Cross-domain SSO for all *.genobank.app services
- 🛡️ JWT-based session management with Redis
- 🎨 Beautiful responsive UI with GenoBank branding
- ⚡ Rate limiting and security features

## Technology Stack
- Node.js v24.2.0 + Express.js
- Redis for session storage
- Web3.js, Ethers.js, Magic SDK
- Bootstrap 5 with custom GenoBank styling
- systemd service with nginx reverse proxy

## Security
- Content Security Policy configured
- CORS protection for GenoBank domains
- Rate limiting on authentication endpoints
- Secure cookie handling
- No secrets or credentials included

Co-authored-by: GenoBank Development Team <dev@genobank.io>"

echo ""
echo "✅ Repository prepared successfully!"
echo ""
echo "📤 To push to GitHub, you need to:"
echo ""
echo "1. Set up GitHub authentication if not already done:"
echo "   - For SSH: Add your SSH key to GitHub"
echo "   - For HTTPS: Use a personal access token"
echo ""
echo "2. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "3. If the repository already has commits, you may need to:"
echo "   git pull --rebase origin main"
echo "   git push origin main"
echo ""
echo "⚠️  Final checklist:"
echo "   ✓ No .env file committed"
echo "   ✓ No API keys or secrets exposed"
echo "   ✓ All sensitive files in .gitignore"
echo "   ✓ README.md is comprehensive"
echo ""
echo "🎉 Good luck with your deployment!"