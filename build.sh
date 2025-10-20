#!/bin/bash
echo "🚀 Starting custom build script..."
echo "📦 Installing dependencies..."
npm install
echo "🔨 Building with Vite..."
npm run build
echo "✅ Build completed!"