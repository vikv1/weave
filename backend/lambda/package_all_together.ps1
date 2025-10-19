# Package Lambda handler with dependencies - all in one ZIP

Write-Host "Creating all-in-one Lambda package..." -ForegroundColor Cyan
Write-Host ""

# Check if onnx-layer.zip exists
if (-not (Test-Path "onnx-layer.zip")) {
    Write-Host "ERROR: onnx-layer.zip not found!" -ForegroundColor Red
    Write-Host "Run build_layer.ps1 first to create it" -ForegroundColor Yellow
    exit 1
}

# Clean up
Write-Host "[1/4] Cleaning up..." -ForegroundColor Yellow
if (Test-Path "package_temp") { Remove-Item -Recurse -Force package_temp }
if (Test-Path "lambda-complete.zip") { Remove-Item -Force lambda-complete.zip }

# Create temp directory
Write-Host "[2/4] Extracting dependencies..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "package_temp" | Out-Null

# Extract the layer (has python/ folder with all dependencies)
Expand-Archive -Path "onnx-layer.zip" -DestinationPath "package_temp" -Force

# Move contents of python/ folder to root
if (Test-Path "package_temp\python") {
    Get-ChildItem -Path "package_temp\python" | Move-Item -Destination "package_temp" -Force
    Remove-Item -Path "package_temp\python" -Force
}

# Add the Lambda handler
Write-Host "[3/4] Adding Lambda handler..." -ForegroundColor Yellow
Copy-Item "inference_onnx.py" -Destination "package_temp\inference_onnx.py"

# Create final zip
Write-Host "[4/4] Creating final package..." -ForegroundColor Yellow
Compress-Archive -Path "package_temp\*" -DestinationPath "lambda-complete.zip" -Force

# Get size
$sizeMB = [math]::Round((Get-Item "lambda-complete.zip").Length / 1MB, 2)

# Clean up
Remove-Item -Recurse -Force package_temp

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Created: lambda-complete.zip ($sizeMB MB)" -ForegroundColor Green
Write-Host ""
Write-Host "This package contains:" -ForegroundColor Yellow
Write-Host "  - inference_onnx.py (your handler)" -ForegroundColor White
Write-Host "  - onnxruntime (Linux)" -ForegroundColor White
Write-Host "  - numpy (Linux)" -ForegroundColor White
Write-Host "  - All dependencies" -ForegroundColor White
Write-Host ""
Write-Host "Upload to Lambda:" -ForegroundColor Yellow
Write-Host "  1. Upload to S3: s3://weave-model-storage/lambda/lambda-complete.zip" -ForegroundColor Cyan
Write-Host "  2. In Lambda Console: Upload from S3" -ForegroundColor Cyan
Write-Host "  3. No layers needed!" -ForegroundColor Green
Write-Host ""

