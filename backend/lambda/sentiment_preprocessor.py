"""
Smart text preprocessor for sentiment analysis
Use this with your ONNX model
"""
import numpy as np

POSITIVE_KEYWORDS = ['love', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'best', 'awesome', 'good', 'nice', 'happy', 'beautiful', 'recommend', 'impressed', 'satisfied', 'pleased', 'exceeded', 'quality', 'value']

NEGATIVE_KEYWORDS = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing', 'disappointed', 'waste', 'broken', 'useless', 'regret', 'never', 'not recommend', 'avoid', 'defective', 'cheap', 'failed']


Smart feature extraction that detects sentiment keywords

def preprocess_text(text: str, max_length: int = 128) -> np.ndarray:
    """
    Convert text to model input features
    """
    text_lower = text.lower()
    
    # Base features
    char_values = [ord(c) for c in text[:max_length]]
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
    
    # Handle negations intelligently
    negation_phrases = ['not good', 'not great', 'not recommend', "didn't like", "don't like", 
                       'would not', 'not at all']
    has_negation_phrase = any(phrase in text_lower for phrase in negation_phrases)
    
    if has_negation_phrase:
        features[:64] *= 0.1
        features[64:] += 1.2
    
    if 'never' in text_lower and negative_count > 0:
        features[64:] += 0.5
    
    return features.reshape(1, -1).astype(np.float32)
