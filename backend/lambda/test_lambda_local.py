#!/usr/bin/env python3
"""
Local test for Lambda inference function
Tests with user123 and sentiment-model.onnx
"""

import json
import numpy as np
import os
import time

try:
    import onnxruntime as ort
except ImportError:
    print("ERROR: onnxruntime not installed. Install with: pip install onnxruntime")
    exit(1)

# Global variables for model caching (just like in Lambda)
cached_session = None
cached_model_key = None


def preprocess_text_input(text_input: str, max_length: int = 128) -> np.ndarray:
    """Smart text preprocessing for sentiment analysis"""
    # Sentiment keywords
    POSITIVE_KEYWORDS = ['love', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect',
                         'best', 'awesome', 'good', 'nice', 'happy', 'beautiful', 'recommend',
                         'impressed', 'satisfied', 'pleased', 'exceeded', 'quality', 'value']
    
    NEGATIVE_KEYWORDS = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor',  
                         'disappointing', 'disappointed', 'waste', 'broken', 'useless', 'regret',
                         'never', 'not recommend', 'avoid', 'defective', 'cheap', 'failed']
    
    text_lower = text_input.lower()
    
    # Base features
    char_values = [ord(c) for c in text_input[:max_length]]
    if len(char_values) < max_length:
        char_values.extend([0] * (max_length - len(char_values)))
    
    features = np.array(char_values, dtype=np.float32) / 127.5 - 1.0
    
    # Sentiment keyword detection
    positive_count = sum(1.0 for word in POSITIVE_KEYWORDS if word in text_lower)
    negative_count = sum(1.0 for word in NEGATIVE_KEYWORDS if word in text_lower)
    
    if positive_count > 0:
        features[:64] += min(positive_count * 0.4, 2.0)
    
    if negative_count > 0:
        features[64:] += min(negative_count * 0.4, 2.0)
    
    # Handle negations
    negation_phrases = ['not good', 'not great', 'not recommend', "didn't like", "don't like", 
                       'would not', 'not at all']
    has_negation_phrase = any(phrase in text_lower for phrase in negation_phrases)
    
    if has_negation_phrase:
        features[:64] *= 0.1
        features[64:] += 1.2
    
    if 'never' in text_lower and negative_count > 0:
        features[64:] += 0.5
    
    return features.reshape(1, -1).astype(np.float32)


def postprocess_output(output: np.ndarray) -> dict:
    """Postprocess ONNX model output"""
    if output.ndim == 2 and output.shape[1] <= 10:
        # Classification output
        predicted_class = int(np.argmax(output, axis=1)[0])
        confidence = float(np.max(output, axis=1)[0])
        probabilities = output[0].tolist()
        
        # Map to sentiment labels
        sentiment_map = {0: 'negative', 1: 'positive'}
        sentiment = sentiment_map.get(predicted_class, f'class_{predicted_class}')
        
        result = {
            "predicted_class": predicted_class,
            "sentiment": sentiment,
            "confidence": confidence,
            "probabilities": probabilities,
            "shape": list(output.shape)
        }
    else:
        # Generic output
        result = {
            "prediction": output.tolist(),
            "shape": list(output.shape)
        }
    
    return result


def load_model_from_local(uid: str, model_name: str) -> bytes:
    """
    Load ONNX model from local filesystem (simulates S3)
    In real Lambda, this would download from S3
    """
    # For local testing, just use the current directory
    model_path = model_name
    
    if not os.path.exists(model_path):
        print(f"ERROR: Model not found: {model_path}")
        return None
    
    with open(model_path, 'rb') as f:
        model_bytes = f.read()
    
    print(f"[INFO] Loaded model from: {model_path}")
    print(f"[INFO] Model size: {len(model_bytes) / 1024:.2f} KB")
    
    return model_bytes


