#!/usr/bin/env python3
"""
Simple demo script for text-in, text-out ONNX model
Perfect for hackathon demos!
"""

import numpy as np
import onnxruntime as ort

# Text preprocessing function (converts text to numeric features)
def text_to_features(text: str, max_length: int = 128) -> np.ndarray:
    """
    Convert text to numeric features for the model
    Uses simple character-level encoding
    """
    # Convert text to ASCII values
    char_values = [ord(c) for c in text[:max_length]]
    
    # Pad or truncate to max_length
    if len(char_values) < max_length:
        char_values.extend([0] * (max_length - len(char_values)))
    else:
        char_values = char_values[:max_length]
    
    # Normalize to 0-1 range
    features = np.array(char_values, dtype=np.float32) / 255.0
    
    # Reshape to (batch_size, features)
    return features.reshape(1, -1)


# Output postprocessing (converts model output to readable text)
def output_to_text(model_output: np.ndarray) -> dict:
    """
    Convert model output to human-readable text
    """
    # Get probabilities
    probs = model_output[0]
    negative_prob = probs[0]
    positive_prob = probs[1]
    
    # Determine sentiment
    if positive_prob > negative_prob:
        sentiment = "POSITIVE"
        confidence = positive_prob
    else:
        sentiment = "NEGATIVE"
        confidence = negative_prob
    
    return {
        "sentiment": sentiment,
        "confidence": float(confidence),
        "negative_score": float(negative_prob),
        "positive_score": float(positive_prob)
    }


def predict_sentiment(session, text: str) -> dict:
    """
    Complete text-in, text-out prediction
    """
    # TEXT IN: Convert text to features
    features = text_to_features(text)
    
    # Run model
    output = session.run(None, {'input': features})
    
    # TEXT OUT: Convert output to readable result
    result = output_to_text(output[0])
    result['input_text'] = text
    
    return result


if __name__ == "__main__":
    print("="*60)
    print("TEXT-IN, TEXT-OUT ONNX MODEL DEMO")
    print("="*60)
    
    # Load the model
    model_path = "sentiment-model.onnx"
    print(f"\n[1] Loading model: {model_path}")
    session = ort.InferenceSession(model_path)
    print("    Model loaded successfully!")
    
    # Test sentences for demo
    test_sentences = [
        "This product is absolutely amazing! I love it!",
        "Terrible experience. Would not recommend.",
        "It's okay, nothing special.",
        "Best purchase I've ever made!",
        "Waste of money and time.",
        "The customer service was fantastic!",
        "Disappointed with the quality."
    ]
    
    print("\n[2] Running inference on sample texts...")
    print("-"*60)
    
    for i, text in enumerate(test_sentences, 1):
        result = predict_sentiment(session, text)
        
        print(f"\n{i}. Input: \"{text}\"")
        print(f"   Output: {result['sentiment']} (confidence: {result['confidence']:.2%})")
        print(f"   Scores: Positive={result['positive_score']:.3f}, Negative={result['negative_score']:.3f}")
    
    print("\n" + "="*60)
    print("DEMO COMPLETE!")
    print("="*60)
    
    # Interactive mode
    print("\n[3] Try your own text (or press Ctrl+C to exit):")
    try:
        while True:
            text = input("\nEnter text: ").strip()
            if not text:
                continue
            
            result = predict_sentiment(session, text)
            print(f"\n   --> {result['sentiment']} (confidence: {result['confidence']:.2%})")
            print(f"   Scores: Positive={result['positive_score']:.3f}, Negative={result['negative_score']:.3f}")
    
    except KeyboardInterrupt:
        print("\n\nThank you for the demo! Good luck at your hackathon!")

