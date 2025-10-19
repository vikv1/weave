# Upload the layer to S3 using PowerShell

$bucket = "weave-model-storage"
$key = "layers/onnx-layer.zip"
$file = "onnx-layer.zip"

Write-Host "Uploading Lambda Layer to S3..." -ForegroundColor Cyan
Write-Host "File: $file" -ForegroundColor Gray
Write-Host "Destination: s3://$bucket/$key" -ForegroundColor Gray
Write-Host ""

# Check if file exists
if (-not (Test-Path $file)) {
    Write-Host "ERROR: $file not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the lambda directory" -ForegroundColor Yellow
    exit 1
}

# Check file size
$sizeMB = [math]::Round((Get-Item $file).Length / 1MB, 2)
Write-Host "File size: $sizeMB MB" -ForegroundColor Green
Write-Host ""

# Try AWS CLI
try {
    Write-Host "Uploading... (this may take a minute)" -ForegroundColor Yellow
    aws s3 cp $file "s3://$bucket/$key"
    
    Write-Host ""
    Write-Host "SUCCESS! Layer uploaded to S3" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Create Lambda Layer" -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Gray
    Write-Host "Run this command:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "aws lambda publish-layer-version \`" -ForegroundColor White
    Write-Host "  --layer-name onnxruntime-numpy \`" -ForegroundColor White
    Write-Host "  --description 'ONNX Runtime + NumPy' \`" -ForegroundColor White
    Write-Host "  --content S3Bucket=$bucket,S3Key=$key \`" -ForegroundColor White
    Write-Host "  --compatible-runtimes python3.11" -ForegroundColor White
    Write-Host ""
    Write-Host "OR use AWS Console:" -ForegroundColor Yellow
    Write-Host "https://console.aws.amazon.com/lambda/home?region=us-east-1#/layers" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "AWS CLI not found. Use AWS Console instead:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage" -ForegroundColor Cyan
    Write-Host "2. Create 'layers' folder (if needed)" -ForegroundColor White
    Write-Host "3. Upload: onnx-layer.zip" -ForegroundColor White
    Write-Host ""
}

