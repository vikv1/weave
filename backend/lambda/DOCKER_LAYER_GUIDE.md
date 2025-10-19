# 🐳 Build Lambda Layer with Docker - Complete Guide

## Why Docker?

When building Lambda functions on Windows, the installed packages (numpy, onnxruntime) are Windows-specific. Lambda runs on Linux, so we get errors like:
- `module 'os' has no attribute 'add_dll_directory'`
- `Runtime.ImportModuleError`

**Solution:** Use Docker with AWS Lambda's official Python image to install Linux-compatible packages!

---

## Prerequisites

### 1. Install Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Wait for it to fully start (Docker icon in system tray)

### 2. Verify Installation
```powershell
docker --version
```
Should show: `Docker version 20.x.x` or higher

---

## Step-by-Step Process

### Step 1: Build the Layer

Open PowerShell and run:

```powershell
cd C:\Users\lakes\weave\backend\lambda
.\build_layer_docker.ps1
```

**What this does:**
1. ✅ Pulls AWS Lambda Python 3.11 base image (Linux)
2. ✅ Installs onnxruntime and numpy **inside** the Linux container
3. ✅ Packages everything into `onnx-layer.zip`
4. ✅ Ensures all packages are Linux-compatible

**Expected output:**
```
[SUCCESS] Layer created: onnx-layer.zip (45.23 MB)
```

---

### Step 2: Upload to S3

#### Option A: AWS Console (Easiest)
1. Go to: https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage
2. Create folder: `layers/` (if it doesn't exist)
3. Click **"Upload"**
4. Select: `onnx-layer.zip`
5. Click **"Upload"**
6. Wait for upload to complete

#### Option B: AWS CLI
```bash
aws s3 cp onnx-layer.zip s3://weave-model-storage/layers/onnx-layer.zip
```

---

### Step 3: Create Lambda Layer

#### Option A: AWS Console
1. Go to: https://console.aws.amazon.com/lambda/home?region=us-east-1#/layers
2. Click **"Create layer"**
3. Fill in:
   - **Name:** `onnxruntime-numpy`
   - **Description:** `ONNX Runtime + NumPy for Lambda`
   - **Upload:** Choose **"Upload a file from Amazon S3"**
   - **S3 URL:** `s3://weave-model-storage/layers/onnx-layer.zip`
   - **Compatible runtimes:** Select `Python 3.11`
4. Click **"Create"**
5. **Copy the Layer ARN** (you'll need it!)

Example ARN: `arn:aws:lambda:us-east-1:123456789012:layer:onnxruntime-numpy:1`

#### Option B: AWS CLI
```bash
aws lambda publish-layer-version \
  --layer-name onnxruntime-numpy \
  --description "ONNX Runtime + NumPy for Lambda" \
  --content S3Bucket=weave-model-storage,S3Key=layers/onnx-layer.zip \
  --compatible-runtimes python3.11 \
  --compatible-architectures x86_64
```

---

### Step 4: Add Layer to Lambda Function

1. Go to: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/weave-inference
2. Scroll down to **"Layers"** section
3. Click **"Add a layer"**
4. Select **"Custom layers"**
5. Choose your layer: `onnxruntime-numpy`
6. Select **Version 1**
7. Click **"Add"**

✅ Done! Your Lambda now has access to onnxruntime and numpy!

---

### Step 5: Test It!

```powershell
cd C:\Users\lakes\weave\backend\lambda
.\quick_test.ps1
```

Expected response:
```json
{
  "prediction": {
    "sentiment": "positive",
    "confidence": 1.0
  }
}
```

---

## Understanding Lambda Layers

### What is a Lambda Layer?
A Lambda Layer is a ZIP archive containing libraries, custom runtimes, or other dependencies. You can include up to 5 layers per function.

### Layer Structure
```
onnx-layer.zip
└── python/
    ├── numpy/
    │   ├── __init__.py
    │   └── ...
    └── onnxruntime/
        ├── __init__.py
        └── ...
```

The `python/` folder is **required** - Lambda automatically adds it to the Python path.

### Why This Works
1. Docker uses AWS's official Lambda image
2. Packages are installed **on Linux for Linux**
3. No Windows-specific binaries
4. Matches Lambda's exact runtime environment

---

## Troubleshooting

### Error: "Docker not found"
**Solution:** Install Docker Desktop and make sure it's running

### Error: "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop and wait for it to fully initialize

### Error: "Layer too large"
Lambda layers have a 250 MB uncompressed limit. Our layer (~45 MB) is well within this.

If you need to reduce size:
```powershell
# In the Docker command, add --no-deps to skip dependencies
docker run --rm -v "${PWD}:/var/task" public.ecr.aws/lambda/python:3.11 \
  bash -c "pip install onnxruntime numpy --no-deps -t /var/task/python/"
```

### Error: "Permission denied" (Linux/Mac)
```bash
sudo chmod +x build_layer_docker.sh
./build_layer_docker.sh
```

---

## Alternative: Use Pre-built Public Layers

If Docker doesn't work, try these public layers:

### ONNX Runtime Layers (Community)
```
arn:aws:lambda:us-east-1:178958628385:layer:onnxruntime:1
```

### How to find more:
1. Google: "onnxruntime lambda layer"
2. Check: https://github.com/aws-samples/
3. AWS Serverless Application Repository

---

## Complete Deployment Checklist

- [ ] Build layer with Docker (`build_layer_docker.ps1`)
- [ ] Upload `onnx-layer.zip` to S3
- [ ] Create Lambda Layer
- [ ] Add layer to `weave-inference` function
- [ ] Upload `lambda-handler-only.zip` to Lambda
- [ ] Upload `sentiment-model.onnx` to S3
- [ ] Test with `quick_test.ps1`

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│  Your Computer (Windows)                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Docker Desktop                 │   │
│  │                                 │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │ AWS Lambda Python 3.11    │  │   │
│  │  │ (Linux Container)         │  │   │
│  │  │                           │  │   │
│  │  │ pip install onnxruntime  │  │   │
│  │  │           ↓               │  │   │
│  │  │   Linux packages         │  │   │
│  │  └───────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
│                 ↓                       │
│         onnx-layer.zip                  │
└─────────────────────────────────────────┘
                  ↓
              Upload to S3
                  ↓
          Create Lambda Layer
                  ↓
     Add to Lambda Function ✓
```

---

## Summary

1. **Docker** = Use Linux environment on Windows
2. **Lambda Image** = Exact same environment as AWS Lambda
3. **Layer** = Reusable package of dependencies
4. **Result** = No more import errors! 🎉

---

## Quick Commands Reference

```powershell
# Build layer
.\build_layer_docker.ps1

# Upload to S3 (CLI)
aws s3 cp onnx-layer.zip s3://weave-model-storage/layers/

# Create layer (CLI)
aws lambda publish-layer-version --layer-name onnxruntime-numpy \
  --content S3Bucket=weave-model-storage,S3Key=layers/onnx-layer.zip \
  --compatible-runtimes python3.11

# Test
.\quick_test.ps1
```

---

## Need Help?

1. Check Docker is running: `docker ps`
2. Test Docker works: `docker run hello-world`
3. Verify layer uploaded: Check S3 console
4. View Lambda logs: CloudWatch Logs

Good luck! 🚀

