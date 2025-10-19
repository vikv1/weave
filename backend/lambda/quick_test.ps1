# Quick test of Lambda Function URL
$url = "https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/"

Write-Host "`nTesting Lambda Function..." -ForegroundColor Cyan
Write-Host "URL: $url`n" -ForegroundColor Gray

$body = @{
    uid = "user123"
    model_name = "sentiment-model.onnx"
    input = "This product is amazing! I love it!"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "Body: $body`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    
    if ($response.prediction) {
        Write-Host "`nSentiment: $($response.prediction.sentiment)" -ForegroundColor Cyan
        Write-Host "Confidence: $($response.prediction.confidence * 100)%" -ForegroundColor Cyan
        Write-Host "Latency: $($response.latency_ms)ms" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}

