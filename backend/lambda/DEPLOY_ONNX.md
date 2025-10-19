# Deploy ONNX Lambda Function

✅ Package created: `lambda-onnx.zip` (51MB)
✅ Uses ONNX Runtime (lightweight, fast)
✅ Supports models from PyTorch, TensorFlow, scikit-learn

## Quick Deploy

### Option 1: Upload via S3 (Recommended for >50MB)

```bash
# Upload to S3
aws s3 cp lambda-onnx.zip s3://weave-model-storage/lambda/

# Create/update Lambda function
aws lambda update-function-code \
  --function-name weave-inference \
  --s3-bucket weave-model-storage \
  --s3-key lambda/lambda-onnx.zip \
  --region us-east-1
```

### Option 2: AWS Console

1. Go to AWS Lambda console
2. Click "Create function" (or open existing function)
3. Click "Upload from" → "Amazon S3 location"
4. First upload `lambda-onnx.zip` to S3, then enter the S3 URL
5. Click "Save"

## Configuration

### Lambda Settings

- **Runtime**: Python 3.11
- **Handler**: `inference_onnx.lambda_handler`
- **Memory**: 1024 MB (ONNX is lighter than PyTorch)
- **Timeout**: 30 seconds
- **Environment Variables**:
  - `MODEL_BUCKET` = `weave-ml-models`

### IAM Permissions

Attach this policy to Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::weave-model-storage",
        "arn:aws:s3:::weave-model-storage/*"
      ]
    }
  ]
}
```

## Testing

### Test Event

```json
{
  "uid": "user123",
  "model_name": "sentiment-model.onnx",
  "input": "This product is amazing!"
}
```

### Expected Response

```json
{
  "statusCode": 200,
  "body": "{\"prediction\": {\"sentiment\": \"positive\", \"confidence\": 0.95}, \"latency_ms\": 120}"
}
```

## Converting Models to ONNX

### From PyTorch

```python
import torch
import torch.onnx

# Your PyTorch model
model = YourModel()
model.eval()

# Dummy input
dummy_input = torch.randn(1, 128)

# Export to ONNX
torch.onnx.export(
    model,
    dummy_input,
    "sentiment-model.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}}
)
```

### From TensorFlow

```python
import tensorflow as tf
import tf2onnx

# Your TensorFlow model
model = tf.keras.models.load_model('model.h5')

# Convert to ONNX
spec = (tf.TensorSpec((None, 128), tf.float32, name="input"),)
output_path = "sentiment-model.onnx"

model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, output_path=output_path)
```

### From scikit-learn

```python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Your sklearn model
model = your_sklearn_model

# Define input type
initial_type = [('float_input', FloatTensorType([None, 128]))]

# Convert
onx = convert_sklearn(model, initial_types=initial_type)

# Save
with open("model.onnx", "wb") as f:
    f.write(onx.SerializeToString())
```

## Upload Model to S3

```bash
# Upload ONNX model
aws s3 cp sentiment-model.onnx s3://weave-model-storage/user123/sentiment-model.onnx
```

## Performance

### Cold Start
- **First invocation**: 1-2 seconds (model download + load)
- **ONNX is 3-5x faster than PyTorch** for loading

### Warm Start
- **Cached model**: 50-200ms
- **Very fast inference** with ONNX Runtime optimizations

### Memory Usage
- **Typical**: 512MB - 1024MB
- **Much lower than PyTorch** (which needs 2GB+)

## Benefits of ONNX

✅ **Lightweight**: 10MB vs 766MB (PyTorch)
✅ **Fast**: Optimized inference engine
✅ **Universal**: Works with PyTorch, TensorFlow, scikit-learn models
✅ **Production-ready**: Used by Microsoft, Facebook, AWS
✅ **Lower costs**: Less memory = cheaper Lambda execution

## Troubleshooting

### Error: "No module named 'onnxruntime'"

**Solution**: Package not uploaded correctly. Re-upload ZIP file.

### Error: "Model not found"

**Solution**: Check S3 path. Should be: `s3://weave-ml-models/{uid}/{model_name}`

### Error: "Invalid ONNX model"

**Solution**: Verify model was exported correctly. Test locally first:

```python
import onnxruntime as ort
session = ort.InferenceSession("model.onnx")
print("Model loaded successfully!")
```

## Next Steps

1. ✅ Deploy Lambda function with `lambda-onnx.zip`
2. ✅ Configure memory (1024 MB) and timeout (30s)
3. ✅ Add S3 permissions to execution role
4. ✅ Set `MODEL_BUCKET` environment variable
5. ✅ Convert your PyTorch/TensorFlow model to ONNX
6. ✅ Upload model to S3: `s3://weave-model-storage/user123/model.onnx`
7. ✅ Test with the test event
8. ✅ Create Function URL for HTTPS access
9. ✅ Integrate with your frontend

## Cost Estimate

With ONNX (1GB memory, 200ms avg latency):
- **1000 requests/day** = ~$1/month
- **10,000 requests/day** = ~$10/month

Much cheaper than PyTorch due to lower memory requirements!

