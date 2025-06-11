# auq_data_engine/upload/upload_to_supabase.py

"""
ETL Script: Upload Processed Geo Data to Supabase

- Loads processed district, neighbourhood, point feature, and indicator data from disk
- Uploads records to corresponding Supabase tables
- Provides CLI-based execution with logging and error handling
- Includes validation to ensure data consistency

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from shared.common_lib.emoji_logger import info, success, warning, error

# ==================
# Configuration
# ==================
load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "data/processed"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Expected counts for validation
EXPECTED_COUNTS = {
    "bcn": {
        "districts": 10,
        "neighbourhoods": 73,
        "point_features": 0,
        "indicators": 0
    },
    "madrid": {
        "districts": 21,
        "neighbourhoods": 131,
        "point_features": 0,
        "indicators": 0
    }
}

# ==================
# Validation Utilities
# ==================
def validate_data(data: list, city: str, data_type: str) -> bool:
    """Validate data before upload to ensure completeness."""
    expected_count = EXPECTED_COUNTS[city][data_type]
    if expected_count > 0 and len(data) < expected_count:
        error(f"Expected {expected_count} {data_type} for {city} but found only {len(data)}. Aborting upload.")
        return False
    return True

def get_city_from_filename(filename: str) -> str:
    """Extract city name from filename."""
    return "bcn" if "bcn" in filename else "madrid"

# ==================
# Core Utilities
# ==================
def load_json_data(file_path: Path):
    try:
        with file_path.open(encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        error(f"Failed to read file {file_path}: {e}")
        return []

def upload(table_name: str, records: list[dict], city: str):
    if not records:
        warning(f"No records to upload to '{table_name}' for {city}")
        return False

    if not validate_data(records, city, table_name):
        return False

    try:
        # For point features, we need to handle duplicates based on coordinates
        if table_name == 'point_features':
            # Process records in batches to handle duplicates
            BATCH_SIZE = 100
            total_uploaded = 0
            total_skipped = 0
            
            # Print total records before processing
            info(f"Total records to process for {city}: {len(records)}")
            
            for i in range(0, len(records), BATCH_SIZE):
                batch = records[i:i + BATCH_SIZE]
                try:
                    # Check for duplicates within the batch
                    seen = set()
                    duplicates = []
                    unique_records = []
                    
                    for record in batch:
                        key = (record['feature_definition_id'], 
                              record['latitude'], 
                              record['longitude'], 
                              record['city_id'])
                        if key in seen:
                            duplicates.append(record)
                        else:
                            seen.add(key)
                            unique_records.append(record)
                    
                    if duplicates:
                        warning(f"Found {len(duplicates)} duplicates in batch {i//BATCH_SIZE + 1}")
                        warning(f"Example duplicate: {duplicates[0]}")
                        info(f"Unique records in this batch: {len(unique_records)}")
                    
                    # Use upsert with on_conflict to ignore duplicates
                    if unique_records:  # Only try to upload if we have unique records
                        response = supabase.table(table_name).upsert(
                            unique_records,
                            on_conflict='feature_definition_id,latitude,longitude,city_id'
                        ).execute()
                        if hasattr(response, "data") and response.data:
                            total_uploaded += len(response.data)
                            info(f"Successfully uploaded {len(response.data)} records in batch {i//BATCH_SIZE + 1}")
                except Exception as e:
                    error(f"Error uploading batch {i//BATCH_SIZE + 1}: {str(e)}")
                    total_skipped += len(batch)
                    continue
            
            if total_uploaded > 0:
                success(f"Successfully uploaded {total_uploaded} point features for {city}")
            if total_skipped > 0:
                warning(f"Skipped {total_skipped} duplicate point features for {city}")
            
            return total_uploaded > 0
        else:
            # For other tables, use upsert with appropriate conflict handling
            response = supabase.table(table_name).upsert(
                records,
                on_conflict='indicator_def_id,geo_level_id,geo_id,city_id,year' if table_name == 'indicators' else None
            ).execute()

            if hasattr(response, "status_code"):
                info(f"[{table_name}] Status: {response.status_code}")
            if hasattr(response, "data") and response.data:
                success(f"Uploaded {len(response.data)} records to '{table_name}' for {city}")
                return True
            else:
                warning(f"No data returned after uploading to '{table_name}' for {city}. Check Supabase logs.")
                return False
    except Exception as e:
        error(f"Error during upload to '{table_name}' for {city}: {e}")
        return False

# ================== 
# Execution Blocks
# ==================
def run_district_upload():
    info("Uploading districts...")
    files = [
        ("districts", PROCESSED_DIR / "insert_ready_districts_bcn.json"),
        ("districts", PROCESSED_DIR / "insert_ready_districts_madrid.json"),
    ]
    success = True
    for table, path in files:
        data = load_json_data(path)
        city = get_city_from_filename(path.name)
        if not upload(table, data, city):
            success = False
    return success

def run_neighbourhood_upload():
    info("Uploading neighbourhoods...")
    files = [
        ("neighbourhoods", PROCESSED_DIR / "insert_ready_neighbourhoods_bcn.json"),
        ("neighbourhoods", PROCESSED_DIR / "insert_ready_neighbourhoods_madrid.json"),
    ]
    success = True
    for table, path in files:
        data = load_json_data(path)
        city = get_city_from_filename(path.name)
        if not upload(table, data, city):
            success = False
    return success

def run_point_feature_upload():
    info("Uploading point features...")
    files = [
        ("point_features", PROCESSED_DIR / "insert_ready_point_features_bcn.json"),
        ("point_features", PROCESSED_DIR / "insert_ready_point_features_madrid.json"),
    ]
    success = True
    for table, path in files:
        data = load_json_data(path)
        city = get_city_from_filename(path.name)
        if not upload(table, data, city):
            success = False
    return success

def run_indicator_upload():
    info("Uploading indicators...")
    files = [
        ("indicators", PROCESSED_DIR / "insert_ready_indicators_bcn.json"),
        ("indicators", PROCESSED_DIR / "insert_ready_indicators_madrid.json"),
    ]
    success = True
    for table, path in files:
        data = load_json_data(path)
        city = get_city_from_filename(path.name)
        if not upload(table, data, city):
            success = False
    return success

def run_all_uploads():
    info("Starting full Supabase upload flow...")
    
    # Execute in correct order with validation
    if not run_district_upload():
        error("District upload failed. Aborting remaining uploads.")
        return False
        
    if not run_neighbourhood_upload():
        error("Neighbourhood upload failed. Aborting remaining uploads.")
        return False
        
    if not run_point_feature_upload():
        error("Point feature upload failed. Aborting remaining uploads.")
        return False
        
    if not run_indicator_upload():
        error("Indicator upload failed.")
        return False
        
    success("All uploads completed successfully.")
    return True

# ==================
# CLI Support
# ==================
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Upload processed files to Supabase.")
    parser.add_argument("--only", type=str, choices=["districts", "neighbourhoods", "points", "indicators", "all"], default="all")

    args = parser.parse_args()
    task = args.only

    if task == "districts":
        run_district_upload()
    elif task == "neighbourhoods":
        run_neighbourhood_upload()
    elif task == "points":
        run_point_feature_upload()
    elif task == "indicators":
        run_indicator_upload()
    else:
        run_all_uploads()

