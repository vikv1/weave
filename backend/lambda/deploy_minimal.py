#!/usr/bin/env python3
"""
Create minimal Lambda package (handler only)
Use AWS Lambda Layer for onnxruntime + numpy
"""

import zipfile
import os

print("="*70)
print(" "*15 + "CREATING MINIMAL LAMBDA PACKAGE")
print("="*70)

# Create minimal zip with just the handler
ZIP_FILE = "lambda-handler-only.zip"

if os.path.exists(ZIP_FILE):
    os.remove(ZIP_FILE)

print("\n[*] Creating package with handler only...")
with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.write("inference_onnx.py", "inference_onnx.py")

size_kb = os.path.getsize(ZIP_FILE) / 1024
print(f"[SUCCESS] Created: {ZIP_FILE} ({size_kb:.2f} KB)")

print("\n" + "="*70)
print(" "*20 + "DEPLOYMENT STEPS")
print("="*70)

print("""
STEP 1: Upload handler
----------------------
1. Go to Lambda Console: weave-inference
2. Click "Upload from" -> ".zip file"
3. Select: lambda-handler-only.zip
4. Click "Save"

STEP 2: Add ONNX Runtime Layer
-------------------------------
1. In Lambda Console, scroll down to "Layers"
2. Click "Add a layer"
3. Choose "AWS layers" or "Custom layers"

Option A: Use public ONNX Runtime layer
   - Layer ARN: arn:aws:lambda:us-east-1:178958628385:layer:onnxruntime:1
   OR search for "onnxruntime" in public layers

Option B: Create custom layer
   - Upload onnxruntime + numpy as a layer
   - See: LAMBDA_LAYER_INSTRUCTIONS.txt

STEP 3: Test
-----------
powershell -File quick_test.ps1

""")

# Create layer instructions
with open("LAMBDA_LAYER_INSTRUCTIONS.txt", "w") as f:
    f.write("""
========================================
CREATE CUSTOM LAMBDA LAYER
========================================

If public ONNX Runtime layers don't work, create your own:

METHOD 1: Use Cloud9 (Recommended)
-----------------------------------
1. Launch AWS Cloud9 (Amazon Linux 2)
2. Run these commands:

mkdir python
pip install onnxruntime numpy -t python/
zip -r onnx-layer.zip python/

3. Upload to S3:
aws s3 cp onnx-layer.zip s3://weave-model-storage/layers/

4. Create Lambda Layer:
aws lambda publish-layer-version \\
  --layer-name onnxruntime-numpy \\
  --content S3Bucket=weave-model-storage,S3Key=layers/onnx-layer.zip \\
  --compatible-runtimes python3.11

5. Add layer to your Lambda function

METHOD 2: Use Docker (if you have it)
-------------------------------------
docker run --rm -v "$PWD":/var/task public.ecr.aws/lambda/python:3.11 \\
  bash -c "pip install onnxruntime numpy -t python/ && zip -r onnx-layer.zip python/"

METHOD 3: Download pre-built layer
----------------------------------
Some communities provide pre-built layers:
- Search: "onnxruntime lambda layer"
- Use ARN: arn:aws:lambda:us-east-1:178958628385:layer:onnxruntime:1

========================================
""")

print("\n[INFO] Created: LAMBDA_LAYER_INSTRUCTIONS.txt")
print("\n[SUCCESS] Minimal package ready!")
print(f"\nPackage: {ZIP_FILE}")
print("Next: Upload to Lambda and add ONNX layer")

