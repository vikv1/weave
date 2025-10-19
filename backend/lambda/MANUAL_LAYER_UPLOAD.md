# 🚀 Manual Lambda Layer Upload Guide

Since AWS CLI isn't available, follow these steps in AWS Console:

---

## ✅ **Step 1: Upload Layer to S3** (2 minutes)

### Go to S3:
**Link:** https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage

### Actions:
1. **Click** on the bucket name `weave-model-storage`
2. **Create folder** (if "layers" doesn't exist):
   - Click "Create folder"
   - Name: `layers`
   - Click "Create folder"
3. **Click** on `layers` folder to open it
4. **Click** "Upload" button
5. **Click** "Add files"
6. **Select:** `C:\Users\lakes\weave\backend\lambda\onnx-layer.zip`
7. **Click** "Upload" (bottom of page)
8. **Wait** for upload to complete (~1-2 minutes for 52MB)
9. ✅ You should see `onnx-layer.zip` in the layers folder

---

## ✅ **Step 2: Create Lambda Layer** (1 minute)

### Go to Lambda Layers:
**Link:** https://console.aws.amazon.com/lambda/home?region=us-east-1#/layers

### Actions:
1. **Click** "Create layer" (orange button, top right)
2. **Fill in:**
   - **Name:** `onnxruntime-numpy`
   - **Description:** `ONNX Runtime and NumPy for Lambda`
3. **Upload method:** Choose "Upload a file from Amazon S3"
4. **Amazon S3 link URL:** 
   ```
   s3://weave-model-storage/layers/onnx-layer.zip
   ```
5. **Compatible runtimes:** 
   - Click dropdown
   - Select: `Python 3.11`
6. **Compatible architectures:** Leave as `x86_64`
7. **Click** "Create" (bottom)
8. ✅ **COPY THE LAYER ARN!** It will look like:
   ```
   arn:aws:lambda:us-east-1:533267403341:layer:onnxruntime-numpy:1
   ```
   **Save this! You'll need it!**

---

## ✅ **Step 3: Remove Old Layer from Function** (30 seconds)

### Go to Your Lambda Function:
**Link:** https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/weave-inference

### Actions:
1. Scroll down to **"Layers"** section
2. You should see the old layer: `onnxruntime:1`
3. **Click** the layer to select it
4. **Click** "Remove" button
5. Confirm removal

---

## ✅ **Step 4: Add Your New Layer** (30 seconds)

### Still in Lambda Function:

1. In **"Layers"** section, **click** "Add a layer"
2. **Choose:** "Custom layers"
3. **Select from dropdown:** `onnxruntime-numpy`
4. **Version:** Select `1`
5. **Click** "Add"
6. You should now see:
   ```
   Layers (1)
   onnxruntime-numpy:1
   ```
7. **IMPORTANT:** Click "Deploy" button (orange, top right)
8. Wait for "Successfully updated..." message

---

## ✅ **Step 5: Test!** (10 seconds)

### Run Test:
```powershell
cd C:\Users\lakes\weave\backend\lambda
powershell -File quick_test.ps1
```

### Expected Success:
```json
{
  "prediction": {
    "sentiment": "positive",
    "confidence": 1.0,
    "probabilities": [0.0, 1.0]
  },
  "model": "sentiment-model.onnx",
  "latency_ms": 150
}
```

---

## 🔍 **Troubleshooting**

### Still getting "No module named 'numpy'"?
- ✅ Make sure you clicked "Deploy" after adding the layer
- ✅ Wait 10 seconds and try again
- ✅ Check that `onnxruntime-numpy:1` shows in Layers section

### Error: "Model not found"?
- Upload `sentiment-model.onnx` to S3:
  - Go to: https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage
  - Create folder: `user123`
  - Upload: `sentiment-model.onnx`

### Error: "Access Denied" (S3)?
- Check Lambda execution role has S3 read permissions
- Add `AmazonS3ReadOnlyAccess` policy to the role

---

## 📋 **Quick Checklist**

- [ ] Step 1: Upload `onnx-layer.zip` to S3 `layers/` folder
- [ ] Step 2: Create Lambda layer from S3 file
- [ ] Step 3: Remove old onnxruntime layer
- [ ] Step 4: Add new `onnxruntime-numpy` layer
- [ ] Step 5: Click "Deploy"
- [ ] Step 6: Test with `quick_test.ps1`

---

## ✨ **You're Almost There!**

Just follow these 5 steps and your Lambda will work perfectly! 

The custom layer we built has BOTH onnxruntime AND numpy, so it will fix the "No module named 'numpy'" error.

Good luck! 🚀

