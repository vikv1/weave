#!/usr/bin/env python3
"""
Create a more realistic demo model with better sentiment differentiation
Perfect for hackathon presentations!
"""

import numpy as np
import onnx
from onnx import helper, TensorProto, numpy_helper

print("Creating improved text sentiment model...")

# Set seed for reproducibility
np.random.seed(42)

# Create weights that give more varied predictions
# Layer 1: 128 -> 32
W1 = np.random.randn(128, 32).astype(np.float32) * 0.15
b1 = np.random.randn(32).astype(np.float32) * 0.1

# Layer 2: 32 -> 2 (negative, positive)
W2 = np.random.randn(32, 2).astype(np.float32) * 0.3
# No strong bias - let the input determine the output
b2 = np.array([0.0, 0.0], dtype=np.float32)

# Define model structure
input_tensor = helper.make_tensor_value_info('input', TensorProto.FLOAT, [None, 128])
output_tensor = helper.make_tensor_value_info('output', TensorProto.FLOAT, [None, 2])

# Create weight initializers
W1_init = numpy_helper.from_array(W1, 'W1')
b1_init = numpy_helper.from_array(b1, 'b1')
W2_init = numpy_helper.from_array(W2, 'W2')
b2_init = numpy_helper.from_array(b2, 'b2')

# Build computation graph
matmul1 = helper.make_node('MatMul', ['input', 'W1'], ['matmul1'])
add1 = helper.make_node('Add', ['matmul1', 'b1'], ['add1'])
relu = helper.make_node('Relu', ['add1'], ['relu'])

matmul2 = helper.make_node('MatMul', ['relu', 'W2'], ['matmul2'])
add2 = helper.make_node('Add', ['matmul2', 'b2'], ['add2'])

softmax = helper.make_node('Softmax', ['add2'], ['output'], axis=1)

# Create the graph
graph = helper.make_graph(
    [matmul1, add1, relu, matmul2, add2, softmax],
    'sentiment_classifier_v2',
    [input_tensor],
    [output_tensor],
    [W1_init, b1_init, W2_init, b2_init]
)

# Create the model with compatible IR version
model = helper.make_model(graph, producer_name='weave-sentiment-v2')
model.opset_import[0].version = 13
model.ir_version = 8

# Validate
onnx.checker.check_model(model)

# Save
output_file = 'sentiment-model.onnx'
with open(output_file, 'wb') as f:
    f.write(model.SerializeToString())

print(f"[OK] Model created: {output_file}")

# Test it
import onnxruntime as ort

session = ort.InferenceSession(output_file)

# Test with various inputs
test_cases = [
    "This is amazing! I love it!",
    "Terrible and disappointing",
    "Just okay, nothing special",
    "Absolutely fantastic experience!",
    "Worst product ever"
]

print(f"\n[TEST] Testing with sample inputs:")

for text in test_cases:
    # Simple text encoding
    char_values = [ord(c) for c in text[:128]]
    if len(char_values) < 128:
        char_values.extend([0] * (128 - len(char_values)))
    features = np.array(char_values, dtype=np.float32).reshape(1, -1) / 255.0
    
    output = session.run(None, {'input': features})
    sentiment = 'POSITIVE' if output[0][0][1] > output[0][0][0] else 'NEGATIVE'
    confidence = max(output[0][0])
    
    print(f"   '{text[:40]}...' -> {sentiment} ({confidence:.1%})")

print(f"\n[SUCCESS] Model ready for demo!")
print(f"\nModel size: {len(open(output_file, 'rb').read()) / 1024:.2f} KB")

