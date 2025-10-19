#!/usr/bin/env python3
"""
Build a clean Lambda package with correct Linux wheels
Downloads pre-built manylinux wheels directly
"""

import os
import sys
import shutil
import zipfile
import urllib.request
import subprocess

PACKAGE_DIR = "lambda_clean"
ZIP_FILE = "lambda-clean.zip"

# Direct URLs for Linux-compatible wheels (Python 3.11, manylinux)
WHEELS = {
    "onnxruntime": "https://files.pythonhosted.org/packages/82/08/1ed1f94e9713c0fdaaa24ca001a2ae884ca7c9b63045dd2e5cd15efc5a8e/onnxruntime-1.20.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl",
    "numpy": "https://files.pythonhosted.org/packages/4b/d7/ecf26d34c9671c43bec8b7591e15a051805ab268a81e8020e1f0f2b8e6eb/numpy-1.26.4-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl",
    "protobuf": "https://files.pythonhosted.org/packages/a5/73/4e1811d2e2772cb970f266bf6ea0putz/protobuf-5.29.5-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl",
    "flatbuffers": "https://files.pythonhosted.org/packages/6f/12/d5c79ee252793ffe845d58a913197bfa02ae9a0b5c9bc3dc4b58d477b9e7/flatbuffers-24.3.25-py2.py3-none-any.whl",
    "coloredlogs": "https://files.pythonhosted.org/packages/a7/0f/86ad23b98553e2a0b234f5c29e67c3691b3dba987bdd439e9e0bafb22ac1/coloredlogs-15.0.1-py2.py3-none-any.whl",
    "humanfriendly": "https://files.pythonhosted.org/packages/cc/3f/2c29224acb2e2df4d2046e4c73ee2662023c58ff5b113c4c1adac0886c43/humanfriendly-10.0-py2.py3-none-any.whl",
    "sympy": "https://files.pythonhosted.org/packages/34/86/14eb8aef472b2dee54909f1e7bbc45c3dce06bcf82f0ae6a4d2e0b0509ca/sympy-1.13.3-py3-none-any.whl",
    "mpmath": "https://files.pythonhosted.org/packages/43/e3/7d92a15f894aa0c9c4b49b8ee9ac9850d6e63b03c9c32c0367a13ae62209/mpmath-1.3.0-py3-none-any.whl",
    "packaging": "https://files.pythonhosted.org/packages/08/aa/cc0199a5f0ad350994d660967a8efb233fe0416e4639146c089643407ce6/packaging-24.2-py3-none-any.whl",
}

def download_wheel(name, url, dest_dir):
    """Download a wheel file"""
    filename = url.split('/')[-1]
    filepath = os.path.join(dest_dir, filename)
    
    print(f"  Downloading {name}...")
    try:
        urllib.request.urlretrieve(url, filepath)
        return filepath
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def extract_wheel(wheel_path, dest_dir):
    """Extract a wheel file"""
    print(f"  Extracting {os.path.basename(wheel_path)}...")
    with zipfile.ZipFile(wheel_path, 'r') as zip_ref:
        zip_ref.extractall(dest_dir)

def create_package():
    """Create Lambda package"""
    print("="*70)
    print(" "*15 + "BUILDING CLEAN LAMBDA PACKAGE")
    print("="*70)
    
    # Clean up
    if os.path.exists(PACKAGE_DIR):
        print("\n[*] Cleaning up old package...")
        shutil.rmtree(PACKAGE_DIR)
    
    if os.path.exists(ZIP_FILE):
        os.remove(ZIP_FILE)
    
    # Create directories
    print("\n[*] Creating package directory...")
    os.makedirs(PACKAGE_DIR, exist_ok=True)
    temp_dir = os.path.join(PACKAGE_DIR, "_temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Download and extract wheels
    print("\n[*] Downloading dependencies...")
    for name, url in WHEELS.items():
        wheel_path = download_wheel(name, url, temp_dir)
        if wheel_path:
            extract_wheel(wheel_path, PACKAGE_DIR)
    
    # Clean up wheel files and unnecessary directories
    print("\n[*] Cleaning up...")
    shutil.rmtree(temp_dir)
    
    # Remove .dist-info directories (not needed in Lambda)
    for item in os.listdir(PACKAGE_DIR):
        if item.endswith('.dist-info'):
            shutil.rmtree(os.path.join(PACKAGE_DIR, item))
    
    # Copy Lambda handler
    print("\n[*] Copying Lambda handler...")
    shutil.copy2("inference_onnx.py", os.path.join(PACKAGE_DIR, "inference_onnx.py"))
    
    # Create zip
    print("\n[*] Creating deployment package...")
    with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PACKAGE_DIR):
            # Skip __pycache__ directories
            dirs[:] = [d for d in dirs if d != '__pycache__']
            
            for file in files:
                if file.endswith('.pyc'):
                    continue
                    
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, PACKAGE_DIR)
                zipf.write(file_path, arcname)
    
    # Get size
    size_mb = os.path.getsize(ZIP_FILE) / (1024 * 1024)
    print(f"\n[SUCCESS] Package created: {ZIP_FILE} ({size_mb:.2f} MB)")
    
    # Clean up
    print("\n[*] Removing temporary files...")
    shutil.rmtree(PACKAGE_DIR)
    
    return True

def show_instructions():
    """Show upload instructions"""
    print("\n" + "="*70)
    print(" "*20 + "NEXT STEPS")
    print("="*70)
    print(f"""
1. Upload to S3:
   Go to AWS S3 Console and upload {ZIP_FILE} to:
   s3://weave-model-storage/lambda/{ZIP_FILE}

2. Update Lambda function:
   Go to AWS Lambda Console -> weave-inference
   Upload from S3: s3://weave-model-storage/lambda/{ZIP_FILE}

3. Test:
   powershell -File quick_test.ps1

Package: {ZIP_FILE}
Function: weave-inference
""")

if __name__ == "__main__":
    try:
        if create_package():
            show_instructions()
            print("\n[SUCCESS] Package ready for deployment!")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

