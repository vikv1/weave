#!/bin/bash
# Test Lambda function with curl

LAMBDA_URL="https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/"

echo "========================================="
echo "  Testing Lambda Function URL"
echo "========================================="
echo ""
echo "URL: $LAMBDA_URL"
echo ""

# Test 1: Positive sentiment
echo "Test 1: Positive Sentiment"
echo "-------------------------------------------"
curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "model_name": "sentiment-model.onnx",
    "input": "This product is amazing! I love it!"
  }'
echo ""
echo ""

# Test 2: Negative sentiment
echo "Test 2: Negative Sentiment"
echo "-------------------------------------------"
curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "model_name": "sentiment-model.onnx",
    "input": "Terrible quality. Would not recommend."
  }'
echo ""
echo ""

# Test 3: Another positive
echo "Test 3: Enthusiastic Review"
echo "-------------------------------------------"
curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "model_name": "sentiment-model.onnx",
    "input": "Best purchase ever! Highly recommend!"
  }'
echo ""
echo ""

echo "========================================="
echo "  Tests Complete"
echo "========================================="

