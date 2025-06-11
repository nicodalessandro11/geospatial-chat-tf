# auq_data_engine/barcelona/load_districts.py

"""
ETL Script: Load Districts of Barcelona

This script performs the following tasks:
- Downloads district data from a public Supabase URL in JSON format.
- Extracts and validates district names, codes, and geometries (in WKT format).
- Transforms the data into a format compatible with Supabase/PostGIS.
- Saves the processed districts as a JSON file in the /data/processed folder.

Usage:
    python load_districts.py
    (Optional) with CLI arguments for input URL and output file.

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
from typing import Optional

from common_lib.emoji_logger import info, success, warning, error


# ============================
# 🔧 Configuration & Constants
# ============================

INPUT_URL = "https://xwzmngtodqmipubwnceh.supabase.co/storage/v1/object/public/data/barcelona/bcn-districts.json"
OUTPUT_FILENAME = "insert_ready_districts_bcn.json"
CITY_ID = 1  # Barcelona
BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME


# ===================
# Core ETL Process
# ===================

def run(
    input_url: str = INPUT_URL,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    city_id: int = CITY_ID
) -> None:
    """
    Main execution logic to fetch, process, and store district data.

    Args:
        input_url (str): Public URL pointing to the input JSON file.
        output_path (Path): Output file path to save the processed data.
        city_id (int): ID to associate districts with the correct city.
    """
    info(f"Starting ETL process for Barcelona districts...")
    info(f"Fetching data from: {input_url}")

    try:
        response = requests.get(input_url)
        response.raise_for_status()
        raw_data = response.json()
        success(f"Successfully downloaded district data.")
    except Exception as e:
        error(f"Failed to fetch input data: {e}")
        return

    prepared_data = []
    skipped_count = 0

    for d in raw_data:
        try:
            name = d["nom_districte"].strip()
            code = d["Codi_Districte"].strip()
            wkt_geom = d["geometria_wgs84"].strip()

            try:
                code = int(code)
            except ValueError:
                warning(f"Invalid district code '{code}' in '{name}'. Skipping.")
                skipped_count += 1
                continue

            _ = wkt.loads(wkt_geom)  # Validate geometry

            prepared_data.append({
                "name": name,
                "district_code": code,
                "city_id": city_id,
                "geom": f"SRID=4326;{wkt_geom}"
            })

        except Exception as e:
            warning(f"Skipped district '{d.get('nom_districte', 'unknown')}': {e}")
            skipped_count += 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(prepared_data, f, ensure_ascii=False, indent=2)

    # ===============
    # Summary Log
    # ===============
    info(f"Total districts in input: {len(raw_data)}")
    success(f"Processed and saved: {len(prepared_data)} districts")
    if skipped_count > 0:
        warning(f"Skipped entries: {skipped_count}")
    success(f"Output saved to: {output_path}")


# ==========================
# CLI Entry Point
# ==========================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ETL script for loading Barcelona districts.")
    parser.add_argument("--input_url", type=str, default=INPUT_URL, help="Public URL of the districts JSON file.")
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH), help="Output path for the processed JSON file.")
    parser.add_argument("--city_id", type=int, default=CITY_ID, help="Numeric ID of the city (default: 1 = Barcelona)")

    args = parser.parse_args()
    run(
        input_url=args.input_url,
        output_path=Path(args.output_path),
        city_id=args.city_id
    )
