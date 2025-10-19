# Lambda Integration Guide

## Lambda Endpoint
```
https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/
```

## Request Formats

### Text Input
```json
{
  "uid": "user123",
  "model_name": "sentiment-model.onnx",
  "input": "This product is amazing!",
  "input_type": "text"
}
```

### Image Input
```json
{
  "uid": "user123",
  "model_name": "image-classifier.onnx",
  "image": "base64_encoded_image_string_here",
  "input_type": "image"
}
```

## Response Format
```json
{
  "prediction": {
    "predicted_class": 1,
    "sentiment": "positive",
    "confidence": 0.85,
    "probabilities": [0.15, 0.85]
  },
  "model": "sentiment-model.onnx",
  "uid": "user123",
  "input_type": "text",
  "latency_ms": 145,
  "cached": true
}
```

## Frontend Integration (React/Next.js)

### Text Inference
```typescript
const runTextInference = async (text: string) => {
  const response = await fetch('https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: 'user123',
      model_name: 'sentiment-model.onnx',
      input: text,
      input_type: 'text'
    })
  });
  
  const data = await response.json();
  return data;
};
```

### Image Inference
```typescript
const runImageInference = async (file: File) => {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });
  
  const response = await fetch('https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: 'user123',
      model_name: 'image-classifier.onnx',
      image: base64,
      input_type: 'image'
    })
  });
  
  const data = await response.json();
  return data;
};
```

### Complete Dashboard Integration

Update `/src/app/dashboard/page.tsx`:

```typescript
const handleRunInference = async () => {
  if (!inferenceInput.trim()) {
    alert('Please enter input data');
    return;
  }
  
  setInferenceOutput('Processing...');
  
  try {
    const response = await fetch('https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: 'user123',
        model_name: selectedModel?.name || 'sentiment-model.onnx',
        input: inferenceInput,
        input_type: 'text'
      })
    });
    
    const data = await response.json();
    setInferenceOutput(JSON.stringify(data, null, 2));
  } catch (error) {
    setInferenceOutput(`Error: ${error.message}`);
  }
};
```

## cURL Examples

### Text
```bash
curl -X POST https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "model_name": "sentiment-model.onnx",
    "input": "This is great!",
    "input_type": "text"
  }'
```

### Image
```bash
# Encode image to base64
IMAGE_BASE64=$(base64 -i image.jpg)

curl -X POST https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"user123\",
    \"model_name\": \"image-model.onnx\",
    \"image\": \"$IMAGE_BASE64\",
    \"input_type\": \"image\"
  }"
```

## Python Example

```python
import requests
import base64

# Text inference
def text_inference(text):
    response = requests.post(
        'https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/',
        json={
            'uid': 'user123',
            'model_name': 'sentiment-model.onnx',
            'input': text,
            'input_type': 'text'
        }
    )
    return response.json()

# Image inference
def image_inference(image_path):
    with open(image_path, 'rb') as f:
        image_base64 = base64.b64encode(f.read()).decode('utf-8')
    
    response = requests.post(
        'https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/',
        json={
            'uid': 'user123',
            'model_name': 'image-classifier.onnx',
            'image': image_base64,
            'input_type': 'image'
        }
    )
    return response.json()

# Test
result = text_inference("This product is amazing!")
print(result)
```

## Notes

- **Text Input**: Send as plain string in `input` field
- **Image Input**: Send as base64 encoded string in `image` field
- **Input Type**: Specify `"text"` or `"image"` in `input_type` field
- **Max Size**: Lambda has 6MB payload limit (base64 encoded)
- **For larger images**: Consider uploading to S3 first, then send S3 key

## Error Handling

```typescript
try {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
} catch (error) {
  console.error('Inference error:', error);
  throw error;
}
```