def lambda_handler(event, context=None):
    """
    Local version of Lambda handler for testing
    """
    global cached_session, cached_model_key
    
    start_time = time.time()
    
    try:
        # Parse request (handle both direct dict and JSON string)
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        # Extract parameters
        uid = body.get('uid')
        model_name = body.get('model_name')
        text_input = body.get('input')
        
        # Validate inputs
        if not uid:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required parameter: uid'})
            }
        
        if not model_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required parameter: model_name'})
            }
        
        if not text_input:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required parameter: input'})
            }
        
        print(f"\n[REQUEST] uid={uid}, model={model_name}")
        print(f"[INPUT] \"{text_input}\"")
        
        # Construct model cache key
        model_cache_key = f"{uid}/{model_name}"
        
        # Load model (use cache if available)
        if cached_session is None or cached_model_key != model_cache_key:
            print(f"[COLD START] Loading model for {model_cache_key}")
            
            # Load model from local filesystem
            model_bytes = load_model_from_local(uid, model_name)
            
            if model_bytes is None:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': f'Model not found: {model_name}'})
                }
            
            # Create ONNX Runtime session
            cached_session = ort.InferenceSession(
                model_bytes,
                providers=['CPUExecutionProvider']
            )
            cached_model_key = model_cache_key
            
            print(f"[INFO] Model inputs: {[i.name for i in cached_session.get_inputs()]}")
            print(f"[INFO] Model outputs: {[o.name for o in cached_session.get_outputs()]}")
        else:
            print(f"[WARM START] Using cached model for {model_cache_key}")
        
        # Preprocess input
        input_data = preprocess_text_input(text_input)
        
        # Get input name from model
        input_name = cached_session.get_inputs()[0].name
        
        # Run inference
        outputs = cached_session.run(None, {input_name: input_data})
        
        # Postprocess output
        result = postprocess_output(outputs[0])
        
        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Prepare response
        response_body = {
            'prediction': result,
            'model': model_name,
            'uid': uid,
            'input_text': text_input,
            'input_length': len(text_input),
            'latency_ms': latency_ms,
            'cached': cached_model_key == model_cache_key,
            'model_type': 'onnx'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body, indent=2)
        }
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal error: {str(e)}'})
        }


if __name__ == "__main__":
    print("="*70)
    print(" "*20 + "LAMBDA LOCAL TEST")
    print("="*70)
    
    # Test cases
    test_cases = [
        {
            "uid": "user123",
            "model_name": "sentiment-model.onnx",
            "input": "This product is amazing! I love it!"
        },
        {
            "uid": "user123",
            "model_name": "sentiment-model.onnx",
            "input": "Terrible quality. Would not recommend."
        },
        {
            "uid": "user123",
            "model_name": "sentiment-model.onnx",
            "input": "Best purchase ever! Highly recommend!"
        },
        {
            "uid": "user123",
            "model_name": "sentiment-model.onnx",
            "input": "Not good at all. Disappointed."
        },
        {
            "uid": "user123",
            "model_name": "sentiment-model.onnx",
            "input": "It's okay, nothing special."
        }
    ]
    
    for i, test_event in enumerate(test_cases, 1):
        print(f"\n{'='*70}")
        print(f"TEST {i}/{len(test_cases)}")
        print('='*70)
        
        response = lambda_handler(test_event, None)
        
        if response['statusCode'] == 200:
            body = json.loads(response['body'])
            prediction = body['prediction']
            
            print(f"\n[RESPONSE]")
            print(f"  Status: SUCCESS")
            print(f"  Sentiment: {prediction['sentiment'].upper()}")
            print(f"  Confidence: {prediction['confidence'] * 100:.1f}%")
            print(f"  Probabilities: {prediction['probabilities']}")
            print(f"  Latency: {body['latency_ms']}ms")
            print(f"  Cached: {body['cached']}")
        else:
            print(f"\n[ERROR] Status {response['statusCode']}")
            print(f"  {response['body']}")
    
    print(f"\n{'='*70}")
    print(" "*25 + "TEST COMPLETE")
    print('='*70)

