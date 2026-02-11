# Run this script when you're ready to install TensorFlow
# PowerShell script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TensorFlow Lite Installation Script  " -ForegroundColor Cyan
Write-Host "  for Bridging Silence App              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will install:" -ForegroundColor Yellow
Write-Host "  - @tensorflow/tfjs" -ForegroundColor White
Write-Host "  - @tensorflow/tfjs-react-native" -ForegroundColor White
Write-Host "  - @tensorflow-models/hand-pose-detection" -ForegroundColor White
Write-Host "  - @react-native-async-storage/async-storage" -ForegroundColor White
Write-Host "  - @tensorflow/tfjs-backend-webgl" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? (Y/N)"

if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
    Write-Host ""
    Write-Host "Installing TensorFlow dependencies..." -ForegroundColor Green
    Write-Host ""
    
    npm install --save @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow-models/hand-pose-detection @react-native-async-storage/async-storage @tensorflow/tfjs-backend-webgl
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Installation Successful!              " -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Run 'npm start' to test the app" -ForegroundColor White
        Write-Host "2. Let the AI assistant know: 'TensorFlow installed'" -ForegroundColor White
        Write-Host "3. Continue with hand detection integration" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  Installation Failed!                  " -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Try these solutions:" -ForegroundColor Yellow
        Write-Host "1. Clear npm cache: npm cache clean --force" -ForegroundColor White
        Write-Host "2. Delete node_modules and reinstall: rm -rf node_modules; npm install" -ForegroundColor White
        Write-Host "3. Try with --legacy-peer-deps flag" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    Write-Host "Run this script again when you're ready." -ForegroundColor Yellow
    Write-Host ""
}
