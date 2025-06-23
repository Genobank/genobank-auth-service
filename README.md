# GenoBank Auth Service

Unified authentication service for GenoBank.io - Supporting Web3 wallets (MetaMask, WalletConnect), Magic Link (Google OAuth), and cross-domain SSO for all *.genobank.app applications.

## Features

- 🔐 **Multiple Authentication Methods**
  - MetaMask / Browser Wallet
  - Email Magic Links
  - Google OAuth
  - WalletConnect
  
- 🌐 **Cross-Domain Support**
  - Unified login for all *.genobank.app domains
  - Partner site integration (*.nvlope.io)
  - Secure cross-domain cookies
  
- 🚀 **Developer-Friendly**
  - RESTful API
  - JWT tokens
  - Session management
  - Easy integration

## Quick Start

### Prerequisites

- Node.js 18+ 
- Redis 6+
- nginx
- SSL certificates for auth.genobank.app

### Installation

1. **Clone and install dependencies**
   ```bash
   cd /home/ubuntu/Genobank_APIs/auth-service
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run deployment script**
   ```bash
   sudo ./deploy.sh
   ```

## API Endpoints

### Authentication

- `POST /auth/login` - Login with various methods
- `POST /auth/logout` - Logout and clear session
- `POST /auth/refresh` - Refresh access token
- `GET /auth/session` - Get current session info

### User Management

- `GET /auth/user` - Get current user profile
- `PUT /auth/user` - Update user profile
- `POST /auth/user/link` - Link additional auth methods
- `GET /auth/user/sessions` - List active sessions

### OAuth

- `GET /auth/oauth/google` - Initiate Google OAuth
- `POST /auth/oauth/callback` - OAuth callback handler

### Session Validation

- `POST /auth/validate` - Validate access token
- `GET /auth/verify` - Verify session status

## Integration Guide

### Basic Integration

To integrate your application with the auth service:

1. **Redirect to login page**
   ```javascript
   const loginUrl = `https://auth.genobank.app?returnUrl=${encodeURIComponent(window.location.href)}&app=YourAppName`;
   window.location.href = loginUrl;
   ```

2. **Check authentication status**
   ```javascript
   const response = await fetch('https://auth.genobank.app/auth/session', {
     credentials: 'include'
   });
   const data = await response.json();
   
   if (data.authenticated) {
     console.log('User:', data.user);
   }
   ```

3. **Logout**
   ```javascript
   await fetch('https://auth.genobank.app/auth/logout', {
     method: 'POST',
     credentials: 'include'
   });
   ```

### Advanced Integration

For deeper integration, use the JavaScript SDK (coming soon):

```javascript
import { GenoBankAuth } from '@genobank/auth-sdk';

const auth = new GenoBankAuth({
  domain: 'auth.genobank.app'
});

// Login
await auth.login({ method: 'wallet' });

// Get user
const user = await auth.getUser();

// Subscribe to auth changes
auth.onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (production/development) | production |
| `PORT` | Server port | 4000 |
| `JWT_ACCESS_SECRET` | Secret for access tokens | (required) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | (required) |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `GENOBANK_API_URL` | GenoBank API URL | https://genobank.app |
| `MAGIC_API_KEY` | Magic Link API key | (required) |
| `ALLOWED_ORIGINS` | Allowed CORS origins | https://*.genobank.app,https://*.nvlope.io |

### nginx Configuration

The service includes an nginx configuration template. Key features:
- SSL/TLS termination
- CORS headers for cross-domain requests
- WebSocket support
- Security headers
- Caching for static assets

### SSL Certificates

Ensure SSL certificates are properly configured:
```bash
# Using Let's Encrypt
certbot certonly --nginx -d auth.genobank.app
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

### Project Structure

```
auth-service/
├── src/
│   ├── server.js           # Express server setup
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   └── utils/            # Utilities
├── public/               # Static files
│   ├── index.html       # Login page
│   ├── css/            # Stylesheets
│   ├── js/             # Client scripts
│   └── images/         # Assets
├── .env.example        # Environment template
├── package.json        # Dependencies
└── deploy.sh          # Deployment script
```

## Security

### Best Practices

1. **Secrets Management**
   - Use strong, unique JWT secrets
   - Rotate secrets regularly
   - Never commit secrets to version control

2. **Cookie Security**
   - HTTPOnly cookies prevent XSS attacks
   - Secure flag ensures HTTPS-only transmission
   - SameSite=Lax prevents CSRF attacks

3. **Rate Limiting**
   - Login endpoints are rate-limited
   - Prevents brute force attacks

4. **Input Validation**
   - All inputs are validated
   - SQL injection prevention
   - XSS protection

## Monitoring

### Health Checks

```bash
# Check service health
curl https://auth.genobank.app/health

# Check service status
systemctl status genobank-auth

# View logs
journalctl -u genobank-auth -f
```

### Metrics

The service exposes metrics for monitoring:
- Request count and latency
- Authentication success/failure rates
- Active session count
- Error rates

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your domain is in ALLOWED_ORIGINS
   - Check nginx CORS headers

2. **Cookie Not Set**
   - Verify HTTPS is enabled
   - Check domain configuration
   - Ensure credentials: 'include' in requests

3. **Service Won't Start**
   - Check Redis connection
   - Verify .env configuration
   - Review logs: `journalctl -u genobank-auth -n 100`

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug node src/server.js
```

## Migration Guide

### From Individual Auth Pages

1. Update login buttons to redirect to auth.genobank.app
2. Replace local auth logic with session checks
3. Update logout to use centralized endpoint
4. Test thoroughly with your domain

### Example Migration

```javascript
// Before (local auth)
const handleLogin = async () => {
  const signature = await wallet.signMessage('...');
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ signature })
  });
};

// After (unified auth)
const handleLogin = () => {
  window.location.href = `https://auth.genobank.app?returnUrl=${window.location.href}`;
};
```

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/genobank/auth-service/issues)
- Documentation: [Auth Service Docs](https://docs.genobank.io/auth)
- Email: support@genobank.io

## License

Copyright © 2025 GenoBank.io. All rights reserved.