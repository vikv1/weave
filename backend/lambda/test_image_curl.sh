#!/bin/bash

# Test Lambda with image input using curl

LAMBDA_URL="https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/"

echo "🧪 Testing Lambda with image input..."
echo ""

# Create a tiny test image (1x1 pixel PNG)
# This is a valid PNG file in base64
IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "📤 Sending request with base64 encoded image..."
echo ""

curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"user123\",
    \"model_name\": \"image-classifier.onnx\",
    \"image\": \"$IMAGE_BASE64\",
    \"input_type\": \"image\"
  }" | jq .

echo ""
echo "✅ Test complete!"

