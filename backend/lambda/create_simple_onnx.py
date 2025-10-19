"""
Create a simple ONNX model directly using onnx library
No PyTorch or sklearn needed!
"""

import numpy as np
try:
    import onnx
    from onnx import helper, TensorProto
except ImportError:
    print("Installing onnx...")
    import subprocess
    subprocess.check_call(['pip3', 'install', '--break-system-packages', 'onnx'])
    import onnx
    from onnx import helper, TensorProto

# Create a simple sentiment classifier
# Input: [batch_size, 128] - normalized character values
# Output: [batch_size, 2] - probabilities for [negative, positive]

print("Creating simple ONNX sentiment model...")

# Define input
input_tensor = helper.make_tensor_value_info(
    'input',
    TensorProto.FLOAT,
    [None, 128]  # Dynamic batch size, 128 features
)

# Define output
output_tensor = helper.make_tensor_value_info(
    'output',
    TensorProto.FLOAT,
    [None, 2]  # Dynamic batch size, 2 classes
)

# Create weights for a simple linear layer
# W: [128, 64]
W1 = np.random.randn(128, 64).astype(np.float32) * 0.1
b1 = np.random.randn(64).astype(np.float32) * 0.1

# W2: [64, 2]
W2 = np.random.randn(64, 2).astype(np.float32) * 0.1
# Bias positive sentiment slightly
b2 = np.array([0.0, 0.2], dtype=np.float32)

# Create weight tensors
W1_init = helper.make_tensor(
    'W1',
    TensorProto.FLOAT,
    [128, 64],
    W1.flatten().tolist()
)

b1_init = helper.make_tensor(
    'b1',
    TensorProto.FLOAT,
    [64],
    b1.tolist()
)

W2_init = helper.make_tensor(
    'W2',
    TensorProto.FLOAT,
    [64, 2],
    W2.flatten().tolist()
)

b2_init = helper.make_tensor(
    'b2',
    TensorProto.FLOAT,
    [2],
    b2.tolist()
)

# Create nodes
# Layer 1: input @ W1 + b1
matmul1_node = helper.make_node(
    'MatMul',
    inputs=['input', 'W1'],
    outputs=['matmul1_output']
)

add1_node = helper.make_node(
    'Add',
    inputs=['matmul1_output', 'b1'],
    outputs=['add1_output']
)

relu_node = helper.make_node(
    'Relu',
    inputs=['add1_output'],
    outputs=['relu_output']
)

# Layer 2: relu_output @ W2 + b2
matmul2_node = helper.make_node(
    'MatMul',
    inputs=['relu_output', 'W2'],
    outputs=['matmul2_output']
)

add2_node = helper.make_node(
    'Add',
    inputs=['matmul2_output', 'b2'],
    outputs=['add2_output']
)

# Softmax
softmax_node = helper.make_node(
    'Softmax',
    inputs=['add2_output'],
    outputs=['output'],
    axis=1
)

# Create graph
graph = helper.make_graph(
    [matmul1_node, add1_node, relu_node, matmul2_node, add2_node, softmax_node],
    'sentiment_classifier',
    [input_tensor],
    [output_tensor],
    [W1_init, b1_init, W2_init, b2_init]
)

# Create model
model = helper.make_model(graph, producer_name='weave')
model.opset_import[0].version = 13

# Check model
onnx.checker.check_model(model)

# Save model
with open('sentiment-model.onnx', 'wb') as f:
    f.write(model.SerializeToString())

print("✅ Model created: sentiment-model.onnx")

# Get file size
import os
size_kb = os.path.getsize('sentiment-model.onnx') / 1024
print(f"📊 Model size: {size_kb:.2f} KB")

# Test the model
try:
    import onnxruntime as ort
    
    session = ort.InferenceSession('sentiment-model.onnx')
    
    # Test with random input
    test_input = np.random.randn(1, 128).astype(np.float32)
    output = session.run(None, {'input': test_input})
    
    print(f"\n🧪 Test inference:")
    print(f"   Input shape: {test_input.shape}")
    print(f"   Output shape: {output[0].shape}")
    print(f"   Probabilities: [negative={output[0][0][0]:.3f}, positive={output[0][0][1]:.3f}]")
    print(f"   Predicted: {'positive' if output[0][0][1] > output[0][0][0] else 'negative'}")
    
    print("\n✅ Model is ready to use!")
    print(f"\nUpload to S3:")
    print(f"aws s3 cp sentiment-model.onnx s3://weave-model-storage/user123/sentiment-model.onnx")
    
except ImportError:
    print("\n⚠️  onnxruntime not installed for testing, but model should work in Lambda")

