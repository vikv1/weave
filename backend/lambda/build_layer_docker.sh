#!/bin/bash
# Build AWS Lambda Layer using Docker
# This ensures Linux-compatible packages for Lambda

set -e

echo "========================================"
echo "  Building Lambda Layer with Docker"
echo "========================================"
echo ""

# Clean up any previous builds
echo "[1/5] Cleaning up previous builds..."
rm -rf python
rm -f onnx-layer.zip

# Create python directory (Lambda layers must be in 'python' folder)
echo "[2/5] Creating layer structure..."
mkdir -p python

# Use AWS Lambda Python base image to install packages
echo "[3/5] Installing packages in Lambda environment..."
echo "      (This downloads Linux-compatible wheels)"
echo ""

docker run --rm \
  -v "$PWD":/var/task \
  public.ecr.aws/lambda/python:3.11 \
  bash -c "
    pip install \
      onnxruntime==1.20.1 \
      numpy==1.26.4 \
      -t /var/task/python/ \
      --no-cache-dir
  "

echo ""
echo "[4/5] Creating layer zip file..."
zip -r onnx-layer.zip python/ -q

# Get size
SIZE=$(du -h onnx-layer.zip | cut -f1)
echo "[SUCCESS] Layer created: onnx-layer.zip ($SIZE)"

# Clean up
echo "[5/5] Cleaning up..."
rm -rf python/

echo ""
echo "========================================"
echo "  Layer Ready!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Upload to S3:"
echo "   aws s3 cp onnx-layer.zip s3://weave-model-storage/layers/onnx-layer.zip"
echo ""
echo "2. Create Lambda Layer:"
echo "   aws lambda publish-layer-version \\"
echo "     --layer-name onnxruntime-numpy \\"
echo "     --description 'ONNX Runtime + NumPy for Lambda' \\"
echo "     --content S3Bucket=weave-model-storage,S3Key=layers/onnx-layer.zip \\"
echo "     --compatible-runtimes python3.11 \\"
echo "     --compatible-architectures x86_64"
echo ""
echo "3. Note the Layer ARN from the output"
echo ""
echo "4. Add to your Lambda function:"
echo "   - Go to Lambda Console"
echo "   - Click 'Add a layer'"
echo "   - Select 'Custom layers'"
echo "   - Choose your layer"
echo ""

