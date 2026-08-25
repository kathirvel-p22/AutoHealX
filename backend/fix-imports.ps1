# Fix TypeScript Import Issues
# This script fixes common import/export issues in the Phase 2 codebase

Write-Host "🔧 AutoHealX Phase 2 - TypeScript Fixes" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install missing type definitions
Write-Host "📦 Step 1: Installing missing type definitions..." -ForegroundColor Yellow
npm install --save-dev @types/pg
Write-Host "✅ Type definitions installed" -ForegroundColor Green
Write-Host ""

# Step 2: Fix logger exports
Write-Host "📝 Step 2: Fixing logger import/export..." -ForegroundColor Yellow
$loggerFile = "src/logging/logger.ts"
if (Test-Path $loggerFile) {
    $content = Get-Content $loggerFile -Raw
    # Ensure default export
    if ($content -notmatch "export default logger") {
        $content += "`n`nexport default logger;"
        Set-Content $loggerFile $content
        Write-Host "✅ Logger export fixed" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Logger already has default export" -ForegroundColor Blue
    }
} else {
    Write-Host "⚠️  Logger file not found" -ForegroundColor Red
}
Write-Host ""

# Step 3: Fix database/sequelize exports
Write-Host "📝 Step 3: Fixing database/sequelize exports..." -ForegroundColor Yellow
$dbFile = "src/config/database.ts"
if (Test-Path $dbFile) {
    $content = Get-Content $dbFile -Raw
    # Ensure default export
    if ($content -notmatch "export default sequelize") {
        $content += "`n`nexport default sequelize;"
        Set-Content $dbFile $content
        Write-Host "✅ Database export fixed" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Database already has default export" -ForegroundColor Blue
    }
} else {
    Write-Host "⚠️  Database config file not found" -ForegroundColor Red
}
Write-Host ""

# Step 4: Fix controller logger imports
Write-Host "📝 Step 4: Fixing controller logger imports..." -ForegroundColor Yellow
$controllers = Get-ChildItem -Path "src/controllers" -Filter "*.ts" -File
$fixedCount = 0
foreach ($file in $controllers) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix logger import
    $content = $content -replace "import \{ logger \} from '../logging/logger';", "import logger from '../logging/logger';"
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host "  ✅ Fixed: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "✅ Fixed $fixedCount controller files" -ForegroundColor Green
Write-Host ""

# Step 5: Fix model sequelize imports
Write-Host "📝 Step 5: Fixing model sequelize imports..." -ForegroundColor Yellow
$models = Get-ChildItem -Path "src/models" -Filter "*.ts" -File -Exclude "index.ts"
$fixedCount = 0
foreach ($file in $models) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix sequelize import
    $content = $content -replace "import \{ sequelize \} from '../config/database';", "import sequelize from '../config/database';"
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host "  ✅ Fixed: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "✅ Fixed $fixedCount model files" -ForegroundColor Green
Write-Host ""

# Step 6: Fix middleware logger imports
Write-Host "📝 Step 6: Fixing middleware logger imports..." -ForegroundColor Yellow
$middleware = Get-ChildItem -Path "src/middleware" -Filter "*.ts" -File
$fixedCount = 0
foreach ($file in $middleware) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix logger import
    $content = $content -replace "import \{ logger \} from '../logging/logger';", "import logger from '../logging/logger';"
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host "  ✅ Fixed: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "✅ Fixed $fixedCount middleware files" -ForegroundColor Green
Write-Host ""

# Step 7: Verify TypeScript compilation
Write-Host "🔍 Step 7: Verifying TypeScript compilation..." -ForegroundColor Yellow
Write-Host "Running: npx tsc --noEmit" -ForegroundColor Gray
$output = npx tsc --noEmit 2>&1
$errors = ($output | Select-String "error TS").Count

if ($errors -eq 0) {
    Write-Host "✅ TypeScript compilation successful!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $errors TypeScript errors" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Remaining errors:" -ForegroundColor Yellow
    $output | Select-String "error TS" | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 Some errors may require manual fixes" -ForegroundColor Blue
}
Write-Host ""

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "🎉 Fix script complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Docker Desktop (or PostgreSQL)" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d postgres" -ForegroundColor White
Write-Host "3. Run: npm run migrate" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White
Write-Host ""
