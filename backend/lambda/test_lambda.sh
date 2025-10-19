#!/bin/bash

# Test the Lambda function with mock data
# Since we don't have a real ONNX model yet, this will show the error handling

FUNCTION_URL="https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/"

echo "🧪 Testing Lambda function..."
echo ""

# Test 1: Valid request (will fail without model in S3)
echo "Test 1: Calling with valid parameters"
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "demo",
    "model_name": "sentiment.onnx",
    "input": "This product is amazing!"
  }' | jq .

echo ""
echo ""

# Test 2: Missing parameters
echo "Test 2: Missing input parameter"
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "demo",
    "model_name": "sentiment.onnx"
  }' | jq .

echo ""
echo ""
echo "✅ Tests complete!"
echo ""
echo "To make it work with real inference:"
echo "1. Create an ONNX model"
echo "2. Upload to S3: aws s3 cp model.onnx s3://weave-model-storage/demo/sentiment.onnx"
echo "3. Test again!"

