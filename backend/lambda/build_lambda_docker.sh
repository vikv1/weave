#!/bin/bash
# Build Lambda package using Docker (ensures Linux compatibility)

echo "========================================="
echo "  Building Lambda Package with Docker"
echo "========================================="

# Create a clean build directory
rm -rf lambda_package_clean
mkdir -p lambda_package_clean

# Use AWS Lambda Python 3.11 base image to install dependencies
docker run --rm \
  -v "$PWD":/var/task \
  -w /var/task \
  public.ecr.aws/lambda/python:3.11 \
  bash -c "
    echo 'Installing dependencies...'
    pip install onnxruntime numpy -t lambda_package_clean/ --no-cache-dir
    
    echo 'Copying Lambda handler...'
    cp inference_onnx.py lambda_package_clean/
    
    echo 'Creating zip package...'
    cd lambda_package_clean
    zip -r ../lambda-docker.zip . -x '*.pyc' -x '__pycache__/*'
    cd ..
    
    echo 'Package created!'
    ls -lh lambda-docker.zip
  "

echo ""
echo "========================================="
echo "  Package ready: lambda-docker.zip"
echo "========================================="
echo ""
echo "Upload to S3:"
echo "  aws s3 cp lambda-docker.zip s3://weave-model-storage/lambda/lambda-docker.zip"
echo ""
echo "Update Lambda:"
echo "  aws lambda update-function-code --function-name weave-inference --s3-bucket weave-model-storage --s3-key lambda/lambda-docker.zip"

