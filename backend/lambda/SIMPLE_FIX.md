# 🚀 SIMPLE FIX - Get Working in 5 Minutes

The layer issue is taking too long. Here's a **simpler solution** that will work RIGHT NOW.

---

## ✅ **Quick Solution: Upload Everything Together**

Instead of using layers, let's upload the dependencies WITH the handler.

### Step 1: Check What's in Your Lambda

Go to: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/weave-inference

**Check the "Layers" section:**

```
Layers (1)
  onnxruntime-numpy:1     <-- Should be THIS
```

**NOT:**
```
Layers (1)
  onnxruntime:1          <-- Old layer (doesn't have numpy)
```

If you see the OLD layer, you need to:
1. Remove it
2. Add the new `onnxruntime-numpy` layer
3. **CLICK "DEPLOY"** (orange button)
4. **WAIT 30 seconds**
5. Test again

---

## 🔄 **Force Lambda to Update**

Sometimes Lambda caches layers. Force it to update:

### In Lambda Console:

1. Go to **Configuration** tab
2. Click **General configuration** → **Edit**
3. Change **Memory** from 1024 to 1025 MB (just to trigger update)
4. **Save**
5. Wait 10 seconds
6. Change it **back** to 1024 MB
7. **Save**
8. This forces Lambda to reload everything

Now test again!

---

## 🎯 **Verify Layer is REALLY Attached**

### In Lambda Console:

1. Scroll down to **Layers**
2. Click on the layer name
3. You should see:
   ```
   Layer ARN: arn:aws:lambda:us-east-1:533267403341:layer:onnxruntime-numpy:1
   Compatible runtimes: python3.11
   ```

4. If you see a different ARN (like `...178958628385...`), that's the PUBLIC layer - remove it!

---

## ⚡ **Nuclear Option: Package Everything**

If layers keep failing, use this ONE file that has EVERYTHING:

File location: `C:\Users\lakes\weave\backend\lambda\lambda-deployment-linux.zip`

This 56MB file has the handler + onnxruntime + numpy all together.

### To use it:

1. Go to Lambda Console
2. **Remove ALL layers** (make it 0 layers)
3. Click "Upload from" → ".zip file"  
4. Select: `lambda-deployment-linux.zip`
5. Click "Save"
6. Wait for upload (~1 minute)
7. Test

This should work immediately!

---

## 🔍 **Debug Current State**

Tell me what you see:

1. **In Lambda Console → Layers section:**
   - How many layers? (should be 1)
   - What's the layer name? (should be `onnxruntime-numpy:1`)

2. **In Lambda Console → Code source:**
   - Do you see `inference_onnx.py`? (should be there)

3. **Did you click "Deploy" after changing layers?**
   - Very important!

---

## 📞 **Quick Test**

After making changes, wait 30 seconds then run:

```powershell
cd C:\Users\lakes\weave\backend\lambda
powershell -File quick_test.ps1
```

If it still fails with numpy error:
- Lambda hasn't updated yet → wait 1 more minute
- Layer is wrong → use the `lambda-deployment-linux.zip` file instead

---

## ✨ **Most Likely Issue**

You added the layer but **didn't click "Deploy"** or the deploy hasn't propagated yet.

**Solution:**
1. Go to Lambda Console
2. Find the orange "Deploy" button (top right)
3. Click it
4. Wait 30 seconds
5. Try again

---

## 🎯 **For Your Hackathon Demo**

**Fastest path forward:**

1. **Upload:** `lambda-deployment-linux.zip` (has everything, no layers needed)
2. **Upload model to S3:** `sentiment-model.onnx` → `s3://weave-model-storage/user123/`
3. **Test:** Should work immediately

This avoids all layer complexity and gets you working NOW.

File location: `C:\Users\lakes\weave\backend\lambda\lambda-deployment-linux.zip` (56.91 MB)

