# auq_data_engine/tests/test_base_data_upload.py

"""
Test Suite: ETL Output Validation (Base Data)

This test module ensures that all processed ETL base files:
- Exist and are not empty
- Contain valid and accurate geometries
- Preserve shapes between raw and processed data

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import pytest
import requests
import geopandas as gpd
from shapely import wkt
from pathlib import Path

# =====================
# Paths & Manifest
# =====================

BASE_DIR = Path(__file__).resolve().parent.parent
print(f"Base directory is: {BASE_DIR}")
PROCESSED_DIR = BASE_DIR / "data/processed"
MANIFEST_PATH = BASE_DIR / "data/api-file-manifest.json"

with open(MANIFEST_PATH, encoding="utf-8") as f:
    MANIFEST = json.load(f)

# =====================
# Geometry Comparison Utility
# =====================

def compare_geometries(raw_geom, processed_geom, tolerance=0.00001):
    try:
        shape_raw = wkt.loads(raw_geom)
        shape_processed = wkt.loads(processed_geom.replace("SRID=4326;", ""))
        return shape_raw.equals_exact(shape_processed, tolerance)
    except Exception as e:
        print(f"⚠️ Geometry comparison error: {e}")
        return False

# =====================
# Test Case Generator
# =====================

def get_base_data_cases():
    """Yield tuples of (city, dtype, raw_data_url, processed_file) for districts + neighbourhoods."""
    for city, entries in MANIFEST.items():
        for dtype in ("districts", "neighbourhoods"):
            if dtype in entries:
                yield (
                    city,
                    dtype,
                    entries[dtype]["raw_file"],
                    entries[dtype]["processed_file"]
                )

# =====================
# Test: Processed File Exists and Has Data
# =====================

@pytest.mark.parametrize("city,dtype,raw_data_url,processed_filename", get_base_data_cases())
def test_processed_file_not_empty(city, dtype, raw_data_url, processed_filename):
    path = PROCESSED_DIR / processed_filename
    assert path.exists(), f"❌ Missing processed file for {city}/{dtype}: {processed_filename}"
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list), f"❌ Expected list in {processed_filename}"
    assert len(data) > 0, f"❌ {processed_filename} is empty"

# =====================
# Test: Geometry Preservation
# =====================

@pytest.mark.parametrize("city,dtype,raw_data_url,processed_filename", get_base_data_cases())
def test_geometry_preserved(city, dtype, raw_data_url, processed_filename):
    processed_path = PROCESSED_DIR / processed_filename

    # 🛰️ Fetch raw data from Supabase public link
    try:
        response = requests.get(raw_data_url)
        response.raise_for_status()
    except Exception as e:
        pytest.fail(f"❌ Failed to download raw data from {raw_data_url}: {e}")

    try:
        if raw_data_url.endswith(".json"):
            if "madrid" in city:
                # Use GeoPandas for TopoJSON/GeoJSON
                gdf = gpd.read_file(raw_data_url)
                raw_geom = gdf.geometry.iloc[0].wkt
            else:
                raw_json = response.json()
                raw_geom = raw_json[0]["geometria_wgs84"]
        else:
            pytest.skip(f"Skipping non-JSON test for {city}/{dtype}")
    except Exception as e:
        pytest.fail(f"❌ Error parsing raw geometry from {raw_data_url}: {e}")

    # 🗂️ Load processed geometry
    try:
        with processed_path.open(encoding="utf-8") as f:
            processed = json.load(f)
        processed_geom = processed[0]["geom"]
    except Exception as e:
        pytest.fail(f"❌ Could not read processed file: {processed_filename}: {e}")

    assert compare_geometries(raw_geom, processed_geom), \
        f"❌ Geometry mismatch for {city}/{dtype}"