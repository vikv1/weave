#!/usr/bin/env python3
"""
Deploy Lambda function to AWS
Packages dependencies and uploads to weave-inference function
"""

import os
import sys
import subprocess
import shutil
import zipfile
from pathlib import Path

LAMBDA_FUNCTION_NAME = "weave-inference"
PACKAGE_DIR = "lambda_package"
ZIP_FILE = "lambda-deployment.zip"

def run_command(cmd, description):
    """Run a shell command and handle errors"""
    print(f"\n[*] {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed!")
        print(f"Error: {e.stderr}")
        return False

def create_package():
    """Create Lambda deployment package"""
    print("="*70)
    print(" "*20 + "LAMBDA DEPLOYMENT")
    print("="*70)
    
    # Clean up old package
    if os.path.exists(PACKAGE_DIR):
        print(f"\n[*] Cleaning up old package directory...")
        shutil.rmtree(PACKAGE_DIR)
    
    if os.path.exists(ZIP_FILE):
        print(f"[*] Removing old zip file...")
        os.remove(ZIP_FILE)
    
    # Create package directory
    print(f"\n[*] Creating package directory: {PACKAGE_DIR}")
    os.makedirs(PACKAGE_DIR, exist_ok=True)
    
    # Install dependencies
    print(f"\n[*] Installing dependencies...")
    deps = ["onnxruntime", "numpy"]
    
    for dep in deps:
        cmd = f'pip install {dep} -t {PACKAGE_DIR} --upgrade'
        if not run_command(cmd, f"Installing {dep}"):
            return False
    
    # Copy Lambda handler
    print(f"\n[*] Copying Lambda handler...")
    shutil.copy2("inference_onnx.py", os.path.join(PACKAGE_DIR, "inference_onnx.py"))
    
    # Create zip file
    print(f"\n[*] Creating deployment package: {ZIP_FILE}")
    with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PACKAGE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, PACKAGE_DIR)
                zipf.write(file_path, arcname)
                if file == "inference_onnx.py":
                    print(f"    Added: {arcname}")
    
    # Get zip size
    size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
    print(f"\n[SUCCESS] Package created: {ZIP_FILE} ({size_mb:.2f} MB)")
    
    # Clean up package directory
    print(f"\n[*] Cleaning up temporary files...")
    shutil.rmtree(PACKAGE_DIR)
    
    return True

def deploy_to_aws():
    """Deploy package to AWS Lambda"""
    print("\n" + "="*70)
    print(" "*20 + "AWS DEPLOYMENT")
    print("="*70)
    
    # Check if zip exists
    if not os.path.exists(ZIP_FILE):
        print(f"[ERROR] Package not found: {ZIP_FILE}")
        return False
    
    size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
    
    if size_mb > 50:
        print(f"\n[INFO] Package size: {size_mb:.2f} MB")
        print(f"[INFO] Package is >50MB, using S3 upload method...")
        
        # Upload to S3 first
        bucket = "weave-model-storage"
        s3_key = f"lambda/{ZIP_FILE}"
        
        cmd = f'aws s3 cp {ZIP_FILE} s3://{bucket}/{s3_key}'
        if not run_command(cmd, "Uploading to S3"):
            return False
        
        # Update Lambda from S3
        cmd = f'aws lambda update-function-code --function-name {LAMBDA_FUNCTION_NAME} --s3-bucket {bucket} --s3-key {s3_key}'
        if not run_command(cmd, "Updating Lambda function from S3"):
            return False
    else:
        print(f"\n[INFO] Package size: {size_mb:.2f} MB")
        print(f"[INFO] Package is <50MB, using direct upload...")
        
        # Direct upload
        cmd = f'aws lambda update-function-code --function-name {LAMBDA_FUNCTION_NAME} --zip-file fileb://{ZIP_FILE}'
        if not run_command(cmd, "Updating Lambda function"):
            return False
    
    print(f"\n[SUCCESS] Lambda function updated: {LAMBDA_FUNCTION_NAME}")
    
    # Update configuration
    print(f"\n[*] Updating Lambda configuration...")
    
    # Update memory and timeout
    cmd = f'aws lambda update-function-configuration --function-name {LAMBDA_FUNCTION_NAME} --memory-size 1024 --timeout 30'
    run_command(cmd, "Updating memory and timeout")
    
    # Set environment variables
    cmd = f'aws lambda update-function-configuration --function-name {LAMBDA_FUNCTION_NAME} --environment Variables={{MODEL_BUCKET=weave-model-storage}}'
    run_command(cmd, "Setting environment variables")
    
    print("\n" + "="*70)
    print("[SUCCESS] Deployment complete!")
    print("="*70)
    
    print(f"\nLambda function: {LAMBDA_FUNCTION_NAME}")
    print(f"Handler: inference_onnx.lambda_handler")
    print(f"Memory: 1024 MB")
    print(f"Timeout: 30 seconds")
    print(f"\nTest with:")
    print(f'  aws lambda invoke --function-name {LAMBDA_FUNCTION_NAME} --payload file://test_event.json response.json')
    
    return True

def create_test_event():
    """Create a test event file"""
    import json
    
    test_event = {
        "uid": "user123",
        "model_name": "sentiment-model.onnx",
        "input": "This product is amazing! I love it!"
    }
    
    with open("test_event.json", "w") as f:
        json.dump(test_event, f, indent=2)
    
    print(f"\n[INFO] Created test_event.json")

if __name__ == "__main__":
    print("\n" + "="*70)
    print(" "*15 + "WEAVE LAMBDA DEPLOYMENT SCRIPT")
    print("="*70)
    
    # Check if AWS CLI is available
    try:
        result = subprocess.run("aws --version", shell=True, capture_output=True, text=True)
        print(f"\n[INFO] AWS CLI: {result.stdout.strip()}")
    except:
        print("\n[ERROR] AWS CLI not found. Please install AWS CLI first.")
        sys.exit(1)
    
    # Create package
    if not create_package():
        print("\n[ERROR] Package creation failed!")
        sys.exit(1)
    
    # Ask for confirmation
    print(f"\n{'='*70}")
    response = input(f"Deploy to Lambda function '{LAMBDA_FUNCTION_NAME}'? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        # Deploy to AWS
        if deploy_to_aws():
            create_test_event()
            print("\n[SUCCESS] All done! Lambda function is ready to use.")
        else:
            print("\n[ERROR] Deployment failed!")
            sys.exit(1)
    else:
        print(f"\n[INFO] Deployment cancelled. Package saved as: {ZIP_FILE}")
        print(f"[INFO] You can manually upload it to AWS Lambda.")

