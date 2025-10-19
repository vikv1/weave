"""
Create a simple ONNX demo model for sentiment analysis
This is a tiny model perfect for testing
"""

import torch
import torch.nn as nn
import torch.onnx

class SimpleSentimentModel(nn.Module):
    """
    Simple sentiment classifier
    Input: Text encoded as character values (128 chars)
    Output: Binary classification (negative=0, positive=1)
    """
    def __init__(self):
        super(SimpleSentimentModel, self).__init__()
        self.fc1 = nn.Linear(128, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 2)  # 2 classes: negative, positive
        self.softmax = nn.Softmax(dim=1)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        x = self.relu(x)
        x = self.fc3(x)
        x = self.softmax(x)
        return x

# Create model
model = SimpleSentimentModel()
model.eval()

# Create dummy input (batch_size=1, sequence_length=128)
dummy_input = torch.randn(1, 128)

# Export to ONNX
torch.onnx.export(
    model,
    dummy_input,
    "simple-sentiment.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    },
    opset_version=11
)

print("✅ Model exported to simple-sentiment.onnx")
print(f"Model size: {os.path.getsize('simple-sentiment.onnx') / 1024:.2f} KB")

# Test the model
import onnxruntime as ort
import numpy as np

session = ort.InferenceSession("simple-sentiment.onnx")
test_input = np.random.randn(1, 128).astype(np.float32)
output = session.run(None, {'input': test_input})
print(f"Test output shape: {output[0].shape}")
print(f"Test probabilities: {output[0][0]}")
print(f"Predicted class: {np.argmax(output[0][0])}")

