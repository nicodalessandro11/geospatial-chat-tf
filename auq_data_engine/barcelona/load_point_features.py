# auq_data_engine/barcelona/load_point_features.py

"""
ETL Script: Load Point Features of Barcelona

This script performs the following tasks:
- Load point features data from Barcelona Open Data API.
- Processes each file according to its specific format and encoding
- Transforms the data into a standardized format for database insertion
- Saves the processed point features as a JSON file in the /data/processed folder

Usage:
    python load_point_features.py
    (Optional) with CLI arguments for input URLs and output file.

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2024-04-17
Version: 1.0.0
License: MIT License
"""

import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import urllib.parse
import time

from shared.common_lib.emoji_logger import info, success, warning, error, debug


# ============================
# Configuration & Constants
# ============================

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Constants
CITY_ID = 1  # Barcelona city ID

# Geographical level IDs
GEO_LEVELS = {
    "City": 1,
    "District": 2,
    "Neighbourhood": 3
}

# Default output filename
OUTPUT_FILENAME = "insert_ready_point_features_bcn.json"
BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME

# Feature definitions mapping from API filters to database feature definitions
FEATURE_MAPPING = {
    "Àrees de jocs infantils": "Playgrounds",
    "Auditoris": "Auditoriums",
    "Bancs del Temps": "Time Banks",
    "Bars i pubs musicals": "Musical bars and pubs",
    "Biblioteques": "Libraries",
    "Biblioteques municipals": "Libraries",
    "Cinemes": "Cinemas",
    "Cocteleries": "Cocktail bars",
    "Discoteques": "Nightclubs",
    "Instal·lacions esportives": "Sports facilities",
    "Karaokes": "Karaokes",
    "Museus": "Museums",
    "Museus municipals": "Municipal museums",
    "Natació": "Swimming",
    "Parcs i jardins": "Parks and gardens",
    "Restaurants": "Restaurants",
    "Teatres": "Theaters",
    "Universitats": "Universities",
    "Zoo": "Zoo"
}

# ==================
# Database Functions
# ==================

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

def load_feature_definitions(supabase: Client) -> Dict[str, int]:
    """Load feature definitions from the database."""
    try:
        # Query feature definitions from Supabase
        response = supabase.table("feature_definitions").select("id, name").execute()
        
        if not response.data:
            error("No feature definitions found in database")
            return {}
            
        # Convert to dictionary with name as key and id as value
        feature_defs = {row['name']: row['id'] for row in response.data}
        
        info(f"Loaded {len(feature_defs)} feature definitions from database")
        return feature_defs
    except Exception as e:
        error(f"Failed to load feature definitions from database: {str(e)}")
        return {}

# ===================
# API Functions
# ===================

def generate_url(resource_id: str) -> str:
    """
    Generate the URL for Barcelona Open Data API based on resource ID and filters.
    
    Args:
        resource_id (str): The resource ID from the API manifest
        
    Returns:
        str: The complete API URL with filters
    """
    base_url = "https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search_sql?"
    
    # Define all filters from the API
    filters = [
        "Àrees de jocs infantils",
        "Auditoris",
        "Bancs del Temps",
        "Bars i pubs musicals",
        "Biblioteques",
        "Biblioteques municipals",
        "Cinemes",
        "Cocteleries",
        "Discoteques",
        "Instal·lacions esportives",
        "Karaokes",
        "Museus",
        "Museus municipals",
        "Natació",
        "Parcs i jardins",
        "Restaurants",
        "Teatres",
        "Universitats",
        "Zoo"
    ]
    
    # Convert filters to SQL format and escape single quotes
    filters_sql = ", ".join(f"'{filter.replace(chr(39), chr(39)+chr(39))}'" for filter in filters)
    sql = f'SELECT * FROM "{resource_id}" WHERE "secondary_filters_name" IN ({filters_sql})'
    
    # Encode the SQL query
    query_string = urllib.parse.urlencode({"sql": sql})
    return base_url + query_string

