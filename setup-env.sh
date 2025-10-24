#!/bin/bash

# Khaalis Harvest - Environment Setup Script

echo "🌿 Khaalis Harvest Environment Setup"
echo "=================================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy example to .env
echo "📋 Creating .env file from template..."
cp env.template .env

echo "✅ .env file created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your values: nano .env"
echo "2. Run the application: ./deploy.sh"
echo ""
echo "🔧 Environment file locations:"
echo "   - Template: .env.example"
echo "   - Local: .env"
echo "   - Production: .env.production (create manually)"
echo ""
echo "🚀 Ready to deploy!"
