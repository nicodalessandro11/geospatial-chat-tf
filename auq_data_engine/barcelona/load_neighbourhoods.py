# auq_data_engine/barcelona/load_neighbourhoods.py

"""
ETL Script: Load Neighbourhoods of Barcelona

This script performs the following tasks:
- Downloads neighbourhood data from Supabase public storage.
- Fetches the district mapping from Supabase DB to link each neighbourhood to a district_id.
- Validates and transforms the raw data.
- Outputs a clean JSON file ready for Supabase insertion.

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import requests
from shapely import wkt
from pathlib import Path
from typing import Dict
from dotenv import load_dotenv
import os
from supabase import create_client, Client
from shared.common_lib.emoji_logger import info, success, warning, error

# =====================
# Configuration
# =====================

BASE_DIR = Path(__file__).resolve().parents[1]
CITY_ID = 1  # Barcelona
INPUT_URL = "https://xwzmngtodqmipubwnceh.supabase.co/storage/v1/object/public/data/barcelona/bcn-neighbourhoods.json"
OUTPUT_FILENAME = "insert_ready_neighbourhoods_bcn.json"
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME

# Load Supabase credentials from .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# =====================
# Helper: District Map
# =====================

def get_district_map(city_id: int) -> Dict[str, int]:
    """
    Fetch district IDs from Supabase and return a name-to-ID map.
    """
    info("Fetching district map from Supabase...")
    response = supabase.table("districts") \
        .select("id, name, city_id") \
        .eq("city_id", city_id) \
        .execute()

    if not response.data:
        raise Exception("No districts found in Supabase for city_id = 1")

    success("District map successfully retrieved.")
    return {
        d["name"].strip().lower(): d["id"]
        for d in response.data
    }


# =====================
# Main ETL Logic
# =====================

def run(
    input_url: str = INPUT_URL,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    city_id: int = CITY_ID
) -> None:
    """
    Main ETL function for loading neighbourhoods in Barcelona.

    Args:
        input_url (str): URL to fetch raw data.
        output_path (Path): Output file path.
        city_id (int): City ID to associate the neighbourhoods with.
    """
    info("Starting ETL process for Barcelona neighbourhoods...")
    info(f"Fetching data from: {input_url}")

    try:
        response = requests.get(input_url)
        response.raise_for_status()
        raw_data = response.json()
        success("Neighbourhood data successfully downloaded.")
    except Exception as e:
        error(f"Failed to download or parse input data: {e}")
        return

    try:
        district_map = get_district_map(city_id)
    except Exception as e:
        error(f"Failed to fetch district map: {e}")
        return

    prepared_data = []
    skipped_entries = []

    for b in raw_data:
        try:
            name = b["nom_barri"].strip()
            raw_code = b["codi_barri"].strip()
            district_name = b["nom_districte"].strip().lower()
            wkt_geom = b["geometria_wgs84"].strip()

            try:
                code = int(raw_code)
            except ValueError:
                warning(f"Invalid neighbourhood code '{raw_code}' in '{name}'. Skipping.")
                skipped_entries.append(name)
                continue

            district_id = district_map.get(district_name)
            if not district_id:
                warning(f"District name '{district_name}' not found in Supabase. Skipping neighbourhood '{name}'.")
                skipped_entries.append(name)
                continue

            _ = wkt.loads(wkt_geom)  # Validate geometry

            prepared_data.append({
                "name": name,
                "neighbourhood_code": code,
                "district_id": district_id,
                "city_id": city_id,
                "geom": f"SRID=4326;{wkt_geom}"
            })

        except Exception as e:
            warning(f"Error in neighbourhood '{b.get('nom_barri', 'unknown')}': {e}")
            skipped_entries.append(name)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(prepared_data, f, ensure_ascii=False, indent=2)

    # Summary
    info(f"Total neighbourhoods in input: {len(raw_data)}")
    success(f"Processed: {len(prepared_data)} neighbourhoods")
    if skipped_entries:
        warning(f"Skipped entries: {len(skipped_entries)} – {set(skipped_entries)}")
    success(f"Output saved to: {output_path}")


# =====================
# CLI Support
# =====================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ETL script for loading Barcelona neighbourhoods.")
    parser.add_argument("--input_url", type=str, default=INPUT_URL, help="Public URL of the neighbourhoods JSON file.")
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH), help="Output path for the processed JSON file.")
    parser.add_argument("--city_id", type=int, default=CITY_ID, help="Numeric ID of the city (default: 1 = Barcelona)")

    args = parser.parse_args()
    run(
        input_url=args.input_url,
        output_path=Path(args.output_path),
        city_id=args.city_id
    )

