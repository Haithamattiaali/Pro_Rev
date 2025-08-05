# Node.js Complete Cache Clear Script for Windows
# This script removes all Node.js caches, dependencies, and build artifacts

Write-Host "🧹 Starting complete Node.js cache cleanup..." -ForegroundColor Green
Write-Host ""

# Function to remove items safely
function Remove-ItemSafely {
    param($Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Removed $Path" -ForegroundColor Green
    }
}

# 1. Stop all running Node processes
Write-Host "📋 Step 1: Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -match "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✓ Node processes stopped" -ForegroundColor Green
Write-Host ""

# 2. Remove dependencies and lock files
Write-Host "📋 Step 2: Removing dependencies and lock files..." -ForegroundColor Yellow
$itemsToRemove = @(
    "node_modules",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".pnpm"
)

foreach ($item in $itemsToRemove) {
    Remove-ItemSafely $item
}
Write-Host ""

# 3. Clear package manager caches
Write-Host "📋 Step 3: Clearing package manager caches..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm cache clean --force
    Write-Host "✓ npm cache cleared" -ForegroundColor Green
}

if (Get-Command yarn -ErrorAction SilentlyContinue) {
    yarn cache clean
    Write-Host "✓ yarn cache cleared" -ForegroundColor Green
}

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm store prune
    Write-Host "✓ pnpm store pruned" -ForegroundColor Green
}
Write-Host ""

# 4. Remove ALL build artifacts
Write-Host "📋 Step 4: Removing build artifacts..." -ForegroundColor Yellow
$buildArtifacts = @(
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".cache",
    ".parcel-cache",
    "coverage",
    ".turbo",
    ".svelte-kit",
    "out",
    "public\build",
    ".vite",
    ".rollup.cache",
    ".webpack",
    ".eslintcache",
    ".stylelintcache",
    ".tmp",
    "temp",
    ".temp"
)

foreach ($artifact in $buildArtifacts) {
    Remove-ItemSafely $artifact
}
Write-Host ""

# 5. Clear global npm/yarn/pnpm caches
Write-Host "📋 Step 5: Clearing global package manager caches..." -ForegroundColor Yellow
Write-Host "⚠️  Warning: This will clear global caches for ALL projects!" -ForegroundColor Red
$response = Read-Host "Do you want to clear global caches? (y/N)"

if ($response -eq 'y' -or $response -eq 'Y') {
    $globalCaches = @(
        "$env:USERPROFILE\.npm",
        "$env:USERPROFILE\.yarn",
        "$env:USERPROFILE\.pnpm",
        "$env:USERPROFILE\.node-gyp",
        "$env:USERPROFILE\.node_repl_history",
        "$env:LOCALAPPDATA\npm-cache",
        "$env:LOCALAPPDATA\Yarn"
    )
    
    foreach ($cache in $globalCaches) {
        Remove-ItemSafely $cache
    }
} else {
    Write-Host "⏭️  Skipping global cache cleanup" -ForegroundColor Yellow
}
Write-Host ""

# 6. Additional cleanup
Write-Host "📋 Step 6: Additional cleanup..." -ForegroundColor Yellow
$additionalPatterns = @(
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "lerna-debug.log*",
    ".npm",
    ".yarn-integrity"
)

foreach ($pattern in $additionalPatterns) {
    Get-ChildItem -Path . -Filter $pattern -ErrorAction SilentlyContinue | Remove-Item -Force
}
Write-Host "✓ Additional cleanup complete" -ForegroundColor Green
Write-Host ""

# 7. Verify caches cleared
Write-Host "📋 Step 7: Verifying cleanup..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm cache verify
}

Write-Host ""
Write-Host "📁 Current directory contents:" -ForegroundColor Yellow
Get-ChildItem | Where-Object {$_.Name -match "(node_modules|dist|build|cache)"} | Format-Table Name, LastWriteTime

Write-Host ""
Write-Host "✅ Cache cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm install' (or yarn/pnpm install) to reinstall dependencies"
Write-Host "2. Run your build command to regenerate build artifacts"