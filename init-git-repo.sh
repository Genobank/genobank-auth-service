#!/bin/bash

# GenoBank Auth Service - Git Repository Initialization Script
# This script safely initializes the git repository without exposing secrets

echo "🔐 Initializing GenoBank Auth Service repository..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: This script must be run from the auth-service directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check for .env file
if [ -f ".env" ]; then
    echo "⚠️  WARNING: .env file exists - making sure it's in .gitignore"
    if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo "❌ ERROR: .env is not in .gitignore! Aborting for safety."
        exit 1
    fi
    echo "✅ .env is properly ignored"
fi

# Initialize git repository
git init

# Set default branch to main
git config init.defaultBranch main

# Add the remote repository
git remote add origin https://github.com/Genobank/genobank-auth-service.git

# Create a README if it doesn't exist
if [ ! -f README.md ]; then
    echo "📝 Creating README.md..."
    cat > README.md << 'EOF'
# GenoBank Auth Service

Unified authentication service for GenoBank.io - Supporting Web3 wallets (MetaMask, WalletConnect), Magic Link (Google OAuth), and cross-domain SSO for all *.genobank.app applications.

## Features

- 🔐 **Web3 Authentication**: MetaMask, WalletConnect, and other Web3 wallets
- 🌐 **OAuth Integration**: Google sign-in via Magic SDK
- 🔄 **Cross-Domain SSO**: Seamless authentication across all GenoBank services
- 🛡️ **Secure Sessions**: JWT tokens with refresh capability
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## Technology Stack

- **Backend**: Node.js, Express.js
- **Authentication**: Web3 signatures, Magic SDK, JWT
- **Session Store**: Redis
- **Frontend**: Bootstrap 5, jQuery, Web3.js
- **Deployment**: Ubuntu server with nginx reverse proxy

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Genobank/genobank-auth-service.git
cd genobank-auth-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the service:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Deployment

The service is deployed at https://auth.genobank.app and managed via systemd:

```bash
sudo systemctl status genobank-auth
sudo systemctl restart genobank-auth
sudo journalctl -u genobank-auth -f
```

## API Endpoints

- `POST /auth/login` - Login with various methods
- `POST /auth/logout` - Logout and clear session
- `POST /auth/refresh` - Refresh access token
- `GET /auth/session` - Get current session info
- `GET /auth/verify-email/:token` - Verify email magic link
- `POST /auth/verify` - Verify wallet signature

## License

Proprietary - GenoBank.io

## Support

For support, please contact the GenoBank development team.
EOF
fi

# Stage all files except those in .gitignore
echo "📁 Staging files..."
git add .

# Show what will be committed
echo "📋 Files to be committed:"
git status --short

# Create the initial commit
echo "💾 Creating initial commit..."
git commit -m "🎉 Initial commit of GenoBank Auth Service

- Unified authentication service for all GenoBank applications
- Web3 wallet support (MetaMask, WalletConnect)
- Google OAuth via Magic SDK
- Cross-domain SSO with cookie-based sessions
- Beautiful responsive UI with GenoBank branding
- Redis session storage
- JWT token management
- Rate limiting and security features

🔐 Authentication methods:
- Browser wallets (MetaMask, BioWallet)
- WalletConnect with Web3Modal
- Google OAuth through Magic SDK
- Email magic links (implementation pending)

🛡️ Security features:
- Content Security Policy
- CORS protection
- Rate limiting
- Secure cookie handling
- Web3 signature verification"

echo "✅ Repository initialized successfully!"
echo ""
echo "To push to GitHub, run:"
echo "  git push -u origin main"
echo ""
echo "⚠️  Make sure you have:"
echo "  1. Set up GitHub authentication (SSH key or token)"
echo "  2. Verified no secrets are exposed"
echo "  3. Confirmed the repository exists on GitHub"