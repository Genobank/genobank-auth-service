#!/bin/bash

# Navigate to auth-service directory
cd /home/ubuntu/Genobank_APIs/auth-service

echo "🚀 Pushing GenoBank Auth Service to GitHub..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git branch -M main
fi

# Add remote if not exists
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/Genobank/genobank-auth-service.git
else
    echo "✓ Remote already configured"
fi

# Add all files
echo "📋 Staging all files..."
git add .

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "✓ No changes to commit"
else
    echo "💾 Creating initial commit..."
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
fi

# Show current status
echo ""
echo "📊 Current status:"
git log --oneline -1 2>/dev/null || echo "No commits yet"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
echo ""

# Try to push
if git push -u origin main 2>&1; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🎉 View your repository at: https://github.com/Genobank/genobank-auth-service"
else
    echo ""
    echo "⚠️  Push failed. This might be because:"
    echo ""
    echo "1. You need to set up authentication:"
    echo "   - For HTTPS: Create a personal access token at https://github.com/settings/tokens"
    echo "   - Then run: git config --global credential.helper store"
    echo "   - Or use: git push https://YOUR_TOKEN@github.com/Genobank/genobank-auth-service.git main"
    echo ""
    echo "2. The repository might have existing content:"
    echo "   - Try: git pull origin main --allow-unrelated-histories"
    echo "   - Then: git push origin main"
    echo ""
    echo "3. You might not have push permissions:"
    echo "   - Make sure you have write access to the repository"
    echo ""
    echo "📁 Files are staged and committed locally. Fix the issue above and run:"
    echo "   cd /home/ubuntu/Genobank_APIs/auth-service"
    echo "   git push -u origin main"
fi