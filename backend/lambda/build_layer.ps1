# Build AWS Lambda Layer using Docker

Write-Host "Building Lambda Layer with Docker..." -ForegroundColor Cyan

# Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "   Docker OK" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Docker not found!" -ForegroundColor Red
    exit 1
}

# Clean up
Write-Host "[2/5] Cleaning up..." -ForegroundColor Yellow
if (Test-Path "python") { Remove-Item -Recurse -Force python }
if (Test-Path "onnx-layer.zip") { Remove-Item -Force onnx-layer.zip }

# Create directory
Write-Host "[3/5] Creating structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "python" | Out-Null

# Build with Docker
Write-Host "[4/5] Installing packages (this takes a minute)..." -ForegroundColor Yellow
$currentDir = (Get-Location).Path
docker run --rm --entrypoint bash -v "${currentDir}:/var/task" public.ecr.aws/lambda/python:3.11 -c "pip install --upgrade pip && pip install onnxruntime 'numpy<2.0' --only-binary=:all: -t /var/task/python/ --no-cache-dir"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed!" -ForegroundColor Red
    exit 1
}

# Create zip
Write-Host "[5/5] Creating zip..." -ForegroundColor Yellow
Compress-Archive -Path "python\*" -DestinationPath "onnx-layer.zip" -Force

# Get size
$sizeMB = [math]::Round((Get-Item "onnx-layer.zip").Length / 1MB, 2)

# Clean up
Remove-Item -Recurse -Force python

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Created: onnx-layer.zip ($sizeMB MB)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload to S3 Console: weave-model-storage/layers/"
Write-Host "2. Create Lambda Layer from S3"
Write-Host "3. Add layer to weave-inference function"
Write-Host ""
Write-Host "See DOCKER_LAYER_GUIDE.md for details" -ForegroundColor Gray

