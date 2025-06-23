#!/bin/bash

# Safety check script to ensure no secrets are exposed

echo "🔍 Checking for potential secrets..."

# Check for common secret patterns
echo "Checking for API keys, tokens, and passwords..."

# Define patterns to search for
patterns=(
    "password.*=.*['\"].*['\"]"
    "api[_-]?key.*=.*['\"].*['\"]"
    "secret.*=.*['\"].*['\"]"
    "token.*=.*['\"].*['\"]"
    "private[_-]?key"
    "BEGIN RSA"
    "BEGIN PRIVATE"
    "aws_access_key"
    "aws_secret"
)

found_issues=0

# Check all JavaScript, JSON, and config files
for pattern in "${patterns[@]}"; do
    echo -n "Checking for pattern: $pattern... "
    result=$(grep -r -i -E "$pattern" --include="*.js" --include="*.json" --include="*.env.example" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | grep -v ".env.example" | grep -v "your-" | grep -v "example" | grep -v "placeholder" || true)
    if [ -n "$result" ]; then
        echo "❌ FOUND!"
        echo "$result"
        found_issues=$((found_issues + 1))
    else
        echo "✅ Clean"
    fi
done

# Check for .env file
if [ -f ".env" ]; then
    echo "⚠️  WARNING: .env file exists"
    if grep -q "^\.env$" .gitignore; then
        echo "✅ But it's properly listed in .gitignore"
    else
        echo "❌ ERROR: .env is NOT in .gitignore!"
        found_issues=$((found_issues + 1))
    fi
fi

# Check for any hardcoded localhost URLs
echo -n "Checking for hardcoded localhost URLs... "
localhost_found=$(grep -r "localhost:" --include="*.js" --include="*.html" --exclude-dir=node_modules --exclude-dir=.next . | grep -v ".env.example" | grep -v "// localhost" || true)
if [ -n "$localhost_found" ]; then
    echo "⚠️  Found (may need to be configurable):"
    echo "$localhost_found"
else
    echo "✅ Clean"
fi

# Summary
echo ""
echo "======================================"
if [ $found_issues -eq 0 ]; then
    echo "✅ No security issues found!"
    echo "The repository appears safe to commit."
else
    echo "❌ Found $found_issues potential security issues!"
    echo "Please review and fix before committing."
    exit 1
fi