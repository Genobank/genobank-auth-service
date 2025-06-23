#!/bin/bash

# Script to expand SSL certificate to include all GenoBank subdomains

echo "🔐 Expanding SSL certificate for GenoBank domains..."

# List of all domains to include
DOMAINS=(
    "genobank.app"
    "auth.genobank.app"
    "canvas.genobank.app"
    "vcf.genobank.app"
    "bioinformatics.genobank.app"
    "claude.genobank.app"
    "cravat.genobank.app"
    "cravat-staging.genobank.app"
    "dna.genobank.app"
    "ipfs.genobank.app"
    "nvlope-staging.genobank.app"
    "somosdao.genobank.app"
    "staging.genobank.app"
)

# Build the domain list for certbot
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

echo "Domains to be included:"
for domain in "${DOMAINS[@]}"; do
    echo "  - $domain"
done

echo ""
echo "You have two options:"
echo ""
echo "Option 1: Expand existing certificate (recommended)"
echo "Run this command:"
echo ""
echo "sudo certbot certonly --nginx $DOMAIN_ARGS --expand"
echo ""
echo "Option 2: Get a wildcard certificate (requires DNS validation)"
echo "Run this command:"
echo ""
echo "sudo certbot certonly --manual --preferred-challenges dns -d 'genobank.app' -d '*.genobank.app'"
echo ""
echo "Note: Option 2 requires adding TXT records to your DNS"