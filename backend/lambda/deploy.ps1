# PowerShell deployment script for Lambda function
# Run this script to deploy to AWS

$ErrorActionPreference = "Stop"

$FUNCTION_NAME = "weave-inference"
$ZIP_FILE = "lambda-deployment.zip"
$BUCKET = "weave-model-storage"
$S3_KEY = "lambda/$ZIP_FILE"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING TO AWS LAMBDA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if zip exists
if (-not (Test-Path $ZIP_FILE)) {
    Write-Host "`n[ERROR] $ZIP_FILE not found!" -ForegroundColor Red
    Write-Host "Run 'python deploy.py' first to create the package." -ForegroundColor Yellow
    exit 1
}

$size = (Get-Item $ZIP_FILE).Length / 1MB
Write-Host "`n[INFO] Package: $ZIP_FILE ($($size.ToString('0.00')) MB)" -ForegroundColor Green

# Step 1: Upload to S3
Write-Host "`n[STEP 1/4] Uploading to S3..." -ForegroundColor Yellow
try {
    aws s3 cp $ZIP_FILE "s3://$BUCKET/$S3_KEY"
    Write-Host "[SUCCESS] Uploaded to S3" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to upload to S3" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Update Lambda function code
Write-Host "`n[STEP 2/4] Updating Lambda function..." -ForegroundColor Yellow
try {
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --s3-bucket $BUCKET `
        --s3-key $S3_KEY
    Write-Host "[SUCCESS] Lambda code updated" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to update Lambda function" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 3: Update configuration
Write-Host "`n[STEP 3/4] Updating configuration..." -ForegroundColor Yellow
try {
    aws lambda update-function-configuration `
        --function-name $FUNCTION_NAME `
        --memory-size 1024 `
        --timeout 30
    Write-Host "[SUCCESS] Configuration updated" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Configuration update may have failed" -ForegroundColor Yellow
}

# Step 4: Set environment variables
Write-Host "`n[STEP 4/4] Setting environment variables..." -ForegroundColor Yellow
try {
    aws lambda update-function-configuration `
        --function-name $FUNCTION_NAME `
        --environment "Variables={MODEL_BUCKET=weave-model-storage}"
    Write-Host "[SUCCESS] Environment variables set" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Environment update may have failed" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nFunction: $FUNCTION_NAME" -ForegroundColor White
Write-Host "Handler: inference_onnx.lambda_handler" -ForegroundColor White
Write-Host "Memory: 1024 MB" -ForegroundColor White
Write-Host "Timeout: 30 seconds" -ForegroundColor White

Write-Host "`nTo test the function:" -ForegroundColor Yellow
Write-Host "  aws lambda invoke --function-name $FUNCTION_NAME --payload file://test_event.json response.json" -ForegroundColor Cyan
Write-Host "  Get-Content response.json" -ForegroundColor Cyan

Write-Host "`n[SUCCESS] All done! Lambda is ready to use." -ForegroundColor Green

