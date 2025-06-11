# auq_data_engine/madrid/api_client.py

"""
Script: Madrid Open Data API Client

This script provides functionality to interact with Madrid's Open Data API.
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
from typing import Dict, Union, Optional
from shared.common_lib.emoji_logger import info, success, warning, error, debug

# ============================
# Configuration & Constants
# ============================

BASE_URL = "https://datos.madrid.es/egob/catalogo/"
DEFAULT_ENCODING = "utf-8"

# ===================
# API Functions
# ===================

def fetch_data(endpoint: str) -> Optional[Union[Dict, pd.DataFrame]]:
    """
    Fetch data from the Madrid Open Data API.
    
    Args:
        endpoint: The API endpoint to fetch data from
        
    Returns:
        Union[Dict, pd.DataFrame]: The fetched data in JSON or DataFrame format
    """
    try:
        url = f"{BASE_URL}{endpoint}"
        info(f"Fetching data from: {url}")
        
        response = requests.get(url)
        response.raise_for_status()
        
        # Determine format from endpoint
        if endpoint.endswith('.json'):
            return response.json()
        elif endpoint.endswith('.csv'):
            return pd.read_csv(response.content)
        else:
            error(f"Unsupported file format in endpoint: {endpoint}")
            return None
            
    except requests.exceptions.RequestException as e:
        error(f"Failed to fetch data from {endpoint}: {str(e)}")
        return None
    except Exception as e:
        error(f"Unexpected error while fetching data: {str(e)}")
        return None

def run(endpoint: str) -> Optional[Union[Dict, pd.DataFrame]]:
    """
    Main execution function to fetch data from the API.
    
    Args:
        endpoint: The API endpoint to fetch data from
        
    Returns:
        Union[Dict, pd.DataFrame]: The fetched data in JSON or DataFrame format
    """
    info(f"Starting API request for endpoint: {endpoint}")
    
    data = fetch_data(endpoint)
    if data is not None:
        success(f"Successfully fetched data from {endpoint}")
        return data
    else:
        error(f"Failed to fetch data from {endpoint}")
        return None

# ==========================
# CLI Entry Point
# ==========================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Madrid Open Data API Client")
    parser.add_argument("endpoint", type=str, help="API endpoint to fetch data from")
    
    args = parser.parse_args()
    run(args.endpoint) 