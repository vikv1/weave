#!/usr/bin/env python3
"""
Deploy Lambda function with Linux-compatible dependencies
"""

import os
import sys
import subprocess
import shutil
import zipfile

LAMBDA_FUNCTION_NAME = "weave-inference"
PACKAGE_DIR = "lambda_package_linux"
ZIP_FILE = "lambda-deployment-linux.zip"

def run_command(cmd, description):
    """Run a shell command"""
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

def create_linux_package():
    """Create Lambda package with Linux dependencies"""
    print("="*70)
    print(" "*15 + "CREATING LINUX LAMBDA PACKAGE")
    print("="*70)
    
    # Clean up
    if os.path.exists(PACKAGE_DIR):
        print(f"\n[*] Cleaning up old package...")
        shutil.rmtree(PACKAGE_DIR)
    
    if os.path.exists(ZIP_FILE):
        os.remove(ZIP_FILE)
    
    # Create package directory
    print(f"\n[*] Creating package directory...")
    os.makedirs(PACKAGE_DIR, exist_ok=True)
    
    # Install Linux-compatible dependencies
    print(f"\n[*] Installing Linux dependencies...")
    print("    This will download packages for Amazon Linux 2 / manylinux")
    
    # Use --platform to get Linux wheels
    deps = [
        "onnxruntime",
        "numpy"
    ]
    
    for dep in deps:
        print(f"\n[*] Installing {dep} for Linux...")
        
        # Try to get manylinux wheels (compatible with Amazon Linux)
        cmd = f'pip install {dep} --platform manylinux2014_x86_64 --only-binary=:all: --target {PACKAGE_DIR} --upgrade'
        
        if not run_command(cmd, f"Installing {dep} (manylinux)"):
            # Fallback: try without platform specification
            print(f"    Trying alternative method...")
            cmd = f'pip install {dep} --target {PACKAGE_DIR} --upgrade'
            if not run_command(cmd, f"Installing {dep} (fallback)"):
                print(f"[ERROR] Failed to install {dep}")
                return False
    
    # Copy Lambda handler
    print(f"\n[*] Copying Lambda handler...")
    shutil.copy2("inference_onnx.py", os.path.join(PACKAGE_DIR, "inference_onnx.py"))
    
    # Create zip
    print(f"\n[*] Creating deployment package: {ZIP_FILE}")
    with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PACKAGE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, PACKAGE_DIR)
                zipf.write(file_path, arcname)
    
    # Get size
    size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
    print(f"\n[SUCCESS] Package created: {ZIP_FILE} ({size_mb:.2f} MB)")
    
    # Clean up
    print(f"\n[*] Cleaning up...")
    shutil.rmtree(PACKAGE_DIR)
    
    return True

def show_upload_instructions():
    """Show manual upload instructions"""
    print("\n" + "="*70)
    print(" "*20 + "DEPLOYMENT INSTRUCTIONS")
    print("="*70)
    
    print(f"""
Since we're on Windows, we need to use the AWS Console or CLI to deploy.

OPTION 1: AWS Console (Recommended)
-----------------------------------
1. Upload to S3:
   - Go to: https://s3.console.aws.amazon.com/s3/buckets/weave-model-storage
   - Navigate to 'lambda/' folder (create if needed)
   - Upload: {ZIP_FILE}

2. Update Lambda:
   - Go to: https://console.aws.amazon.com/lambda
   - Find function: {LAMBDA_FUNCTION_NAME}
   - Click "Upload from" → "Amazon S3 location"
   - Enter: s3://weave-model-storage/lambda/{ZIP_FILE}
   - Click "Save"

OPTION 2: AWS CLI (if installed)
--------------------------------
Run these commands:

  aws s3 cp {ZIP_FILE} s3://weave-model-storage/lambda/{ZIP_FILE}
  
  aws lambda update-function-code \\
    --function-name {LAMBDA_FUNCTION_NAME} \\
    --s3-bucket weave-model-storage \\
    --s3-key lambda/{ZIP_FILE}

OPTION 3: Direct Upload (if < 50MB)
-----------------------------------
If the package is small enough:
  - Go to Lambda console
  - Click "Upload from" → ".zip file"
  - Select {ZIP_FILE}
  - Click "Save"

""")

if __name__ == "__main__":
    print("\n" + "="*70)
    print(" "*10 + "LAMBDA DEPLOYMENT (LINUX COMPATIBLE)")
    print("="*70)
    
    if create_linux_package():
        show_upload_instructions()
        print(f"\n[SUCCESS] Package ready for deployment!")
    else:
        print(f"\n[ERROR] Package creation failed!")
        sys.exit(1)

