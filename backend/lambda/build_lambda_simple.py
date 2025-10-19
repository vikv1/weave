#!/usr/bin/env python3
"""
Simple Lambda package builder - downloads correct Linux wheels
"""

import os
import sys
import shutil
import zipfile
import subprocess

PACKAGE_DIR = "lambda_final"
ZIP_FILE = "lambda-final-linux.zip"

def run_cmd(cmd):
    """Run command and return success"""
    try:
        subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        return True
    except:
        return False

def build_package():
    """Build Lambda package"""
    print("="*70)
    print(" "*20 + "BUILDING LAMBDA PACKAGE")
    print("="*70)
    
    # Clean up
    if os.path.exists(PACKAGE_DIR):
        print("\n[1/5] Cleaning up...")
        shutil.rmtree(PACKAGE_DIR)
    if os.path.exists(ZIP_FILE):
        os.remove(ZIP_FILE)
    
    os.makedirs(PACKAGE_DIR, exist_ok=True)
    
    # Download wheels for Linux
    print("\n[2/5] Downloading Linux wheels...")
    print("      (This may take a minute...)")
    
    # Download for manylinux (Amazon Linux compatible)
    cmd = f'pip download onnxruntime numpy --platform manylinux2014_x86_64 --python-version 311 --only-binary=:all: --dest {PACKAGE_DIR}_wheels'
    
    os.makedirs(f"{PACKAGE_DIR}_wheels", exist_ok=True)
    
    if not run_cmd(cmd):
        print("      Failed to download with platform spec, trying direct install...")
        # Fallback: install directly but this will get Windows versions
        return False
    
    # Extract wheels
    print("\n[3/5] Extracting packages...")
    wheels_dir = f"{PACKAGE_DIR}_wheels"
    
    for wheel_file in os.listdir(wheels_dir):
        if wheel_file.endswith('.whl'):
            wheel_path = os.path.join(wheels_dir, wheel_file)
            print(f"      Extracting {wheel_file}...")
            
            with zipfile.ZipFile(wheel_path, 'r') as zip_ref:
                for member in zip_ref.namelist():
                    # Skip .dist-info directories
                    if '.dist-info/' not in member and '__pycache__' not in member:
                        zip_ref.extract(member, PACKAGE_DIR)
    
    # Clean up wheels
    shutil.rmtree(wheels_dir)
    
    # Copy Lambda handler
    print("\n[4/5] Adding Lambda handler...")
    shutil.copy2("inference_onnx.py", os.path.join(PACKAGE_DIR, "inference_onnx.py"))
    
    # Create final zip
    print("\n[5/5] Creating ZIP package...")
    with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PACKAGE_DIR):
            dirs[:] = [d for d in dirs if d != '__pycache__']
            
            for file in files:
                if not file.endswith('.pyc'):
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, PACKAGE_DIR)
                    zipf.write(file_path, arcname)
    
    # Clean up
    shutil.rmtree(PACKAGE_DIR)
    
    size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
    print(f"\n[SUCCESS] Package: {ZIP_FILE} ({size_mb:.2f} MB)")
    
    return True

if __name__ == "__main__":
    try:
        if build_package():
            print("\n" + "="*70)
            print("Upload to S3, then update Lambda function!")
            print("="*70)
        else:
            print("\n[ERROR] Build failed. You may need to use AWS Console to upload.")
            print("See UPLOAD_TO_AWS.txt for manual instructions.")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

