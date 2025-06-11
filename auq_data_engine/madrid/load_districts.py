# auq_data_engine/madrid/load_districts.py

"""
ETL Script: Load Districts of Madrid

- Downloads GeoJSON data from Supabase
- Extracts district name, code, and geometry
- Transforms and validates the data
- Outputs a JSON file ready for Supabase/PostGIS

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import requests
import geopandas as gpd
from shapely.wkt import dumps
from pathlib import Path
from tempfile import NamedTemporaryFile
from shared.common_lib.emoji_logger import info, success, warning, error

# =====================
# Configuration
# =====================

BASE_DIR = Path(__file__).resolve().parents[1]
CITY_ID = 2  # Madrid
INPUT_URL = "https://xwzmngtodqmipubwnceh.supabase.co/storage/v1/object/public/data/madrid/madrid-districts.json"
OUTPUT_FILENAME = "insert_ready_districts_madrid.json"
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME


# =====================
# Main ETL Function
# =====================

def run(input_url: str = INPUT_URL, output_path: Path = DEFAULT_OUTPUT_PATH, city_id: int = CITY_ID) -> None:
    """
    Main ETL function to process Madrid district data.

    Args:
        input_url (str): URL to fetch raw GeoJSON.
        output_path (Path): Path to write processed output JSON.
        city_id (int): City ID to assign (Madrid = 2).
    """
    info("Starting ETL process for Madrid districts...")
    info(f"Fetching GeoJSON data from: {input_url}")

    try:
        response = requests.get(input_url)
        response.raise_for_status()
    except Exception as e:
        error(f"Failed to download data: {e}")
        return

    with NamedTemporaryFile(suffix=".json") as tmp_file:
        tmp_file.write(response.content)
        tmp_file.flush()
        gdf = gpd.read_file(tmp_file.name)

    prepared_data = []
    skipped = 0

    for _, row in gdf.iterrows():
        props = row.get("properties", row)

        raw_name = props.get("NOMBRE", props.get("name", "")).strip()
        raw_code = props.get("COD_DIS_TX", "").strip()

        if not raw_code:
            warning(f"District '{raw_name}' has empty code. Skipping.")
            skipped += 1
            continue

        name = raw_name

        try:
            code = int(raw_code)
        except ValueError:
            warning(f"Invalid district code '{raw_code}' in '{name}'. Skipping.")
            skipped += 1
            continue

        try:
            geom_wkt = dumps(row.geometry)
        except Exception as e:
            warning(f"Error in district '{name}': {e}")
            skipped += 1
            continue

        prepared_data.append({
            "name": name,
            "district_code": code,
            "city_id": city_id,
            "geom": f"SRID=4326;{geom_wkt}"
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(prepared_data, f, ensure_ascii=False, indent=2)

    # Summary
    info(f"Total districts in input: {len(gdf)}")
    success(f"Processed: {len(prepared_data)} districts")
    if skipped > 0:
        warning(f"Skipped: {skipped} invalid entries")
    success(f"Output saved to: {output_path}")


# =====================
# CLI Support
# =====================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ETL script for loading Madrid districts.")
    parser.add_argument("--input_url", type=str, default=INPUT_URL, help="URL of the GeoJSON file.")
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH), help="Output file path.")
    parser.add_argument("--city_id", type=int, default=CITY_ID, help="City ID to assign to each record.")

    args = parser.parse_args()
    run(
        input_url=args.input_url,
        output_path=Path(args.output_path),
        city_id=args.city_id
    )
