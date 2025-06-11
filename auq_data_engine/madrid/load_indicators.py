# auq_data_engine/madrid/load_indicators.py

"""
ETL Script: Load Madrid Indicators

- Processes indicator data from CSV files in the raw_sample directory
- Aggregates data by neighborhood
- Validates and transforms data into the required format
- Outputs a JSON file ready for Supabase/PostGIS

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import csv
import os
from pathlib import Path
import pandas as pd
from typing import Dict, List, Any, Optional
import re
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
from io import StringIO

# Load environment variables
load_dotenv()

# Configuration
BASE_DIR = Path(__file__).resolve().parent.parent
MANIFEST_PATH = BASE_DIR / "data/api-file-manifest.json"
OUTPUT_FILENAME = "insert_ready_indicators_madrid.json"
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Constants
CITY_ID = 2  # Madrid city ID

# Indicator mapping from files to database names
INDICATOR_MAPPING = {
    "population": "Population",
    "surface": "Surface"
}

# Column indices in Madrid CSV files (0-based)
MADRID_COLUMNS = {
    "neighborhood_code": 5,  # cod_barrio
    "neighborhood_name": 6,  # barrio
    "district_code": 3,     # cod_distrito
    "district_name": 4,     # distrito
    "year": 7,             # año
    "period_panel": 1,     # Periodo panel
    "value": 17            # valor_indicador
}

# Aggregation methods for each indicator type
AGGREGATION_METHODS = {
    "population": "sum",
    "surface": "sum"
}

# Import emoji logger
from common_lib.emoji_logger import info, success, warning, error

def get_supabase_client() -> Client:
    """Initialize and return a Supabase client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        error("Supabase credentials not found in environment variables")
        return None
    
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        error(f"Failed to initialize Supabase client: {str(e)}")
        return None

def get_indicator_def_ids(supabase: Client) -> Dict[str, int]:
    """
    Query Supabase for indicator definition IDs based on names
    
    Args:
        supabase: Supabase client
        
    Returns:
        Dictionary mapping indicator names to their IDs
    """
    indicator_ids = {}
    
    try:
        # Query indicator definitions
        response = supabase.table("indicator_definitions").select("id, name").execute()
        
        if response.data:
            for item in response.data:
                indicator_ids[item["name"]] = item["id"]
                
        info(f"Retrieved {len(indicator_ids)} indicator definition IDs from Supabase")
    except Exception as e:
        error(f"Failed to query indicator definitions: {str(e)}")
        
    return indicator_ids

def get_neighborhood_ids(supabase: Client) -> Dict[str, int]:
    """
    Query Supabase for neighborhood IDs based on codes
    
    Args:
        supabase: Supabase client
        
    Returns:
        Dictionary mapping composite keys (city_id|neighborhood_code) to their IDs
    """
    neighborhood_ids = {}
    
    try:
        # First, get a sample row to inspect available columns
        response = supabase.table("neighbourhoods").select("*").limit(1).execute()
        if not response.data:
            error("No neighborhoods found in database")
            return neighborhood_ids
            
        # Log available columns for debugging
        sample_row = response.data[0]
        info(f"Available columns in neighbourhoods table: {', '.join(sample_row.keys())}")
        
        # Find the code column - it might be named differently
        code_column = next((col for col in sample_row.keys() if 'code' in col.lower()), None)
        if not code_column:
            warning("Could not find code column in neighbourhoods table")
            return neighborhood_ids
            
        info(f"Using column '{code_column}' for neighborhood codes")
        
        # Query all neighborhoods
        response = supabase.table("neighbourhoods").select(f"id, {code_column}, city_id").execute()
        
        if response.data:
            for item in response.data:
                if item.get(code_column):  # Only add if code exists
                    # Create composite key: city_id|neighborhood_code
                    composite_key = f"{item['city_id']}|{int(item[code_column])}"
                    neighborhood_ids[composite_key] = item["id"]
                
        info(f"Retrieved {len(neighborhood_ids)} neighborhood IDs from Supabase")
    except Exception as e:
        error(f"Failed to query neighborhoods: {str(e)}")
        
    return neighborhood_ids

