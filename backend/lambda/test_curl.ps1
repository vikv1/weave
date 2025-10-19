# PowerShell script to test Lambda function
$LAMBDA_URL = "https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Testing Lambda Function URL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: $LAMBDA_URL" -ForegroundColor Green
Write-Host ""

# Test 1: Positive sentiment
Write-Host "Test 1: Positive Sentiment" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$body1 = @{
    uid = "user123"
    model_name = "sentiment-model.onnx"
    input = "This product is amazing! I love it!"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $LAMBDA_URL -Method Post -Body $body1 -ContentType "application/json"
    Write-Host ($response1 | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 2: Negative sentiment
Write-Host "Test 2: Negative Sentiment" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$body2 = @{
    uid = "user123"
    model_name = "sentiment-model.onnx"
    input = "Terrible quality. Would not recommend."
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $LAMBDA_URL -Method Post -Body $body2 -ContentType "application/json"
    Write-Host ($response2 | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 3: Another positive
Write-Host "Test 3: Enthusiastic Review" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$body3 = @{
    uid = "user123"
    model_name = "sentiment-model.onnx"
    input = "Best purchase ever! Highly recommend!"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $LAMBDA_URL -Method Post -Body $body3 -ContentType "application/json"
    Write-Host ($response3 | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Tests Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

