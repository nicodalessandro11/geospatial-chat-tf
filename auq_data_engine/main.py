# auq-etl/main.py

"""
Script: main.py

This script runs the full ETL + Validation + Upload workflow in this order:
1. Districts
2. Neighbourhoods (requires districts)
3. Point Features
4. Indicators

Author: Nico D'Alessandro Calderon (nico.dalessandro@gmail.com)
Date: 2025-04-17
"""

import subprocess
import sys
import argparse
from auq_data_engine.barcelona import load_districts as bcn_d
from auq_data_engine.barcelona import load_neighbourhoods as bcn_n
from auq_data_engine.barcelona import load_point_features as bcn_p
from auq_data_engine.barcelona import load_indicators as bcn_i
from auq_data_engine.madrid import load_districts as mad_d
from auq_data_engine.madrid import load_neighbourhoods as mad_n
from auq_data_engine.madrid import load_point_features as mad_p
from auq_data_engine.madrid import load_indicators as mad_i
from auq_data_engine.upload import upload_to_supabase as upload
from pathlib import Path

F = "[main.py]"

# =====================
# Utility
# =====================

def run_tests(test_target: str):
    print(f"{F} 🧪 Running test suite for `{test_target}`...")
    result = subprocess.run(["pytest", f"auq_data_engine/tests/{test_target}"], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"{F} ❌ Tests failed. Upload aborted.")
        sys.exit(1)
    print(f"{F} ✅ All tests passed.\n")

# =====================
# Base Data Pipeline
# =====================

def process_base_data():
    print(f"{F} 📊 Running BASE DATA ETLs...")

    bcn_d.run()
    mad_d.run()
    print(f"{F} ✅ District ETLs complete.")

    upload.run_district_upload()

    bcn_n.run()
    mad_n.run()
    print(f"{F} ✅ Neighbourhood ETLs complete.")

    upload.run_neighbourhood_upload()

    run_tests("test_base_data_upload.py")

# =====================
# Point Feature Pipeline
# =====================

def process_point_features():
    print(f"{F} 📍 Running POINT FEATURE ETLs...")

    # Get the correct manifest path
    manifest_path = Path(__file__).resolve().parent / "data/api-file-manifest.json"
    
    bcn_p.run(manifest_path=manifest_path)
    mad_p.run(manifest_path=manifest_path)

    run_tests("test_point_features_upload.py")

    upload.run_point_feature_upload()

# =====================
# Indicator Pipeline
# =====================

def process_indicators():
    print(f"{F} 📈 Running INDICATOR ETLs...")

    bcn_i.run()
    mad_i.run()

    run_tests("test_indicators_upload.py")

    upload.run_indicator_upload()

# =====================
# Entry Point
# =====================

def run_all():
    process_base_data()
    process_point_features()
    process_indicators()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the full ETL pipeline for Are-U-Query-ous.")
    parser.add_argument("--skip-upload", action="store_true", help="Run ETLs only (skip Supabase upload)")

    args = parser.parse_args()

    if args.skip_upload:
        print(f"{F} ⚙️ Developer mode: running ETLs and tests only (no upload)...")
        bcn_d.run()
        mad_d.run()
        bcn_n.run()
        mad_n.run()
        run_tests("test_base_data_upload.py")
        bcn_p.run()
        mad_p.run()
        run_tests("test_point_features_upload.py")
        bcn_i.run()
        mad_i.run()
        run_tests("test_indicators_upload.py")
        print(f"{F} ✅ Developer ETL and test run complete.")
    else:
        run_all()
