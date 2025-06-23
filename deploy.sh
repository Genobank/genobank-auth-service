#!/bin/bash

# GenoBank Unified Authentication Service Deployment Script

set -e

echo "🚀 Starting GenoBank Auth Service deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}" 
   exit 1
fi

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Install dependencies
echo -e "\n${GREEN}Step 1: Installing dependencies...${NC}"
cd /home/ubuntu/Genobank_APIs/auth-service

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js first."
    exit 1
fi

# Install Node.js dependencies
su - ubuntu -c "cd /home/ubuntu/Genobank_APIs/auth-service && npm install"
print_status "Node.js dependencies installed"

# Step 2: Check Redis
echo -e "\n${GREEN}Step 2: Checking Redis...${NC}"
if systemctl is-active --quiet redis; then
    print_status "Redis is running"
else
    print_warning "Redis is not running. Starting Redis..."
    systemctl start redis
    systemctl enable redis
    print_status "Redis started and enabled"
fi

# Step 3: Set up environment file
echo -e "\n${GREEN}Step 3: Setting up environment...${NC}"
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration"
    print_warning "Especially update JWT secrets and API keys"
else
    print_status ".env file exists"
fi

# Step 4: Install systemd service
echo -e "\n${GREEN}Step 4: Installing systemd service...${NC}"
cp auth.service /etc/systemd/system/genobank-auth.service
systemctl daemon-reload
print_status "Systemd service installed"

# Step 5: Set up nginx
echo -e "\n${GREEN}Step 5: Setting up nginx...${NC}"
if [ -f /etc/nginx/conf.d/auth.genobank.app.conf ]; then
    print_warning "Nginx config already exists. Creating backup..."
    cp /etc/nginx/conf.d/auth.genobank.app.conf /etc/nginx/conf.d/auth.genobank.app.conf.bak
fi

cp nginx-auth.conf /etc/nginx/conf.d/auth.genobank.app.conf
print_status "Nginx configuration installed"

# Test nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
    systemctl reload nginx
    print_status "Nginx reloaded"
else
    print_error "Nginx configuration is invalid. Please check the configuration."
    exit 1
fi

# Step 6: Set permissions
echo -e "\n${GREEN}Step 6: Setting permissions...${NC}"
chown -R ubuntu:ubuntu /home/ubuntu/Genobank_APIs/auth-service
chmod +x deploy.sh
print_status "Permissions set"

# Step 7: Start the service
echo -e "\n${GREEN}Step 7: Starting the auth service...${NC}"
systemctl enable genobank-auth
systemctl start genobank-auth

# Check if service started successfully
sleep 2
if systemctl is-active --quiet genobank-auth; then
    print_status "GenoBank Auth service is running"
else
    print_error "Failed to start GenoBank Auth service"
    echo "Checking logs..."
    journalctl -u genobank-auth -n 20 --no-pager
    exit 1
fi

# Step 8: Health check
echo -e "\n${GREEN}Step 8: Performing health check...${NC}"
sleep 3
curl -s http://localhost:4000/health > /dev/null
if [ $? -eq 0 ]; then
    print_status "Health check passed"
else
    print_error "Health check failed"
    echo "Checking service logs..."
    journalctl -u genobank-auth -n 20 --no-pager
fi

# Final status
echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "\nService status:"
systemctl status genobank-auth --no-pager | head -n 10

echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Update .env file with production secrets if not already done"
echo "2. Ensure SSL certificates are properly configured for auth.genobank.app"
echo "3. Update DNS to point auth.genobank.app to this server"
echo "4. Test authentication at https://auth.genobank.app"
echo ""
echo "Useful commands:"
echo "  - View logs: journalctl -u genobank-auth -f"
echo "  - Restart service: systemctl restart genobank-auth"
echo "  - Check status: systemctl status genobank-auth"
echo ""
echo "To integrate with your apps, use:"
echo "  https://auth.genobank.app?returnUrl=YOUR_APP_URL&app=YOUR_APP_NAME"