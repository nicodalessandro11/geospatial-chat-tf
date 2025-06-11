# auq_data_engine/barcelona/load_indicators.py

"""
ETL Script: Load Barcelona Indicators

- Processes indicator data from CSV files in the raw_sample directory
- Aggregates census-level data by neighborhood
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
OUTPUT_FILENAME = "insert_ready_indicators_bcn.json"
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Constants
CITY_ID = 1  # Barcelona city ID

# Indicator mapping from files to database names
INDICATOR_MAPPING = {
    "average_gross_taxable_income": "Average gross taxable income per person",
    "income_disposable": "Disposable income per capita",
    "population": "Population",
    "surface": "Surface"
}

# Value column positions for each indicator type (position of the value column in CSV files)
VALUE_COLUMNS = {
    "average_gross_taxable_income": -1,  # Last column
    "income_disposable": -1,     # Last column
    "population": -1,            # Last column
    "surface": -1                # Last column
}

# Aggregation methods for each indicator type
AGGREGATION_METHODS = {
    "average_gross_taxable_income": "mean",
    "income_disposable": "mean",
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
        # Try different encodings
        encodings = ['utf-8', 'latin1', 'iso-8859-1']
        for encoding in encodings:
            try:
                df = pd.read_csv(StringIO(response.text), encoding=encoding)
                # Check if we can read the column names properly
                if any('â' in col for col in df.columns):
                    continue
                return df
            except UnicodeDecodeError:
                continue
        # If all encodings fail, use the last one tried
        return pd.read_csv(StringIO(response.text), encoding=encodings[-1])
    except Exception as e:
        error(f"Failed to download CSV from {url}: {str(e)}")
        return pd.DataFrame()

def normalize_column_name(name: str) -> str:
    """
    Normalize column name by removing special characters and spaces
    
    Args:
        name: Column name to normalize
        
    Returns:
        Normalized column name
    """
    # Remove special characters and spaces, convert to lowercase
    return ''.join(c.lower() for c in name if c.isalnum())

def find_matching_column(df: pd.DataFrame, target_column: str) -> Optional[str]:
    """
    Find the best matching column name in the DataFrame
    
    Args:
        df: DataFrame to search in
        target_column: Column name to look for
        
    Returns:
        Best matching column name or None if no match found
    """
    # Normalize target column
    normalized_target = normalize_column_name(target_column)
    
    # Create a map of normalized names to original names
    column_map = {normalize_column_name(col): col for col in df.columns}
    
    # First try exact match
    if normalized_target in column_map:
        return column_map[normalized_target]
    
    # Then try partial match
    for norm_col, orig_col in column_map.items():
        if normalized_target in norm_col or norm_col in normalized_target:
            return orig_col
    
    return None

def aggregate_by_neighborhood(df: pd.DataFrame, indicator_name: str) -> pd.DataFrame:
    """
    Aggregate census-level data by neighborhood
    
    Args:
        df: DataFrame with census-level data
        indicator_name: Name of the indicator (used to determine aggregation method)
        
    Returns:
        DataFrame aggregated by neighborhood
    """
    # Get aggregation method and value column position
    agg_method = AGGREGATION_METHODS.get(indicator_name, "sum")
    value_column = df.columns[VALUE_COLUMNS.get(indicator_name, -1)]  # Get the last column name
    
    if not value_column:
        warning(f"No value column found for indicator: {indicator_name}")
        return pd.DataFrame()
    
    # Group by neighborhood code and name
    grouped = df.groupby(['Codi_Barri', 'Nom_Barri'])
    
    # Apply aggregation to the value column
    if agg_method == "sum":
        aggregated = grouped[value_column].sum().reset_index()
    elif agg_method == "mean":
        aggregated = grouped[value_column].mean().reset_index()
    else:
        warning(f"Unknown aggregation method: {agg_method}. Using sum.")
        aggregated = grouped[value_column].sum().reset_index()
    
    # Rename the value column to 'Valor' for consistency
    aggregated = aggregated.rename(columns={value_column: 'Valor'})
    
    info(f"Aggregated {len(df)} census records into {len(aggregated)} neighborhood records using {agg_method}")
    
    return aggregated

def process_indicator_file(url: str, year: int, indicator_name: str, indicator_def_ids: Dict[str, int], neighborhood_ids: Dict[str, int]) -> List[Dict[str, Any]]:
    """
    Process a single indicator CSV file and return a list of indicator records
    
    Args:
        url: URL of the CSV file
        year: Year of the data
        indicator_name: Name of the indicator (used to map to indicator_def_id)
        indicator_def_ids: Dictionary mapping indicator names to their IDs
        neighborhood_ids: Dictionary mapping composite keys (city_id|neighborhood_code) to their IDs
        
    Returns:
        List of indicator records
    """
    results = []
    
    try:
        # Download and read CSV file
        df = download_csv_from_url(url)
        
        if df.empty:
            warning(f"Failed to download or empty file: {url}")
            return results
        
        # Show available columns for debugging
        info(f"Available columns in file: {', '.join(df.columns)}")
        
        # Aggregate by neighborhood
        aggregated_df = aggregate_by_neighborhood(df, indicator_name)
        
        if aggregated_df.empty:
            warning(f"No data after aggregation for file: {url}")
            return results
        
        # Get indicator definition ID
        db_indicator_name = INDICATOR_MAPPING.get(indicator_name)
        indicator_def_id = indicator_def_ids.get(db_indicator_name)
        
        if not indicator_def_id:
            warning(f"No indicator definition ID found for: {db_indicator_name}")
            return results
        
        # Process each aggregated row
        for _, row in aggregated_df.iterrows():
            # Extract neighborhood code
            neighborhood_code = str(row.get('Codi_Barri'))
            
            if not neighborhood_code:
                warning(f"Missing neighborhood code in row: {row}")
                continue
                
            # Get neighborhood ID using composite key
            composite_key = f"{CITY_ID}|{int(neighborhood_code)}"
            geo_id = neighborhood_ids.get(composite_key)
            
            if not geo_id:
                warning(f"No neighborhood ID found for composite key: {composite_key}")
                continue
                
            # Create indicator record
            indicator = {
                "indicator_def_id": indicator_def_id,
                "geo_level_id": 3,  # Always 3 for neighborhood
                "geo_id": geo_id,
                "city_id": CITY_ID,
                "year": year,
                "value": float(row.get('Valor', 0))
            }
            
            results.append(indicator)
            
    except Exception as e:
        error(f"Error processing file {url}: {str(e)}")
        
    return results

def run(manifest_path: Path = MANIFEST_PATH, output_path: Path = DEFAULT_OUTPUT_PATH) -> None:
    """
    Run the ETL process for Barcelona indicators
    
    Args:
        manifest_path: Path to the files manifest JSON
        output_path: Path to save the processed JSON file
    """
    info("Starting Barcelona indicators ETL process")
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Exiting.")
        return
    
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
    for indicator_name, years in manifest['barcelona']['indicators']['raw_file'].items():
        if indicator_name not in INDICATOR_MAPPING:
            warning(f"No mapping found for indicator: {indicator_name}")
            continue
            
        info(f"Processing indicator: {indicator_name}")
        
        # Process each year file
        for year, data in years.items():
            url = data['raw_file']
            if not url:
                warning(f"No URL found for {indicator_name} year {year}")
                continue
                
            info(f"Processing file for year {year}: {url}")
            indicators = process_indicator_file(url, int(year), indicator_name, indicator_def_ids, neighborhood_ids)
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
    
    parser = argparse.ArgumentParser(description="ETL script for loading Barcelona indicators")
    parser.add_argument("--manifest_path", type=str, default=str(MANIFEST_PATH))
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH))
    
    args = parser.parse_args()
    run(manifest_path=Path(args.manifest_path), output_path=Path(args.output_path))