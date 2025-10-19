"""
Test script showing how to send images to Lambda inference endpoint
"""

import requests
import base64
import json

LAMBDA_URL = "https://65z5ujs4um7kmvxvgwm33eddty0rsbkv.lambda-url.us-east-1.on.aws/"

def test_text_inference():
    """Test with text input"""
    print("🧪 Testing text inference...")
    
    payload = {
        "uid": "user123",
        "model_name": "sentiment-model.onnx",
        "input": "This product is amazing!",
        "input_type": "text"
    }
    
    response = requests.post(LAMBDA_URL, json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()


def test_image_inference():
    """Test with image input (base64 encoded)"""
    print("🧪 Testing image inference...")
    
    # Create a small dummy image (1x1 pixel PNG)
    # In production, read actual image file
    dummy_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Encode to base64
    image_base64 = base64.b64encode(dummy_png).decode('utf-8')
    
    payload = {
        "uid": "user123",
        "model_name": "image-classifier.onnx",
        "image": image_base64,
        "input_type": "image"
    }
    
    response = requests.post(LAMBDA_URL, json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()


def test_with_real_image(image_path):
    """Test with a real image file"""
    print(f"🧪 Testing with real image: {image_path}")
    
    # Read and encode image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {
        "uid": "user123",
        "model_name": "image-model.onnx",
        "image": image_base64,
        "input_type": "image"
    }
    
    response = requests.post(LAMBDA_URL, json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()


if __name__ == "__main__":
    print("=" * 60)
    print("Lambda Inference Testing")
    print("=" * 60)
    print()
    
    # Test text
    test_text_inference()
    
    # Test image
    test_image_inference()
    
    # Uncomment to test with real image:
    # test_with_real_image("path/to/your/image.jpg")
    
    print("=" * 60)
    print("✅ Tests complete!")
    print()
    print("Frontend Integration:")
    print("1. For text: Send { uid, model_name, input, input_type: 'text' }")
    print("2. For images: Send { uid, model_name, image: base64String, input_type: 'image' }")

