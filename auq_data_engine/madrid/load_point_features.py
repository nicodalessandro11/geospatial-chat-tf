# auq_data_engine/madrid/load_point_features.py

"""
ETL Script: Load Point Features of Madrid

This script performs the following tasks:
- Loads point feature data from Madrid's Open Data API
- Processes each file according to its specific format
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

from shared.common_lib.emoji_logger import info, success, warning, error, debug
from .api_client import run as fetch_madrid_data

# ============================
# Configuration & Constants
# ============================

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Constants
CITY_ID = 2  # Madrid city ID

# Geographical level IDs
GEO_LEVELS = {
    "City": 1,
    "District": 2,
    "Neighbourhood": 3
}

# Default output filename
OUTPUT_FILENAME = "insert_ready_point_features_madrid.json"
BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME

# Feature definitions mapping from API filters to database feature definitions
CODE_MAPPING = {
    "Gaztambide": 71,
    "Arapiles": 72,
    "Trafalgar": 73,
    "Delicias": 25,
    "FuenteBerro": 43,
    "Palacio": 11,
    "Embajadores": 12,
    "Cortes": 13,
    "Justicia": 14,
    "Universidad": 15,
    "Sol": 16,
    "Imperial": 21,
    "Acacias": 22,
    "Chopera": 23,
    "Legazpi": 24,
    "PalosFrontera": 26,
    "PalosMoguer": 26,
    "Atocha": 27,
    "Pacifico": 31,
    "Adelfas": 32,
    "Estrella": 33,
    "Ibiza": 34,
    "LosJeronimos": 35,
    "NinoJesus": 36,
    "Recoletos": 41,
    "Goya": 42,
    "Guindalera": 44,
    "Lista": 45,
    "Castellana": 46,
    "ElViso": 51,
    "Prosperidad": 52,
    "CiudadJardin": 53,
    "Hispanoamerica": 54,
    "NuevaEspana": 55,
    "Berruguete": 66,
    "Castilla": 56,
    "BellasVistas": 61,
    "CuatroCaminos": 62,
    "Castillejos": 63,
    "Almenara": 64,
    "Valdeacederas": 65,
    "Almagro": 74,
    "RiosRosas": 75,
    "Vallehermoso": 76,
    "ElPardo": 81,
    "Fuentelarreina": 82,
    "Arguelles": 92,
    "PenaGrande": 83,
    "ElPilar": 84,
    "LaPaz": 85,
    "Valverde": 86,
    "CasaCampo": 91,
    "Mirasierra": 87,
    "ElGoloso": 88,
    "CiudadUniversitaria": 93,
    "Portazgo": 135,
    "Valdezarza": 94,
    "Valdemarin": 95,
    "ElPlantio": 96,
    "Aravaca": 97,
    "LosCarmenes": 101,
    "PuertaAngel": 102,
    "Lucero": 103,
    "Hellin": 202,
    "Aluche": 104,
    "Campamento": 105,
    "CuatroVientos": 106,
    "LasAguilas": 107,
    "Comillas": 111,
    "Opanel": 112,
    "SanIsidro": 113,
    "VistaAlegre": 114,
    "Numancia": 136,
    "PuertaBonita": 115,
    "Buenavista": 116,
    "Abrantes": 117,
    "Orcasitas": 121,
    "Orcasur": 122,
    "Pavones": 141,
    "SanFermin": 123,
    "Almendrales": 124,
    "Moscardo": 125,
    "Zofio": 126,
    "Pradolongo": 127,
    "Horcajo": 142,
    "Marroquina": 143,
    "Entrevias": 131,
    "SanDiego": 132,
    "PalomerasBajas": 133,
    "PalomerasSureste": 134,
    "CascoHVallecas": 181,
    "CascoHistoricoVallecas" : 181,
    "CascoHistorico" : 181,
    "Amposta": 203,
    "MediaLegua": 144,
    "Fontarron": 145,
    "Vinateros": 146,
    "Ventas": 151,
    "PuebloNuevo": 152,
    "Quintana": 153,
    "Concepcion": 154,
    "SanPascual": 155,
    "SanJuanBautista": 156,
    "Colina": 157,
    "Atalaya": 158,
    "Costillares": 159,
    "Palomas": 161,
    "Piovera": 162,
    "Canillas": 163,
    "PinarRey": 164,
    "ApostolSantiago": 165,
    "Valdefuentes": 166,
    "VillaverdeAltoCH": 171,
    "SanAndres": 171,
    "SanCristobal": 172,
    "Simancas": 201,
    "Butarque": 173,
    "LosRosales": 174,
    "LosAngeles": 175,
    "SantaEugenia": 182,
    "EnsancheVallecas": 183,
    "CascoHVicalvaro": 191,
    "CascoHistoricoVicalvaro": 191,
    "Ambroz": 191,
    "Valdebernardo": 192,
    "Valderrivas": 193,
    "ElCanaveral": 194,
    "Arcos": 204,
    "Rosas": 205,
    "Rejas": 206,
    "Canillejas": 207,
    "ElSalvador": 208,
    "AlamedaOsuna": 211,
    "Aeropuerto": 212,
    "CascoHBarajas": 213,
    "Timon": 214,
    "Corralejos": 215,
}

# ==================
# Database Functions
# ===================

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

def get_area_id(supabase: Client, area_name: str) -> Optional[int]:
    """
    Get the neighbourhood ID from Supabase using the neighbourhood code mapping.
    
    Args:
        supabase: Supabase client instance
        area_name: Name of the neighbourhood (from the area.@id URL)
        
    Returns:
        Optional[int]: The neighbourhood ID if found, None otherwise
    """
    try:
        # Get the neighbourhood code from our mapping
        neighbourhood_code = CODE_MAPPING.get(area_name)
        
        if not neighbourhood_code:
            warning(f"Neighbourhood code not found in mapping for: {area_name}")
            return None
            
        # Look up the neighbourhood ID using the code
        response = supabase.table("neighbourhoods").select("id").eq("neighbourhood_code", neighbourhood_code).eq("city_id", CITY_ID).execute()
        
        if response.data:
            return response.data[0]['id']
        else:
            warning(f"Neighbourhood not found in database with code {neighbourhood_code}")
            return None
            
    except Exception as e:
        error(f"Failed to get neighbourhood ID from database: {str(e)}")
        return None

# ===================
# File Processors
# ===================

def process_parques_y_jardines(data: Dict) -> List[Dict]:
    """Process parks and gardens data."""
    processed = []
    feature_def = FEATURE_DEFINITIONS.get('Parks and gardens')
    
    if not feature_def:
        warning("'Parks and gardens' feature definition not found in database - skipping all records")
        return processed
    
    # Get Supabase client for area lookups
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Cannot process areas.")
        return processed
    
    for item in data.get('@graph', []):
        try:
            # Extract required fields
            name = item.get('title')
            location = item.get('location', {})
            lat = location.get('latitude')
            lon = location.get('longitude')
            address = item.get('address', {})
            district = address.get('district', {}).get('@id', '').split('/')[-1]
            
            # Extract neighbourhood name from the area.@id URL
            area_url = address.get('area', {}).get('@id', '')
            area = area_url.split('/')[-1] if area_url else None
            
            # Skip if required fields are missing
            if not all([name, lat, lon, district, area]):
                debug(f"Skipping park/garden record due to missing required fields")
                continue
            
            # Get the neighbourhood ID using the mapping
            area_id = get_area_id(supabase, area)
            if not area_id:
                warning(f"Skipping record due to missing area ID: {area}")
                continue
            
            # Create properties
            properties = {
                'address': address.get('street-address'),
                'postal_code': address.get('postal-code'),
                'district': district,
                'area': area,
                'description': item.get('organization', {}).get('organization-desc'),
                'services': item.get('organization', {}).get('services'),
                'schedule': item.get('organization', {}).get('schedule'),
                'accessibility': item.get('organization', {}).get('accesibility')
            }
            
            # Create the processed record
            processed.append({
                'feature_definition_id': feature_def,
                'name': name,
                'latitude': lat,
                'longitude': lon,
                'geom': f"SRID=4326;POINT({lon} {lat})",
                'geo_level_id': GEO_LEVELS['Neighbourhood'],
                'geo_id': area_id,  # Use the neighbourhood ID from database
                'city_id': CITY_ID,
                'properties': properties
            })
        except Exception as e:
            error(f"Error processing park/garden record: {str(e)}")
            continue
    
    info(f"Processed {len(processed)} parks and gardens records")
    return processed

def process_museos(data: Dict) -> List[Dict]:
    """Process museums data."""
    processed = []
    feature_def = FEATURE_DEFINITIONS.get('Museums')
    
    if not feature_def:
        warning("'Museums' feature definition not found in database - skipping all records")
        return processed
    
    # Get Supabase client for area lookups
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Cannot process areas.")
        return processed
    
    for item in data.get('@graph', []):
        try:
            # Extract required fields
            name = item.get('title')
            location = item.get('location', {})
            lat = location.get('latitude')
            lon = location.get('longitude')
            address = item.get('address', {})
            district = address.get('district', {}).get('@id', '').split('/')[-1]
            
            # Extract neighbourhood name from the area.@id URL
            area_url = address.get('area', {}).get('@id', '')
            area = area_url.split('/')[-1] if area_url else None
            
            # Skip if required fields are missing
            if not all([name, lat, lon, district, area]):
                debug(f"Skipping museum record due to missing required fields")
                continue
            
            # Get the neighbourhood ID using the mapping
            area_id = get_area_id(supabase, area)
            if not area_id:
                warning(f"Skipping record due to missing area ID: {area}")
                continue
            
            # Create properties
            properties = {
                'address': address.get('street-address'),
                'postal_code': address.get('postal-code'),
                'district': district,
                'area': area,
                'description': item.get('organization', {}).get('organization-desc'),
                'services': item.get('organization', {}).get('services'),
                'schedule': item.get('organization', {}).get('schedule'),
                'accessibility': item.get('organization', {}).get('accesibility')
            }
            
            # Create the processed record
            processed.append({
                'feature_definition_id': feature_def,
                'name': name,
                'latitude': lat,
                'longitude': lon,
                'geom': f"SRID=4326;POINT({lon} {lat})",
                'geo_level_id': GEO_LEVELS['Neighbourhood'],
                'geo_id': area_id,  # Use the neighbourhood ID from database
                'city_id': CITY_ID,
                'properties': properties
            })
        except Exception as e:
            error(f"Error processing museum record: {str(e)}")
            continue
    
    info(f"Processed {len(processed)} museum records")
    return processed

def process_salud(data: Dict) -> List[Dict]:
    """Process health centers data."""
    processed = []
    feature_def = FEATURE_DEFINITIONS.get('Health centers')
    
    if not feature_def:
        warning("'Health centers' feature definition not found in database - skipping all records")
        return processed
    
    # Get Supabase client for area lookups
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Cannot process areas.")
        return processed
    
    for item in data.get('@graph', []):
        try:
            # Extract required fields
            name = item.get('title')
            location = item.get('location', {})
            lat = location.get('latitude')
            lon = location.get('longitude')
            address = item.get('address', {})
            district = address.get('district', {}).get('@id', '').split('/')[-1]
            
            # Extract neighbourhood name from the area.@id URL
            area_url = address.get('area', {}).get('@id', '')
            area = area_url.split('/')[-1] if area_url else None
            
            # Skip if required fields are missing
            if not all([name, lat, lon, district, area]):
                debug(f"Skipping health center record due to missing required fields")
                continue
            
            # Get the neighbourhood ID using the mapping
            area_id = get_area_id(supabase, area)
            if not area_id:
                warning(f"Skipping record due to missing area ID: {area}")
                continue
            
            # Create properties
            properties = {
                'address': address.get('street-address'),
                'postal_code': address.get('postal-code'),
                'district': district,
                'area': area,
                'description': item.get('organization', {}).get('organization-desc'),
                'services': item.get('organization', {}).get('services'),
                'schedule': item.get('organization', {}).get('schedule'),
                'accessibility': item.get('organization', {}).get('accesibility')
            }
            
            # Create the processed record
            processed.append({
                'feature_definition_id': feature_def,
                'name': name,
                'latitude': lat,
                'longitude': lon,
                'geom': f"SRID=4326;POINT({lon} {lat})",
                'geo_level_id': GEO_LEVELS['Neighbourhood'],
                'geo_id': area_id,  # Use the neighbourhood ID from database
                'city_id': CITY_ID,
                'properties': properties
            })
        except Exception as e:
            error(f"Error processing health center record: {str(e)}")
            continue
    
    info(f"Processed {len(processed)} health center records")
    return processed

def process_centros_educativos(data: Dict) -> List[Dict]:
    """Process educational centers data."""
    processed = []
    feature_def = FEATURE_DEFINITIONS.get('Educational centers')
    
    if not feature_def:
        warning("'Educational centers' feature definition not found in database - skipping all records")
        return processed
    
    # Get Supabase client for area lookups
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Cannot process areas.")
        return processed
    
    for item in data.get('@graph', []):
        try:
            # Extract required fields
            name = item.get('title')
            location = item.get('location', {})
            lat = location.get('latitude')
            lon = location.get('longitude')
            address = item.get('address', {})
            district = address.get('district', {}).get('@id', '').split('/')[-1]
            
            # Extract neighbourhood name from the area.@id URL
            area_url = address.get('area', {}).get('@id', '')
            area = area_url.split('/')[-1] if area_url else None
            
            # Skip if required fields are missing
            if not all([name, lat, lon, district, area]):
                debug(f"Skipping educational center record due to missing required fields")
                continue
            
            # Get the neighbourhood ID using the mapping
            area_id = get_area_id(supabase, area)
            if not area_id:
                warning(f"Skipping record due to missing area ID: {area}")
                continue
            
            # Create properties
            properties = {
                'address': address.get('street-address'),
                'postal_code': address.get('postal-code'),
                'district': district,
                'area': area,
                'description': item.get('organization', {}).get('organization-desc'),
                'services': item.get('organization', {}).get('services'),
                'schedule': item.get('organization', {}).get('schedule'),
                'accessibility': item.get('organization', {}).get('accesibility')
            }
            
            # Create the processed record
            processed.append({
                'feature_definition_id': feature_def,
                'name': name,
                'latitude': lat,
                'longitude': lon,
                'geom': f"SRID=4326;POINT({lon} {lat})",
                'geo_level_id': GEO_LEVELS['Neighbourhood'],
                'geo_id': area_id,  # Use the neighbourhood ID from database
                'city_id': CITY_ID,
                'properties': properties
            })
        except Exception as e:
            error(f"Error processing educational center record: {str(e)}")
            continue
    
    info(f"Processed {len(processed)} educational center records")
    return processed

def process_bibliotecas(data: Dict) -> List[Dict]:
    """Process libraries data."""
    processed = []
    feature_def = FEATURE_DEFINITIONS.get('Libraries')
    
    if not feature_def:
        warning("'Libraries' feature definition not found in database - skipping all records")
        return processed
    
    # Get Supabase client for area lookups
    supabase = get_supabase_client()
    if not supabase:
        error("Failed to initialize Supabase client. Cannot process areas.")
        return processed
    
    for item in data.get('@graph', []):
        try:
            # Extract required fields
            name = item.get('title')
            location = item.get('location', {})
            lat = location.get('latitude')
            lon = location.get('longitude')
            address = item.get('address', {})
            district = address.get('district', {}).get('@id', '').split('/')[-1]
            
            # Extract neighbourhood name from the area.@id URL
            area_url = address.get('area', {}).get('@id', '')
            area = area_url.split('/')[-1] if area_url else None
            
            # Skip if required fields are missing
            if not all([name, lat, lon, district, area]):
                debug(f"Skipping library record due to missing required fields")
                continue
            
            # Get the neighbourhood ID using the mapping
            area_id = get_area_id(supabase, area)
            if not area_id:
                warning(f"Skipping record due to missing area ID: {area}")
                continue
            
            # Create properties
            properties = {
                'address': address.get('street-address'),
                'postal_code': address.get('postal-code'),
                'district': district,
                'area': area,
                'description': item.get('organization', {}).get('organization-desc'),
                'services': item.get('organization', {}).get('services'),
                'schedule': item.get('organization', {}).get('schedule'),
                'accessibility': item.get('organization', {}).get('accesibility')
            }
            
            # Create the processed record
            processed.append({
                'feature_definition_id': feature_def,
                'name': name,
                'latitude': lat,
                'longitude': lon,
                'geom': f"SRID=4326;POINT({lon} {lat})",
                'geo_level_id': GEO_LEVELS['Neighbourhood'],
                'geo_id': area_id,  # Use the neighbourhood ID from database
                'city_id': CITY_ID,
                'properties': properties
            })
        except Exception as e:
            error(f"Error processing library record: {str(e)}")
            continue
    
    info(f"Processed {len(processed)} library records")
    return processed

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
    info(f"Starting ETL process for Madrid point features...")
    
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
        # Load the resource URLs from the api-file-manifest.json file
        if manifest_path is None:
            manifest_path = BASE_DIR / "data/api-file-manifest.json"
            
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            urls = manifest['madrid']['point_features']['raw_file']
        
        # Process each feature type
        for feature_type, url in urls.items():
            # Fetch and process data
            data = fetch_madrid_data(url)
            if data:
                if 'parques-jardines' in url:
                    processed_data = process_parques_y_jardines(data)
                elif 'museos' in url:
                    processed_data = process_museos(data)
                elif 'bibliotecas' in url:
                    processed_data = process_bibliotecas(data)
                elif 'centros-educativos' in url:
                    processed_data = process_centros_educativos(data)
                elif 'atencion-medica' in url:
                    processed_data = process_salud(data)
                else:
                    warning(f"Unknown feature type: {feature_type}")
                    continue
                    
                all_processed_data.extend(processed_data)
            else:
                error(f"Failed to fetch data for {feature_type}")
            
    except Exception as e:
        error(f"Error processing data: {str(e)}")
    
    # Save the processed data
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(all_processed_data, f, ensure_ascii=False, indent=2)
    
    # Summary log
    info(f"Total point features processed: {len(all_processed_data)}")
    success(f"Output saved to: {output_path}")

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
        # Get the records from the response - handle both API formats
        records = data.get('records', []) or data.get('@graph', [])
        if not records:
            warning("No records found in API response")
            return processed_records
            
        info(f"Processing {len(records)} records from API response")
        
        # Process each record
        for record in records:
            try:
                # Extract required fields - handle both API formats
                name = record.get('name') or record.get('title', '')
                if not name:
                    warning("Skipping record with missing name")
                    continue
                    
                # Get coordinates - handle both API formats
                coordinates = record.get('geo_epgs_4326', {})
                if not coordinates:
                    location = record.get('location', {})
                    if location:
                        coordinates = {
                            'lon': location.get('longitude'),
                            'lat': location.get('latitude')
                        }
                
                if not coordinates:
                    warning(f"Skipping record with missing coordinates: {name}")
                    continue
                    
                lon = coordinates.get('lon')
                lat = coordinates.get('lat')
                if not lon or not lat:
                    warning(f"Skipping record with invalid coordinates: {name}")
                    continue
                
                # Convert coordinates to float
                try:
                    lon = float(lon)
                    lat = float(lat)
                except (ValueError, TypeError):
                    warning(f"Invalid coordinate format: lon={lon}, lat={lat}")
                    continue
                    
                # Get address information - handle both API formats
                address = record.get('addresses', {}) or record.get('address', {})
                road_name = address.get('road_name') or address.get('street-address', '')
                street_number = address.get('start_street_number') or address.get('street-number', '')
                zip_code = address.get('zip_code') or address.get('postal-code', '')
                
                # Get phone number if available
                phone = None
                values = record.get('values', [])
                for value in values:
                    if value.get('category') == 'Teléfonos':
                        phone = value.get('value')
                        break
                
                # Determine feature type based on the endpoint or record type
                feature_type = None
                if 'parques-jardines' in str(record) or 'parque' in name.lower() or 'jardín' in name.lower() or 'jardin' in name.lower():
                    feature_type = 'Parks and gardens'
                elif 'museos' in str(record) or 'museo' in name.lower():
                    feature_type = 'Museums'
                elif 'bibliotecas' in str(record) or 'biblioteca' in name.lower():
                    feature_type = 'Libraries'
                elif 'centros-educativos' in str(record) or 'colegio' in name.lower() or 'escuela' in name.lower():
                    feature_type = 'Educational centers'
                elif 'atencion-medica' in str(record) or 'centro de salud' in name.lower() or 'hospital' in name.lower():
                    feature_type = 'Health centers'
                
                if not feature_type:
                    warning(f"Could not determine feature type for: {name}")
                    continue
                
                feature_def_id = feature_defs.get(feature_type)
                if not feature_def_id:
                    warning(f"No feature definition found for type: {feature_type}")
                    continue
                
                # Get the neighbourhood code from the area.@id URL
                area_url = address.get('area', {}).get('@id', '')
                area_code = area_url.split('/')[-1] if area_url else None
                
                if not area_code:
                    warning(f"Missing area code for: {name}")
                    continue
                
                # Get the neighbourhood ID using the code mapping
                neighbourhood_code = CODE_MAPPING.get(area_code)
                if not neighbourhood_code:
                    warning(f"No neighbourhood code mapping found for: {area_code}")
                    continue
                
                # Look up the neighbourhood ID in the database
                neighbourhood_id = get_area_id(supabase, area_code)
                if not neighbourhood_id:
                    warning(f"Could not find neighbourhood ID for code: {neighbourhood_code}")
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
                        "phone": phone
                    },
                    "city_id": CITY_ID,
                    "geo_level_id": GEO_LEVELS["Neighbourhood"],
                    "feature_definition_id": feature_def_id,
                    "geo_id": neighbourhood_id
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

# ==========================
# CLI Entry Point
# ==========================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ETL script for loading Madrid point features.")
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH), 
                      help="Path where to save the processed data.")
    
    args = parser.parse_args()
    run(output_path=Path(args.output_path))
