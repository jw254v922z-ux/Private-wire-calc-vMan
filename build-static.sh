#!/bin/bash
set -e

echo "🔨 Building static webpage..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# Replace files with static versions
echo "🔄 Preparing static build..."
cp client/src/main.static.tsx client/src/main.tsx
cp client/src/App.static.tsx client/src/App.tsx
cp client/src/pages/Dashboard.static.tsx client/src/pages/Dashboard.tsx

# Build with Vite - use the standard vite.config.ts but output to dist-static
echo "🏗️  Building with Vite..."
pnpm exec vite build --outDir dist-static

echo "✅ Static build complete!"
echo "📁 Output: dist-static/"
echo "🚀 Ready to deploy to GitHub Pages, Netlify, or Vercel"