def download_csv_from_url(url: str) -> pd.DataFrame:
    """
    Download CSV file from URL and return as DataFrame
    
    Args:
        url: URL of the CSV file
        
    Returns:
        DataFrame containing the CSV data
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        # Read CSV with header=None to use numeric indices
        df = pd.read_csv(StringIO(response.text), sep=';', header=None)
        # Skip the header row
        df = df.iloc[1:]
        return df
    except Exception as e:
        error(f"Failed to download CSV from {url}: {str(e)}")
        return pd.DataFrame()

def diagnose_neighborhood_codes(supabase: Client) -> None:
    """
    Diagnostic function to check neighborhood codes in Supabase for Madrid
    
    Args:
        supabase: Supabase client
    """
    info("Running neighborhood code diagnosis for Madrid...")
    
    try:
        # Query all Madrid neighborhoods
        response = supabase.table("neighbourhoods") \
            .select("id, neighbourhood_code, city_id, name") \
            .eq("city_id", CITY_ID) \
            .execute()
            
        if not response.data:
            error("No neighborhoods found for Madrid")
            return
            
        # Sort by code for easier comparison
        neighborhoods = sorted(response.data, key=lambda r: r['neighbourhood_code'])
        
        info(f"Found {len(neighborhoods)} neighborhoods in Supabase for Madrid")
        info("First 5 neighborhoods:")
        for n in neighborhoods[:5]:
            info(f"Code: {n['neighbourhood_code']} -> ID: {n['id']} -> Name: {n['name']}")
            
        info("Last 5 neighborhoods:")
        for n in neighborhoods[-5:]:
            info(f"Code: {n['neighbourhood_code']} -> ID: {n['id']} -> Name: {n['name']}")
            
    except Exception as e:
        error(f"Failed to run diagnosis: {str(e)}")

def process_indicator_file(url: str, indicator_name: str, indicator_def_ids: Dict[str, int], neighborhood_ids: Dict[str, int]) -> List[Dict[str, Any]]:
    """
    Process a single indicator CSV file and return a list of indicator records
    
    Args:
        url: URL of the CSV file
        indicator_name: Name of the indicator (used to map to indicator_def_id)
        indicator_def_ids: Dictionary mapping indicator names to their IDs
        neighborhood_ids: Dictionary mapping composite keys (city_id|neighborhood_code) to their IDs
        
    Returns:
        List of indicator records
    """
    results = []
    missing_geo_ids = 0
    total_rows = 0
    
    try:
        # Download and read CSV file
        df = download_csv_from_url(url)
        
        if df.empty:
            warning(f"Failed to download or empty file: {url}")
            return results
        
        # Get indicator definition ID
        db_indicator_name = INDICATOR_MAPPING.get(indicator_name)
        indicator_def_id = indicator_def_ids.get(db_indicator_name)
        
        if not indicator_def_id:
            warning(f"No indicator definition ID found for: {db_indicator_name}")
            return results
        
        # Get unique period panels (these represent the years we want)
        period_panels = df[MADRID_COLUMNS['period_panel']].unique()
        info(f"Found {len(period_panels)} period panels in file: {period_panels}")
        
        # Process each period panel (year)
        for period_panel in period_panels:
            # Skip header row if present
            if period_panel == "Periodo panel":
                continue
                
            # Filter data for this period panel
            panel_df = df[df[MADRID_COLUMNS['period_panel']] == period_panel]
            
            # Process each row for this period panel
            for _, row in panel_df.iterrows():
                try:
                    total_rows += 1
                    
                    # Extract and clean neighborhood code
                    raw_code = str(row[MADRID_COLUMNS['neighborhood_code']]).strip()
                    try:
                        # Handle potential float values and convert to int
                        neighborhood_code = str(int(float(raw_code)))
                    except (ValueError, TypeError):
                        warning(f"Invalid neighborhood code format: {raw_code}")
                        missing_geo_ids += 1
                        continue
                        
                    value_str = str(row[MADRID_COLUMNS['value']]).strip()
                    
                    # Handle value conversion
                    try:
                        # Replace comma with dot for decimal values
                        value_str = value_str.replace(',', '.')
                        value = float(value_str)
                    except (ValueError, TypeError):
                        warning(f"Invalid value format in row: {value_str}")
                        continue
                    
                    if not neighborhood_code or pd.isna(neighborhood_code):
                        warning(f"Missing neighborhood code in row")
                        missing_geo_ids += 1
                        continue
                        
                    # Get neighborhood ID using composite key
                    composite_key = f"{CITY_ID}|{neighborhood_code}"
                    geo_id = neighborhood_ids.get(composite_key)
                    
                    if not geo_id:
                        warning(f"No neighborhood ID found for composite key: {composite_key}")
                        missing_geo_ids += 1
                        continue
                        
                    # Create indicator record using period_panel as the year
                    indicator = {
                        "indicator_def_id": indicator_def_id,
                        "geo_level_id": 3,  # Always 3 for neighborhood
                        "geo_id": geo_id,
                        "city_id": CITY_ID,
                        "year": int(period_panel),  # Use period_panel as the year
                        "value": value
                    }
                    
                    results.append(indicator)
                except (IndexError, ValueError) as e:
                    warning(f"Error processing row: {str(e)}")
                    missing_geo_ids += 1
                    continue
            
            # Log the number of records for this period panel
            records_count = len([r for r in results if r['year'] == int(period_panel) and r['indicator_def_id'] == indicator_def_id])
            info(f"Processed {records_count} records for {indicator_name} in period panel {period_panel}")
            
        # Log summary of missing geo_ids
        if missing_geo_ids > 0:
            warning(f"Total rows processed: {total_rows}")
            warning(f"Rows with missing geo_ids: {missing_geo_ids} ({(missing_geo_ids/total_rows)*100:.1f}%)")
            
    except Exception as e:
        error(f"Error processing file {url}: {str(e)}")
        
    return results

def run(manifest_path: Path = MANIFEST_PATH, output_path: Path = DEFAULT_OUTPUT_PATH) -> None:
    """
    Run the ETL process for Madrid indicators
    
    Args:
        manifest_path: Path to the files manifest JSON
        output_path: Path to save the processed JSON file
    """
    info("Starting Madrid indicators ETL process")
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Exiting.")
        return
    
    # Run diagnosis first
    diagnose_neighborhood_codes(supabase)
    
    # Get indicator definition IDs and neighborhood IDs
    indicator_def_ids = get_indicator_def_ids(supabase)
    neighborhood_ids = get_neighborhood_ids(supabase)
    
    if not indicator_def_ids or not neighborhood_ids:
        error("Failed to retrieve necessary IDs from Supabase. Exiting.")
        return
    
    # Load manifest file
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
    except Exception as e:
        error(f"Failed to load manifest file: {str(e)}")
        return
    
    all_indicators = []
    
    # Process each indicator type from manifest
    for indicator_name in INDICATOR_MAPPING.keys():
        if indicator_name not in manifest['madrid']['indicators']['raw_file']:
            warning(f"No URL found for indicator: {indicator_name}")
            continue
            
        info(f"Processing indicator: {indicator_name}")
        
        url = manifest['madrid']['indicators']['raw_file'][indicator_name]
        if not url:
            warning(f"No URL found for {indicator_name}")
            continue
            
        info(f"Processing file: {url}")
        indicators = process_indicator_file(url, indicator_name, indicator_def_ids, neighborhood_ids)
        all_indicators.extend(indicators)
    
    # Save results
    if all_indicators:
        info(f"Saving {len(all_indicators)} indicator records to {output_path}")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write to JSON file
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(all_indicators, f, ensure_ascii=False, indent=2)
            
        success(f"Successfully saved indicators to {output_path}")
    else:
        warning("No indicator records were processed")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ETL script for loading Madrid indicators")
    parser.add_argument("--manifest_path", type=str, default=str(MANIFEST_PATH))
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH))
    
    args = parser.parse_args()
    run(manifest_path=Path(args.manifest_path), output_path=Path(args.output_path))