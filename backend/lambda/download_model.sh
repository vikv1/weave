#!/bin/bash

# Download a pre-made ONNX text model
echo "📥 Downloading a small ONNX model..."

# Download a small model from ONNX Model Zoo
curl -L -o sentiment-model.onnx "https://github.com/onnx/models/raw/main/text/machine_comprehension/bert-squad/model/bertsquad-10.onnx"

if [ -f sentiment-model.onnx ]; then
    echo "✅ Model downloaded: sentiment-model.onnx"
    ls -lh sentiment-model.onnx
    
    echo ""
    echo "📤 Uploading to S3..."
    aws s3 cp sentiment-model.onnx s3://weave-model-storage/user123/sentiment-model.onnx
    
    echo ""
    echo "✅ Model uploaded!"
    echo ""
    echo "🧪 Test it:"
    echo 'curl -X POST https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/ \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"uid": "user123", "model_name": "sentiment-model.onnx", "input": "This is amazing!"}'"'"
else
    echo "❌ Download failed"
fi

