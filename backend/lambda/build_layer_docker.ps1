# Build AWS Lambda Layer using Docker (Windows PowerShell)
# Requires: Docker Desktop installed and running

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Lambda Layer with Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[0/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "      Docker is installed ✓" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Docker not found!" -ForegroundColor Red
    Write-Host "      Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Clean up previous builds
Write-Host ""
Write-Host "[1/5] Cleaning up previous builds..." -ForegroundColor Yellow
if (Test-Path "python") { Remove-Item -Recurse -Force python }
if (Test-Path "onnx-layer.zip") { Remove-Item -Force onnx-layer.zip }

# Create python directory
Write-Host "[2/5] Creating layer structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "python" | Out-Null

# Build layer using Docker
Write-Host "[3/5] Installing packages in Lambda environment..." -ForegroundColor Yellow
Write-Host "      (This may take a few minutes...)" -ForegroundColor Gray
Write-Host ""

# Get current directory for Docker volume mount
$currentDir = (Get-Location).Path

docker run --rm `
  -v "${currentDir}:/var/task" `
  public.ecr.aws/lambda/python:3.11 `
  bash -c "pip install onnxruntime==1.20.1 numpy==1.26.4 -t /var/task/python/ --no-cache-dir"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker command failed!" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is running" -ForegroundColor Yellow
    exit 1
}

# Create zip file
Write-Host ""
Write-Host "[4/5] Creating layer zip file..." -ForegroundColor Yellow

# Use PowerShell's Compress-Archive or 7-Zip
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    # Use 7-Zip if available (better compression)
    7z a -tzip onnx-layer.zip python\ -r | Out-Null
} else {
    # Use PowerShell built-in compression
    Compress-Archive -Path "python\*" -DestinationPath "onnx-layer.zip" -Force
}

$size = (Get-Item "onnx-layer.zip").Length / 1MB
$sizeStr = "{0:N2} MB" -f $size
Write-Host "[SUCCESS] Layer created: onnx-layer.zip ($sizeStr)" -ForegroundColor Green

# Clean up
Write-Host "[5/5] Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force python

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Layer Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPTION A: Upload via AWS Console (Easiest)" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Gray
Write-Host "1. Go to S3: https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage"
Write-Host "   - Create 'layers' folder if needed"
Write-Host "   - Upload: onnx-layer.zip"
Write-Host ""
Write-Host "2. Go to Lambda Layers: https://console.aws.amazon.com/lambda/home#/layers"
Write-Host "   - Click 'Create layer'"
Write-Host "   - Name: onnxruntime-numpy"
Write-Host "   - Upload from S3: s3://weave-model-storage/layers/onnx-layer.zip"
Write-Host "   - Compatible runtimes: Python 3.11"
Write-Host "   - Click 'Create'"
Write-Host ""
Write-Host "3. Add to Lambda function:"
Write-Host "   - Go to your function: weave-inference"
Write-Host "   - Scroll to 'Layers' section"
Write-Host "   - Click 'Add a layer'"
Write-Host "   - Choose 'Custom layers'"
Write-Host "   - Select: onnxruntime-numpy"
Write-Host "   - Click 'Add'"
Write-Host ""

Write-Host "OPTION B: Use AWS CLI" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Gray
Write-Host "aws s3 cp onnx-layer.zip s3://weave-model-storage/layers/onnx-layer.zip" -ForegroundColor White
Write-Host ""
Write-Host "aws lambda publish-layer-version \\" -ForegroundColor White
Write-Host "  --layer-name onnxruntime-numpy \\" -ForegroundColor White
Write-Host "  --description 'ONNX Runtime + NumPy for Lambda' \\" -ForegroundColor White
Write-Host "  --content S3Bucket=weave-model-storage,S3Key=layers/onnx-layer.zip \\" -ForegroundColor White
Write-Host "  --compatible-runtimes python3.11" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "File created: onnx-layer.zip" -ForegroundColor Green
Write-Host "Size: $sizeStr" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

