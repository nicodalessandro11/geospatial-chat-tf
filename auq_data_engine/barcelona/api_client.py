# auq_data_engine/barcelona/api_client.py

"""
Script: Barcelona Open Data API Client

This script provides functionality to interact with Barcelona's Open Data API (CKAN).
It handles data retrieval from various endpoints, supporting both CSV and JSON formats.

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2024-04-17
Version: 1.0.0
License: MIT License
"""

import requests
import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from shared.common_lib.emoji_logger import info, success, warning, error, debug

# ============================
# Configuration & Constants
# ============================

BASE_URL = "https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search"
DEFAULT_LIMIT = 1000

# ===================
# API Functions
# ===================

def fetch_resource_data(resource_id: str, output_format: str = "json") -> Union[List[Dict], pd.DataFrame]:
    """
    Fetch data from Barcelona's Open Data API using pagination.
    
    Args:
        resource_id: The ID of the resource to fetch
        output_format: The desired output format ('json' or 'csv')
        
    Returns:
        Union[List[Dict], pd.DataFrame]: The fetched data in the requested format
    """
    info(f"Fetching data for resource ID: {resource_id}")
    
    limit = DEFAULT_LIMIT
    offset = 0
    all_records = []
    
    while True:
        try:
            params = {
                "resource_id": resource_id,
                "limit": limit,
                "offset": offset
            }
            
            response = requests.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            records = data["result"]["records"]
            if not records:
                break
                
            all_records.extend(records)
            offset += limit
            
            info(f"Fetched {len(records)} records (total: {len(all_records)})")
            
        except requests.exceptions.RequestException as e:
            error(f"Failed to fetch data: {str(e)}")
            return [] if output_format == "json" else pd.DataFrame()
        except json.JSONDecodeError as e:
            error(f"Failed to parse JSON response: {str(e)}")
            return [] if output_format == "json" else pd.DataFrame()
    
    if output_format == "csv":
        return pd.DataFrame(all_records)
    return all_records

def save_data(data: Union[List[Dict], pd.DataFrame], output_path: Path, output_format: str = "json") -> None:
    """
    Save the fetched data to a file.
    
    Args:
        data: The data to save
        output_path: Path where to save the file
        output_format: The format to save the data in ('json' or 'csv')
    """
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if output_format == "csv" and isinstance(data, pd.DataFrame):
            data.to_csv(output_path, index=False, encoding="utf-8")
        else:
            with output_path.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
        success(f"Data saved to {output_path}")
        
    except Exception as e:
        error(f"Failed to save data: {str(e)}")

def run(resource_id: str, output_path: Path, output_format: str = "json") -> None:
    """
    Main execution function to fetch and save data from Barcelona's Open Data API.
    
    Args:
        resource_id: The ID of the resource to fetch
        output_path: Path where to save the output file
        output_format: The desired output format ('json' or 'csv')
    """
    info(f"Starting data fetch for resource ID: {resource_id}")
    
    data = fetch_resource_data(resource_id, output_format)
    if not data:
        error("No data fetched. Exiting.")
        return
        
    save_data(data, output_path, output_format)
    
    success(f"Process completed. Total records: {len(data) if isinstance(data, list) else len(data.index)}")

# ==========================
# CLI Entry Point
# ==========================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Barcelona Open Data API Client")
    parser.add_argument("--resource_id", type=str, required=True,
                      help="The ID of the resource to fetch")
    parser.add_argument("--output_path", type=str, required=True,
                      help="Path where to save the output file")
    parser.add_argument("--format", type=str, choices=["json", "csv"], default="json",
                      help="Output format (json or csv)")
    
    args = parser.parse_args()
    run(args.resource_id, Path(args.output_path), args.format) 