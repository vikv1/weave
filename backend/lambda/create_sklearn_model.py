"""
Create a simple sklearn model and convert to ONNX
No PyTorch needed!
"""

from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import pickle

# Create a simple sentiment classifier
print("Creating sklearn sentiment model...")

# Training data (simple examples)
texts = [
    "I love this product",
    "This is amazing",
    "Great quality",
    "Excellent service",
    "Best purchase ever",
    "I hate this",
    "Terrible quality",
    "Worst product",
    "Very disappointed",
    "Complete waste of money"
]

labels = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]  # 1=positive, 0=negative

# Create TF-IDF vectorizer
vectorizer = TfidfVectorizer(max_features=128)
X = vectorizer.fit_transform(texts)

# Train logistic regression
model = LogisticRegression()
model.fit(X, labels)

print("✅ Model trained")
print(f"Accuracy on training data: {model.score(X, labels):.2%}")

# Save the model and vectorizer
with open('sentiment_model.pkl', 'wb') as f:
    pickle.dump({'model': model, 'vectorizer': vectorizer}, f)

print("✅ Model saved to sentiment_model.pkl")

# Test the model
test_texts = [
    "This is great!",
    "I don't like it"
]

for text in test_texts:
    X_test = vectorizer.transform([text])
    prediction = model.predict(X_test)[0]
    proba = model.predict_proba(X_test)[0]
    sentiment = "positive" if prediction == 1 else "negative"
    print(f"Text: '{text}' -> {sentiment} (confidence: {max(proba):.2%})")

print("\n" + "="*50)
print("To convert to ONNX, install: pip install skl2onnx")
print("Then run the conversion script")

