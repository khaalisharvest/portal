#!/bin/bash

# Khaalis Harvest - Production Environment Setup Script
# This script helps create .env file from env.template for Azure deployment

echo "🚀 Khaalis Harvest - Production Environment Setup"
echo "=================================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "❌ Cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy template
echo "📋 Copying env.template to .env..."
cp env.template .env

# Get Azure Public IP
echo ""
read -p "Enter your Azure VM Public IP (e.g., 4.213.98.234): " PUBLIC_IP

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ Public IP is required. Exiting."
    exit 1
fi

# Generate secure password for database
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "🔐 Generated secure database password"

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)
echo "🔑 Generated secure JWT secret"

# Replace placeholders
echo "🔧 Updating .env file with your configuration..."

# Replace Public IP
sed -i.bak "s|<YOUR_PUBLIC_IP>|$PUBLIC_IP|g" .env

# Replace DB Password
sed -i.bak "s|<REPLACE_THIS_WITH_SECURE_PASSWORD>|$DB_PASSWORD|g" .env

# Replace JWT Secret
sed -i.bak "s|<REPLACE_THIS_WITH_RANDOM_32_CHAR_MIN_SECRET>|$JWT_SECRET|g" .env

# Clean up backup file
rm -f .env.bak

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "📝 Summary:"
echo "   Public IP: $PUBLIC_IP"
echo "   Database Password: $DB_PASSWORD"
echo "   JWT Secret: $JWT_SECRET"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
echo "🌐 Your application URLs will be:"
echo "   Frontend: http://$PUBLIC_IP:3001"
echo "   Backend API: http://$PUBLIC_IP:3000/api/v1"
echo ""
echo "✅ Ready to deploy! Run: docker-compose -f docker-compose.prod.yml up -d --build"

