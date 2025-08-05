#!/bin/bash

# Node.js Complete Cache Clear Script
# This script removes all Node.js caches, dependencies, and build artifacts

echo "🧹 Starting complete Node.js cache cleanup..."
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Stop all running processes
echo "📋 Step 1: Stopping Node.js processes..."
if command_exists pkill; then
    pkill -f node || true
    pkill -f npm || true
    echo "✓ Node processes stopped"
else
    echo "⚠️  pkill not available, please manually stop Node processes"
fi
echo ""

# 2. Remove dependencies and lock files
echo "📋 Step 2: Removing dependencies and lock files..."
directories_to_remove=(
    "node_modules"
    "package-lock.json"
    "yarn.lock"
    "pnpm-lock.yaml"
    ".pnpm"
)

for item in "${directories_to_remove[@]}"; do
    if [ -e "$item" ]; then
        rm -rf "$item"
        echo "✓ Removed $item"
    fi
done
echo ""

# 3. Clear package manager caches
echo "📋 Step 3: Clearing package manager caches..."
if command_exists npm; then
    npm cache clean --force
    echo "✓ npm cache cleared"
fi

if command_exists yarn; then
    yarn cache clean
    echo "✓ yarn cache cleared"
fi

if command_exists pnpm; then
    pnpm store prune
    echo "✓ pnpm store pruned"
fi
echo ""

# 4. Remove ALL build artifacts
echo "📋 Step 4: Removing build artifacts..."
build_artifacts=(
    "dist"
    "build"
    ".next"
    ".nuxt"
    ".cache"
    ".parcel-cache"
    "coverage"
    ".turbo"
    ".svelte-kit"
    "out"
    "public/build"
    ".vite"
    ".rollup.cache"
    ".webpack"
    ".eslintcache"
    ".stylelintcache"
    ".tmp"
    "temp"
    ".temp"
    # Deployment artifacts
    "*.zip"
    ".netlify"
    ".vercel"
    ".render"
    "deploy-*.sh"
    "*backup*"
    # GitHub artifacts
    ".github"
)

for artifact in "${build_artifacts[@]}"; do
    if [ -e "$artifact" ]; then
        rm -rf "$artifact"
        echo "✓ Removed $artifact"
    fi
done
echo ""

# 5. Clear global npm/yarn/pnpm caches
echo "📋 Step 5: Clearing global package manager caches..."
global_caches=(
    "$HOME/.npm"
    "$HOME/.yarn"
    "$HOME/.pnpm"
    "$HOME/.node-gyp"
    "$HOME/.node_repl_history"
)

echo "⚠️  Warning: This will clear global caches for ALL projects!"
read -p "Do you want to clear global caches? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    for cache in "${global_caches[@]}"; do
        if [ -e "$cache" ]; then
            rm -rf "$cache"
            echo "✓ Removed $cache"
        fi
    done
else
    echo "⏭️  Skipping global cache cleanup"
fi
echo ""

# 6. Additional cleanup (optional)
echo "📋 Step 6: Additional cleanup..."
# Remove other common cache/temp files
additional_items=(
    "*.log"
    "npm-debug.log*"
    "yarn-debug.log*"
    "yarn-error.log*"
    "lerna-debug.log*"
    ".npm"
    ".yarn-integrity"
    ".env.local"
    ".env.*.local"
)

for pattern in "${additional_items[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        rm -f $pattern
        echo "✓ Removed $pattern files"
    fi
done
echo ""

# 7. Verify caches cleared
echo "📋 Step 7: Verifying cleanup..."
if command_exists npm; then
    npm cache verify
fi

echo ""
echo "📁 Current directory contents:"
ls -la | grep -E "(node_modules|dist|build|cache)" || echo "✓ No build artifacts found"

echo ""
echo "✅ Cache cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' (or yarn/pnpm install) to reinstall dependencies"
echo "2. Run your build command to regenerate build artifacts"
echo ""
echo "Optional: Run this script with 'watch' to monitor cleanup:"
echo "  watch -n 2 'ls -la | grep -E \"(node_modules|dist|build)\"'"