def fetch_data(url: str, max_retries: int = 3, timeout: int = 30) -> Optional[Dict]:
    """
    Fetch data from Barcelona Open Data API with retry mechanism and timeout.
    
    Args:
        url (str): The API URL to fetch data from
        max_retries (int): Maximum number of retry attempts
        timeout (int): Request timeout in seconds
        
    Returns:
        Optional[Dict]: The fetched data or None if there was an error
    """
    retry_delay = 1  # Initial delay in seconds
    
    for attempt in range(max_retries):
        try:
            debug(f"Fetching data from Barcelona API (attempt {attempt + 1}/{max_retries})")
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            
            data = response.json()
            if not data:
                warning("Empty response from API")
                continue
                
            if 'result' not in data:
                warning("Invalid response format: missing 'result' key")
                continue
                
            if 'records' not in data['result']:
                warning("Invalid response format: missing 'records' key")
                continue
                
            info(f"Successfully fetched {len(data['result']['records'])} records")
            return data
            
        except requests.exceptions.Timeout:
            warning(f"Request timed out after {timeout} seconds")
        except requests.exceptions.ConnectionError:
            warning("Connection error occurred")
        except requests.exceptions.HTTPError as e:
            warning(f"HTTP error occurred: {str(e)}")
        except json.JSONDecodeError:
            warning("Failed to parse JSON response")
        except Exception as e:
            warning(f"Unexpected error: {str(e)}")
            
        if attempt < max_retries - 1:
            retry_delay *= 2  # Exponential backoff
            debug(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    error(f"Failed to fetch data after {max_retries} attempts")
    return None

# ===================
# File Processors
# ===================

def process_records(data: Dict, feature_defs: Dict[str, int], supabase: Client) -> List[Dict]:
    """
    Process records from the API response and transform them into the required format.
    
    Args:
        data: Dictionary containing the API response data
        feature_defs: Dictionary mapping feature names to their IDs
        supabase: Supabase client instance
        
    Returns:
        List of processed records ready for database insertion
    """
    processed_records = []
    
    try:
        # Get the records from the response
        records = data.get('result', {}).get('records', [])
        if not records:
            warning("No records found in API response")
            return processed_records
            
        info(f"Processing {len(records)} records from API response")
        
        # Process each record
        for record in records:
            try:
                # Extract required fields
                name = record.get('name', '')
                if not name:
                    warning("Skipping record with missing name")
                    continue
                    
                # Get coordinates directly from record
                lon = record.get('geo_epgs_4326_lon')
                lat = record.get('geo_epgs_4326_lat')
                if not lon or not lat:
                    warning(f"Skipping record with missing coordinates: {name}")
                    continue
                
                # Convert coordinates to float
                try:
                    lon = float(lon)
                    lat = float(lat)
                except (ValueError, TypeError):
                    warning(f"Invalid coordinate format: lon={lon}, lat={lat}")
                    continue
                    
                # Get address information
                road_name = record.get('addresses_road_name', '')
                street_number = record.get('addresses_start_street_number', '')
                zip_code = record.get('addresses_zip_code', '')
                
                # Get phone number if available
                phone = None
                if record.get('values_category') == 'Telèfons':
                    phone = record.get('values_value')
                
                # Get feature definition ID
                feature_type = record.get('secondary_filters_name')
                if not feature_type:
                    warning(f"Missing feature type for: {name}")
                    continue
                    
                # Map the feature type to the database feature definition
                mapped_feature = FEATURE_MAPPING.get(feature_type)
                if not mapped_feature:
                    warning(f"No feature mapping found for: {feature_type}")
                    continue
                    
                feature_def_id = feature_defs.get(mapped_feature)
                if not feature_def_id:
                    warning(f"No feature definition found for type: {mapped_feature}")
                    continue
                
                # Get neighbourhood ID
                neighbourhood_id = record.get('addresses_neighborhood_id')
                if not neighbourhood_id:
                    warning(f"Record '{name}' is missing neighbourhood_id in the API response")
                    continue
                
                # Create the point feature record
                point_feature = {
                    "name": name,
                    "latitude": lat,
                    "longitude": lon,
                    "geom": f"POINT({lon} {lat})",
                    "properties": {
                        "address_road_name": road_name,
                        "address_street_number": street_number,
                        "address_zip_code": zip_code,
                        "phone": phone,
                        "district": record.get('addresses_district_name', ''),
                        "neighbourhood": record.get('addresses_neighborhood_name', '')
                    },
                    "city_id": CITY_ID,
                    "geo_level_id": GEO_LEVELS["Neighbourhood"],
                    "feature_definition_id": feature_def_id,
                    "geo_id": int(neighbourhood_id)
                }
                
                processed_records.append(point_feature)
                
            except Exception as e:
                warning(f"Error processing record: {str(e)}")
                continue
                
        info(f"Successfully processed {len(processed_records)} records")
        return processed_records
        
    except Exception as e:
        error(f"Error processing records: {str(e)}")
        return []

# ===================
# Core ETL Process
# ===================

def run(output_path: Path = DEFAULT_OUTPUT_PATH, manifest_path: Path = None) -> None:
    """
    Main execution logic to fetch, process, and store point feature data.
    
    Args:
        output_path: Path where to save the processed data
        manifest_path: Path to the api-file-manifest.json file
    """
    info(f"Starting ETL process for Barcelona point features...")
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Exiting.")
        return
    
    # Load feature definitions from database
    global FEATURE_DEFINITIONS
    FEATURE_DEFINITIONS = load_feature_definitions(supabase)
    
    # Process all features
    all_processed_data = []
    
    try:
        # Load the resource ID from the api-file-manifest.json file
        if manifest_path is None:
            manifest_path = BASE_DIR / "data/api-file-manifest.json"
            
        debug(f"Using manifest file at: {manifest_path}")
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            resource_id = manifest['barcelona']['point_features']['resource_id']
            debug(f"Found resource_id: {resource_id}")
        
        # Generate URL for all features using the resource_id from the manifest
        url = generate_url(resource_id)
        debug(f"Generated URL: {url}")
        
        # Fetch and process data
        data = fetch_data(url)
        if data:
            processed_data = process_records(data, FEATURE_DEFINITIONS, supabase)
            all_processed_data.extend(processed_data)
        else:
            error("Failed to fetch data")
            
    except Exception as e:
        error(f"Error processing data: {str(e)}")
    
    # Save the processed data
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(all_processed_data, f, ensure_ascii=False, indent=2)
    
    # Summary log
    info(f"Total point features processed: {len(all_processed_data)}")
    success(f"Output saved to: {output_path}")

# ==========================
# CLI Entry Point
# ==========================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ETL script for loading Barcelona point features.")
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH), 
                      help="Path where to save the processed data.")
    
    args = parser.parse_args()
    run(output_path=Path(args.output_path))