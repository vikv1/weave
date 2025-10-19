#!/usr/bin/env python3
"""
Create a real, accurate sentiment analysis model using transformers
Downloads a pre-trained model and exports to ONNX
"""

import subprocess
import sys

# Install required packages
print("[1/5] Installing required packages...")
packages = ['transformers', 'torch', 'optimum[exporters]']

for package in packages:
    print(f"  Installing {package}...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package, '-q'])
    except:
        print(f"  Note: {package} installation attempted")

print("\n[2/5] Importing libraries...")
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path
import numpy as np

# Use a small, fast sentiment model
MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

print(f"\n[3/5] Downloading pre-trained model: {MODEL_NAME}")
print("  This is a real sentiment analysis model trained on thousands of examples!")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

print("\n[4/5] Exporting to ONNX format...")

# Create a dummy input for export
dummy_text = "This is a sample text for export"
inputs = tokenizer(dummy_text, return_tensors="pt", padding=True, truncation=True, max_length=128)

# Export to ONNX
output_path = "sentiment-model-real.onnx"

torch.onnx.export(
    model,
    tuple(inputs.values()),
    output_path,
    input_names=['input_ids', 'attention_mask'],
    output_names=['logits'],
    dynamic_axes={
        'input_ids': {0: 'batch_size', 1: 'sequence'},
        'attention_mask': {0: 'batch_size', 1: 'sequence'},
        'logits': {0: 'batch_size'}
    },
    do_constant_folding=True,
    opset_version=14,
)

print(f"[OK] Model exported to: {output_path}")

# Test the model
print("\n[5/5] Testing model accuracy...")
import onnxruntime as ort

session = ort.InferenceSession(output_path)

def predict_sentiment(text: str):
    """Run sentiment prediction"""
    # Tokenize
    inputs = tokenizer(text, return_tensors="np", padding=True, truncation=True, max_length=128)
    
    # Run model
    outputs = session.run(None, {
        'input_ids': inputs['input_ids'].astype(np.int64),
        'attention_mask': inputs['attention_mask'].astype(np.int64)
    })
    
    # Get logits and convert to probabilities
    logits = outputs[0][0]
    probs = torch.nn.functional.softmax(torch.tensor(logits), dim=0).numpy()
    
    # Labels: 0 = NEGATIVE, 1 = POSITIVE
    sentiment = "POSITIVE" if probs[1] > probs[0] else "NEGATIVE"
    confidence = max(probs) * 100
    
    return sentiment, confidence, probs

print("\nTesting on sample sentences:")
print("-" * 70)

test_sentences = [
    "This product is amazing! I absolutely love it!",
    "Terrible experience. Would not recommend.",
    "Best purchase I've ever made!",
    "Waste of money and time. Very disappointing.",
    "The customer service was fantastic!",
    "Awful quality. Broke after one day.",
    "It's okay, nothing special.",
    "Great value for money!",
    "Not good at all.",
    "Perfect! Exceeded my expectations!"
]

for text in test_sentences:
    sentiment, confidence, probs = predict_sentiment(text)
    print(f"\n'{text[:50]}...'")
    print(f"  -> {sentiment} (confidence: {confidence:.1f}%)")
    print(f"     [Negative: {probs[0]:.3f}, Positive: {probs[1]:.3f}]")

print("\n" + "="*70)
print("[SUCCESS] Real sentiment analysis model ready!")
print("="*70)

# Get file size
import os
size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"\nModel: {output_path}")
print(f"Size: {size_mb:.2f} MB")
print(f"\nThis is a production-quality model trained on real data!")
print(f"It will give accurate sentiment predictions for your demo.")

