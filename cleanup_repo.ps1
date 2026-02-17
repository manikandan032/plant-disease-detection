<#
Cleanup script for this repository.
Run this in PowerShell as administrator from your machine if you want to remove the model file and compiled caches:

    cd "a:\Project\Plant Disease"
    .\cleanup_repo.ps1

It will attempt to delete:
- backend/app/ai_engine/crop_disease_model.h5
- __pycache__ files under backend/app and backend/app/routers
#>

# delete model file (option A)
$model = 'a:\Project\Plant Disease\backend\app\ai_engine\crop_disease_model.h5'
if (Test-Path $model) {
    Remove-Item -LiteralPath $model -Force -ErrorAction Continue
    Write-Output "Removed model: $model"
} else {
    Write-Output "Model not found: $model"
}

# remove __pycache__ inside backend/app
$cache1 = 'a:\Project\Plant Disease\backend\app\__pycache__\*'
if (Test-Path (Split-Path $cache1 -Parent)) {
    Remove-Item -LiteralPath $cache1 -Force -Recurse -ErrorAction Continue
    Write-Output "Removed app __pycache__ files"
} else {
    Write-Output "No app __pycache__ found"
}

# remove __pycache__ inside routers
$cache2 = 'a:\Project\Plant Disease\backend\app\routers\__pycache__\*'
if (Test-Path (Split-Path $cache2 -Parent)) {
    Remove-Item -LiteralPath $cache2 -Force -Recurse -ErrorAction Continue
    Write-Output "Removed routers __pycache__ files"
} else {
    Write-Output "No routers __pycache__ found"
}

Write-Output "Cleanup script finished."