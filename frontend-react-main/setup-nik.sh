#!/bin/bash

echo "🚀 Setup Fitur NIK Configuration"
echo "=================================="

# 1. Setup Backend
echo "📦 Setup Backend..."
cd backend

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

echo "✅ Backend setup completed"

# 2. Setup Frontend
echo "📦 Setup Frontend..."
cd ..

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

echo "✅ Frontend setup completed"

# 3. Check environment variables
echo "🔍 Checking environment variables..."

if [ -z "$VITE_API_URL" ]; then
    echo "⚠️  Warning: VITE_API_URL not set"
    echo "   Please set VITE_API_URL in your .env file"
    echo "   Example: VITE_API_URL=http://localhost:3001"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL not set"
    echo "   Please set DATABASE_URL in your backend/.env file"
fi

# 4. Instructions
echo ""
echo "🎯 Next Steps:"
echo "==============="
echo "1. Setup Database:"
echo "   - Go to Supabase Dashboard > SQL Editor"
echo "   - Run the SQL from setup-nik-feature.md"
echo ""
echo "2. Start Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start Frontend:"
echo "   npm run dev"
echo ""
echo "4. Test the feature:"
echo "   - Login as SuperAdmin"
echo "   - Go to 'Konfigurasi NIK' menu"
echo "   - Test create/edit/delete configurations"
echo ""
echo "✅ Setup script completed!"
echo "📖 See setup-nik-feature.md for detailed instructions" 