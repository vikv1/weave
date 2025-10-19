# Deploy Lambda Function to AWS

## Package Created ✅
- **File:** `lambda-deployment.zip`
- **Size:** 53.29 MB
- **Contains:** inference_onnx.py + onnxruntime + numpy

## Deployment Options

### Option 1: AWS Console (Easiest)

1. **Upload to S3 first** (since package is >50MB):
   - Go to S3 Console: https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage
   - Navigate to or create folder: `lambda/`
   - Upload `lambda-deployment.zip` to `s3://weave-model-storage/lambda/`

2. **Update Lambda function**:
   - Go to Lambda Console: https://console.aws.amazon.com/lambda
   - Find function: `weave-inference`
   - Click "Upload from" → "Amazon S3 location"
   - Enter: `s3://weave-model-storage/lambda/lambda-deployment.zip`
   - Click "Save"

3. **Update Configuration**:
   - Go to Configuration tab
   - General configuration:
     - Memory: `1024 MB`
     - Timeout: `30 seconds`
   - Environment variables:
     - Key: `MODEL_BUCKET`, Value: `weave-model-storage`
   - Handler: `inference_onnx.lambda_handler`

### Option 2: AWS CLI

If you have AWS CLI installed, run these commands:

```bash
# Upload to S3
aws s3 cp lambda-deployment.zip s3://weave-model-storage/lambda/lambda-deployment.zip

# Update Lambda function code
aws lambda update-function-code \
  --function-name weave-inference \
  --s3-bucket weave-model-storage \
  --s3-key lambda/lambda-deployment.zip

# Update configuration
aws lambda update-function-configuration \
  --function-name weave-inference \
  --memory-size 1024 \
  --timeout 30 \
  --environment Variables={MODEL_BUCKET=weave-model-storage}
```

### Option 3: PowerShell (Windows)

```powershell
# Navigate to lambda directory
cd C:\Users\lakes\weave\backend\lambda

# Upload to S3 (if you have AWS Tools for PowerShell)
Write-S3Object -BucketName weave-model-storage -Key lambda/lambda-deployment.zip -File lambda-deployment.zip

# Or use AWS CLI if installed
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3 cp lambda-deployment.zip s3://weave-model-storage/lambda/lambda-deployment.zip

& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda update-function-code --function-name weave-inference --s3-bucket weave-model-storage --s3-key lambda/lambda-deployment.zip
```

## Test the Deployment

### Test Event (test_event.json)
```json
{
  "uid": "user123",
  "model_name": "sentiment-model.onnx",
  "input": "This product is amazing! I love it!"
}
```

### Using AWS Console
1. Go to Lambda function: `weave-inference`
2. Click "Test" tab
3. Create new test event with the JSON above
4. Click "Test"

### Using AWS CLI
```bash
aws lambda invoke \
  --function-name weave-inference \
  --payload file://test_event.json \
  response.json

cat response.json
```

### Expected Response
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": {
    "prediction": {
      "predicted_class": 1,
      "sentiment": "positive",
      "confidence": 1.0,
      "probabilities": [0.0, 1.0]
    },
    "model": "sentiment-model.onnx",
    "uid": "user123",
    "latency_ms": 150,
    "model_type": "onnx"
  }
}
```

## Upload Demo Model to S3

Before testing, make sure to upload the sentiment model:

```bash
aws s3 cp sentiment-model.onnx s3://weave-model-storage/user123/sentiment-model.onnx
```

Or via AWS Console:
- Go to S3 bucket: `weave-model-storage`
- Create folder: `user123/`
- Upload `sentiment-model.onnx`

## Lambda Configuration Summary

- **Function Name:** `weave-inference`
- **Runtime:** Python 3.11 (or latest available)
- **Handler:** `inference_onnx.lambda_handler`
- **Memory:** 1024 MB
- **Timeout:** 30 seconds
- **Environment Variables:**
  - `MODEL_BUCKET` = `weave-model-storage`

## IAM Permissions Required

Make sure the Lambda execution role has these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::weave-model-storage",
        "arn:aws:s3:::weave-model-storage/*"
      ]
    }
  ]
}
```

## Troubleshooting

### Error: "Model not found"
- Check that model is uploaded to S3 at: `s3://weave-model-storage/{uid}/{model_name}`
- Example: `s3://weave-model-storage/user123/sentiment-model.onnx`

### Error: "Missing parameter"
- Make sure your request includes: `uid`, `model_name`, and `input`

### Cold Start Timeout
- First invocation may take 1-2 seconds to load model
- Subsequent requests (warm start) will be much faster (<100ms)

### Memory Issues
- If models are very large, increase memory to 2048 MB or 3008 MB
- ONNX models are usually much smaller than PyTorch models

## Next Steps

1. ✅ Package created: `lambda-deployment.zip`
2. ⏳ Upload to S3 bucket
3. ⏳ Update Lambda function
4. ⏳ Upload demo model to S3
5. ⏳ Test with demo event
6. ⏳ Integrate with frontend

## For Hackathon Demo

1. Upload `sentiment-model.onnx` to S3
2. Deploy Lambda function
3. Test with curl or Postman:

```bash
curl -X POST https://YOUR_LAMBDA_URL.amazonaws.com/2015-03-31/functions/weave-inference/invocations \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "model_name": "sentiment-model.onnx",
    "input": "This product is amazing!"
  }'
```

Good luck with your hackathon! 🚀

