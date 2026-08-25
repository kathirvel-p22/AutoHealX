# Fix TypeScript Import Issues - Simple Version
Write-Host "AutoHealX Phase 2 - TypeScript Fixes"
Write-Host "====================================="
Write-Host ""

# Step 1: Install missing type definitions
Write-Host "Step 1: Installing missing type definitions..."
npm install --save-dev @types/pg
Write-Host "Done: Type definitions installed"
Write-Host ""

# Step 2: Fix controller logger imports
Write-Host "Step 2: Fixing controller logger imports..."
$controllers = Get-ChildItem -Path "src/controllers" -Filter "*Controller.ts" -File
$fixedCount = 0
foreach ($file in $controllers) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix logger import - use single quotes to avoid issues
    $content = $content.Replace('import { logger } from', 'import logger from')
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host "Fixed: $($file.Name)"
    }
}
Write-Host "Fixed $fixedCount controller files"
Write-Host ""

# Step 3: Fix model sequelize imports
Write-Host "Step 3: Fixing model sequelize imports..."
$models = Get-ChildItem -Path "src/models" -Filter "*.ts" -File -Exclude "index.ts"
$fixedCount = 0
foreach ($file in $models) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix sequelize import
    $content = $content.Replace('import { sequelize } from', 'import sequelize from')
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host "Fixed: $($file.Name)"
    }
}
Write-Host "Fixed $fixedCount model files"
Write-Host ""

# Step 4: Fix middleware logger imports
Write-Host "Step 4: Fixing middleware logger imports..."
$middleware = Get-ChildItem -Path "src/middleware" -Filter "*Agent.ts" -File
$fixedCount = 0
foreach ($file in $middleware) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix logger import
    $content = $content.Replace('import { logger } from', 'import logger from')
    
    if ($content -ne $original) {
        Set-Content $file.FullName $content
        $fixedCount++
        Write-Host "Fixed: $($file.Name)"
    }
}
Write-Host "Fixed $fixedCount middleware files"
Write-Host ""

Write-Host "====================================="
Write-Host "Fix script complete!"
Write-Host ""
Write-Host "Next: Start PostgreSQL and run migration"
