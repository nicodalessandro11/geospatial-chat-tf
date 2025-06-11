# auq_data_engine/madrid/load_neighbourhoods.py

"""
ETL Script: Load Neighbourhoods of Madrid

- Downloads GeoJSON data from Supabase public storage
- Links neighbourhoods to their district_id via Supabase lookup
- Validates geometry and codes
- Outputs a clean JSON file for PostGIS import

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import os
import requests
import geopandas as gpd
from shapely.wkt import dumps
from pathlib import Path
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
from supabase import create_client, Client
from shared.common_lib.emoji_logger import info, success, warning, error

# =====================
# Configuration
# =====================

BASE_DIR = Path(__file__).resolve().parents[1]
CITY_ID = 2  # Madrid
INPUT_URL = "https://xwzmngtodqmipubwnceh.supabase.co/storage/v1/object/public/data/madrid/madrid-neighbourhoods.json"
OUTPUT_FILENAME = "insert_ready_neighbourhoods_madrid.json"
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME

# Supabase setup
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==========================
# Fetch District Mapping
# ==========================

def get_district_map(city_id: int) -> dict:
    """
    Fetch district_code → district_id mapping from Supabase for given city.
    """
    info("Fetching district mapping from Supabase...")
    response = supabase.table("districts") \
        .select("id, district_code, city_id") \
        .eq("city_id", city_id) \
        .execute()

    if not response.data:
        raise Exception(f"No districts found in Supabase for city_id = {city_id}")

    success("District map retrieved.")
    return {
        int(d["district_code"]): d["id"]
        for d in response.data
    }


# =====================
# Main ETL Function
# =====================

def run(input_url: str = INPUT_URL, output_path: Path = DEFAULT_OUTPUT_PATH, city_id: int = CITY_ID) -> None:
    """
    ETL function to download, process, and save neighbourhoods of Madrid.

    Args:
        input_url (str): URL to fetch GeoJSON data.
        output_path (Path): Output path for processed JSON file.
        city_id (int): Numeric city ID (Madrid = 2).
    """
    info("Starting ETL process for Madrid neighbourhoods...")
    info(f"Downloading neighbourhoods from: {input_url}")

    try:
        response = requests.get(input_url)
        response.raise_for_status()
    except Exception as e:
        error(f"Failed to fetch neighbourhoods JSON: {e}")
        return

    with NamedTemporaryFile(suffix=".json") as tmp_file:
        tmp_file.write(response.content)
        tmp_file.flush()
        gdf = gpd.read_file(tmp_file.name)

    try:
        district_map = get_district_map(city_id)
    except Exception as e:
        error(f"Error fetching district map: {e}")
        return

    prepared_data = []
    skipped = []

    for _, row in gdf.iterrows():
        props = row.get("properties", row)

        name = props.get("NOMBRE", "Unnamed").strip()
        raw_code = props.get("COD_BAR", "").strip()
        raw_district_code = props.get("COD_DIS_TX", "").strip()

        if not raw_code or not raw_district_code:
            warning(f"Missing codes in '{name}'. Skipping.")
            skipped.append(name)
            continue

        try:
            code = int(raw_code)
            district_code = int(raw_district_code)
        except ValueError:
            warning(f"Invalid code in '{name}': '{raw_code}' or '{raw_district_code}' not int-convertible.")
            skipped.append(name)
            continue

        district_id = district_map.get(district_code)
        if not district_id:
            warning(f"District code '{district_code}' not found for neighbourhood '{name}'. Skipping.")
            skipped.append(name)
            continue

        try:
            geom_wkt = dumps(row.geometry)
        except Exception as e:
            warning(f"Geometry error in '{name}': {e}")
            skipped.append(name)
            continue

        prepared_data.append({
            "name": name,
            "neighbourhood_code": code,
            "district_id": district_id,
            "city_id": city_id,
            "geom": f"SRID=4326;{geom_wkt}"
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(prepared_data, f, ensure_ascii=False, indent=2)

    # Summary
    info(f"Total neighbourhoods in input: {len(gdf)}")
    success(f"Processed: {len(prepared_data)} entries")
    if skipped:
        warning(f"Skipped: {len(skipped)} entries → {set(skipped)}")
    success(f"Output saved to: {output_path}")


# =====================
# CLI Support
# =====================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ETL script for loading Madrid neighbourhoods.")
    parser.add_argument("--input_url", type=str, default=INPUT_URL, help="URL of the raw GeoJSON.")
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH), help="Path to output file.")
    parser.add_argument("--city_id", type=int, default=CITY_ID, help="City ID to assign to each record.")

    args = parser.parse_args()
    run(
        input_url=args.input_url,
        output_path=Path(args.output_path),
        city_id=args.city_id
    )
