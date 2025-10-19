#!/usr/bin/env python3
"""
Create a simple text classification ONNX model that actually works
Uses only numpy and onnx - no PyTorch/TensorFlow needed
"""

import numpy as np

# Install onnx if needed
try:
    import onnx
    from onnx import helper, TensorProto, numpy_helper
except ImportError:
    import subprocess
    print("Installing onnx...")
    subprocess.check_call(['pip3', 'install', '--break-system-packages', 'onnx'])
    import onnx
    from onnx import helper, TensorProto, numpy_helper

print("Creating text classification ONNX model...")

# Model architecture:
# Input: [batch_size, 128] - text features
# Hidden: [128, 32] -> ReLU
# Output: [32, 2] -> Softmax (negative, positive)

# Create random weights (in production, these would be trained)
np.random.seed(42)  # For reproducibility

W1 = np.random.randn(128, 32).astype(np.float32) * 0.1
b1 = np.zeros(32, dtype=np.float32)

W2 = np.random.randn(32, 2).astype(np.float32) * 0.1
# Bias towards positive sentiment for demo
b2 = np.array([0.0, 0.3], dtype=np.float32)

# Define input
input_tensor = helper.make_tensor_value_info('input', TensorProto.FLOAT, [None, 128])

# Define output
output_tensor = helper.make_tensor_value_info('output', TensorProto.FLOAT, [None, 2])

# Create weight initializers
W1_init = numpy_helper.from_array(W1, 'W1')
b1_init = numpy_helper.from_array(b1, 'b1')
W2_init = numpy_helper.from_array(W2, 'W2')
b2_init = numpy_helper.from_array(b2, 'b2')

# Build the graph
# Layer 1: input @ W1 + b1
matmul1 = helper.make_node('MatMul', ['input', 'W1'], ['matmul1'])
add1 = helper.make_node('Add', ['matmul1', 'b1'], ['add1'])
relu = helper.make_node('Relu', ['add1'], ['relu'])

# Layer 2: relu @ W2 + b2
matmul2 = helper.make_node('MatMul', ['relu', 'W2'], ['matmul2'])
add2 = helper.make_node('Add', ['matmul2', 'b2'], ['add2'])

# Softmax
softmax = helper.make_node('Softmax', ['add2'], ['output'], axis=1)

# Create the graph
graph = helper.make_graph(
    [matmul1, add1, relu, matmul2, add2, softmax],
    'text_sentiment_classifier',
    [input_tensor],
    [output_tensor],
    [W1_init, b1_init, W2_init, b2_init]
)

# Create the model
model = helper.make_model(graph, producer_name='weave-text-classifier')
model.opset_import[0].version = 13

# Check the model
onnx.checker.check_model(model)

# Save
output_file = 'sentiment-model.onnx'
with open(output_file, 'wb') as f:
    f.write(model.SerializeToString())

print(f"✅ Model created: {output_file}")

# Get size
import os
size_kb = os.path.getsize(output_file) / 1024
print(f"📊 Model size: {size_kb:.2f} KB")

# Test with onnxruntime if available
try:
    import onnxruntime as ort
    
    session = ort.InferenceSession(output_file)
    
    # Test with sample input
    test_input = np.random.randn(1, 128).astype(np.float32)
    output = session.run(None, {'input': test_input})
    
    print(f"\n🧪 Test inference:")
    print(f"   Input shape: {test_input.shape}")
    print(f"   Output shape: {output[0].shape}")
    print(f"   Probabilities: [negative={output[0][0][0]:.3f}, positive={output[0][0][1]:.3f}]")
    print(f"   Predicted: {'positive' if output[0][0][1] > output[0][0][0] else 'negative'}")
    
    # Test with different inputs
    print(f"\n📝 Testing with different inputs:")
    for i in range(3):
        test_input = np.random.randn(1, 128).astype(np.float32) * (i + 1)
        output = session.run(None, {'input': test_input})
        sentiment = 'positive' if output[0][0][1] > output[0][0][0] else 'negative'
        confidence = max(output[0][0])
        print(f"   Test {i+1}: {sentiment} (confidence: {confidence:.3f})")
    
except ImportError:
    print("\n⚠️  onnxruntime not installed, skipping test")
    print("   Model should work in Lambda")

print(f"\n✅ Model ready!")
print(f"\n📤 Upload to S3:")
print(f"aws s3 cp {output_file} s3://weave-model-storage/user123/{output_file}")

