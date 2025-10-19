#!/usr/bin/env python3
"""
HACKATHON DEMO: Text-in, Text-out Sentiment Analysis
Shows drag-and-drop ML model deployment in action!
"""

import onnxruntime as ort
from sentiment_preprocessor import preprocess_text
import numpy as np

def predict_sentiment(session, text: str) -> dict:
    """
    TEXT IN -> TEXT OUT
    Complete sentiment analysis pipeline
    """
    # Preprocess text to features
    features = preprocess_text(text)
    
    # Run ONNX model
    output = session.run(None, {'input': features})
    
    # Parse output
    neg_prob = output[0][0][0]
    pos_prob = output[0][0][1]
    
    # Determine sentiment
    if pos_prob > 0.55:
        sentiment = "POSITIVE"
        emoji = "😊"
    elif neg_prob > 0.55:
        sentiment = "NEGATIVE"
        emoji = "😞"
    else:
        sentiment = "NEUTRAL"
        emoji = "😐"
    
    confidence = max(pos_prob, neg_prob)
    
    return {
        "text": text,
        "sentiment": sentiment,
        "emoji": emoji,
        "confidence": f"{confidence * 100:.1f}%",
        "positive_score": float(pos_prob),
        "negative_score": float(neg_prob)
    }


if __name__ == "__main__":
    print("="*70)
    print(" "*15 + "ML MODEL DEPLOYMENT PLATFORM DEMO")
    print(" " *20 + "Text Sentiment Analysis")
    print("="*70)
    
    # Load model
    model_path = "sentiment-model.onnx"
    print(f"\n[1] Loading ONNX model: {model_path}")
    session = ort.InferenceSession(model_path)
    print("    Status: Model loaded successfully!")
    
    import os
    size_kb = os.path.getsize(model_path) / 1024
    print(f"    Size: {size_kb:.2f} KB (tiny!)")
    
    # Demo predictions
    print("\n[2] Running live predictions...")
    print("-"*70)
    
    demo_texts = [
        "This product is absolutely amazing! I love it so much!",
        "Terrible quality. Would not recommend to anyone.",
        "It's okay, nothing really stands out.",
        "Best purchase ever! Fantastic value for money!",
        "Awful experience. Waste of time and money.",
        "The customer service was excellent and very helpful!",
    ]
    
    for i, text in enumerate(demo_texts, 1):
        result = predict_sentiment(session, text)
        
        print(f"\n{i}. Input: \"{text}\"")
        print(f"   Output: {result['emoji']} {result['sentiment']} (confidence: {result['confidence']})")
        print(f"   Scores: Pos={result['positive_score']:.3f}, Neg={result['negative_score']:.3f}")
    
    print("\n" + "="*70)
    print(" "*25 + "DEMO COMPLETED!")
    print("="*70)
    
    # Interactive mode for judges/viewers
    print("\n[3] Try it yourself! (Press Ctrl+C to exit)")
    print("-"*70)
    
    try:
        while True:
            text = input("\nEnter your text: ").strip()
            if not text:
                print("   (Please enter some text)")
                continue
            
            result = predict_sentiment(session, text)
            print(f"\n   {result['emoji']} {result['sentiment']} - {result['confidence']} confidence")
            print(f"   Positive: {result['positive_score']:.3f} | Negative: {result['negative_score']:.3f}")
    
    except KeyboardInterrupt:
        print("\n\nThank you for watching the demo!")
        print("This model can be deployed to AWS Lambda in seconds!")
        print("="*70)

