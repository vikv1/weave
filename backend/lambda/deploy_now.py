#!/usr/bin/env python3
"""
Deploy Lambda function to AWS (non-interactive)
"""

import os
import subprocess
import sys

LAMBDA_FUNCTION_NAME = "weave-inference"
ZIP_FILE = "lambda-deployment.zip"
BUCKET = "weave-model-storage"
S3_KEY = f"lambda/{ZIP_FILE}"

def run_command(cmd, description):
    """Run a shell command"""
    print(f"\n[*] {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed!")
        print(f"Error: {e.stderr}")
        return False

def deploy():
    print("="*70)
    print(" "*20 + "DEPLOYING TO AWS LAMBDA")
    print("="*70)
    
    # Check if zip exists
    if not os.path.exists(ZIP_FILE):
        print(f"\n[ERROR] {ZIP_FILE} not found!")
        print(f"Run 'python deploy.py' first to create the package.")
        return False
    
    size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
    print(f"\n[INFO] Package: {ZIP_FILE} ({size_mb:.2f} MB)")
    
    # Upload to S3
    print(f"\n[STEP 1/3] Uploading to S3...")
    cmd = f'aws s3 cp {ZIP_FILE} s3://{BUCKET}/{S3_KEY}'
    if not run_command(cmd, f"Uploading to s3://{BUCKET}/{S3_KEY}"):
        return False
    
    # Update Lambda function
    print(f"\n[STEP 2/3] Updating Lambda function...")
    cmd = f'aws lambda update-function-code --function-name {LAMBDA_FUNCTION_NAME} --s3-bucket {BUCKET} --s3-key {S3_KEY}'
    if not run_command(cmd, f"Updating {LAMBDA_FUNCTION_NAME}"):
        return False
    
    # Update configuration
    print(f"\n[STEP 3/3] Updating configuration...")
    
    # Set memory and timeout
    cmd = f'aws lambda update-function-configuration --function-name {LAMBDA_FUNCTION_NAME} --memory-size 1024 --timeout 30'
    run_command(cmd, "Setting memory=1024MB, timeout=30s")
    
    # Set environment variables
    cmd = f'aws lambda update-function-configuration --function-name {LAMBDA_FUNCTION_NAME} --environment Variables={{MODEL_BUCKET=weave-model-storage}}'
    run_command(cmd, "Setting MODEL_BUCKET environment variable")
    
    print("\n" + "="*70)
    print("[SUCCESS] Deployment complete!")
    print("="*70)
    print(f"\nFunction: {LAMBDA_FUNCTION_NAME}")
    print(f"Handler: inference_onnx.lambda_handler")
    print(f"Memory: 1024 MB")
    print(f"Timeout: 30 seconds")
    print(f"Environment: MODEL_BUCKET=weave-model-storage")
    
    # Create test event
    import json
    test_event = {
        "uid": "user123",
        "model_name": "sentiment-model.onnx",
        "input": "This product is amazing! I love it!"
    }
    
    with open("test_event.json", "w") as f:
        json.dump(test_event, f, indent=2)
    
    print(f"\n[INFO] Created test_event.json")
    print(f"\nTo test:")
    print(f"  aws lambda invoke --function-name {LAMBDA_FUNCTION_NAME} \\")
    print(f"    --payload file://test_event.json response.json")
    print(f"  cat response.json")
    
    return True

if __name__ == "__main__":
    if deploy():
        print("\n[SUCCESS] All done!")
    else:
        print("\n[ERROR] Deployment failed!")
        sys.exit(1)

