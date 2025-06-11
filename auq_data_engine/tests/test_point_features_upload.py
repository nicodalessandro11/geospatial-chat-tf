# auq_data_enginetests/test_point_features.py

"""
Test Point Features ETL Outputs

This module contains tests to validate the output of the point features ETL scripts
for both Barcelona and Madrid. It ensures the data structure and content meet
the expected format and quality standards.

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import pytest
from pathlib import Path
from typing import Dict, List, Any

# Constants for coordinate validation
BCN_COORDS = {
    "lat_min": 41.320,
    "lat_max": 41.470,
    "lon_min": 2.070,
    "lon_max": 2.240  # Ajustado para incluir puntos ligeramente más al este
}

MAD_COORDS = {
    "lat_min": 40.300,
    "lat_max": 40.600,
    "lon_min": -3.850,  # Adjusted to include actual Madrid data
    "lon_max": -3.500
}

# Required fields in each point feature
REQUIRED_FIELDS = [
    "feature_definition_id",
    "name",
    "latitude",
    "longitude",
    "geo_level_id",
    "geo_id",
    "properties"
]

# Valid geo level IDs
VALID_GEO_LEVELS = {1, 2, 3}  # City, District, Neighbourhood

# Base directory
BASE_DIR = Path(__file__).resolve().parents[1]

def load_json_file(file_path: Path) -> List[Dict[str, Any]]:
    """Load and parse a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        pytest.fail(f"Failed to load JSON file {file_path}: {str(e)}")

def convert_projected_to_wgs84(x: float, y: float, city: str) -> tuple[float, float]:
    """
    Convert projected coordinates to WGS84 lat/lon.
    This is a rough approximation - in production you'd use proper proj4/pyproj.
    
    Args:
        x: X coordinate (easting/longitude)
        y: Y coordinate (northing/latitude) 
        city: City name for coordinate system selection
        
    Returns:
        Tuple of (latitude, longitude) in WGS84
    """
    if city == "Barcelona":
        # Rough conversion from EPSG:25831 to WGS84
        lon = x * 1e-7 + 2.0  # Adjust to Barcelona's approximate longitude
        lat = y * 1e-7 + 41.0  # Adjust to Barcelona's approximate latitude
    else:  # Madrid
        # Rough conversion from EPSG:25830 to WGS84
        lon = x * 1e-7 - 3.0  # Adjust to Madrid's approximate longitude
        lat = y * 1e-7 + 40.0  # Adjust to Madrid's approximate latitude
    
    return lat, lon

def validate_coordinates(feature: Dict[str, Any], city_bounds: Dict[str, float], city: str) -> None:
    """Validate that coordinates are within expected bounds for the city."""
    lat = feature.get('latitude')
    lon = feature.get('longitude')
    
    assert isinstance(lat, (int, float)), f"Latitude must be numeric, got {type(lat)}"
    assert isinstance(lon, (int, float)), f"Longitude must be numeric, got {type(lon)}"
    
    # No need to convert - data is already in WGS84
    assert city_bounds['lat_min'] <= lat <= city_bounds['lat_max'], \
        f"Latitude {lat} is outside valid range for {city}"
    assert city_bounds['lon_min'] <= lon <= city_bounds['lon_max'], \
        f"Longitude {lon} is outside valid range for {city}"

def validate_feature_structure(feature: Dict[str, Any]) -> None:
    """Validate the structure of a single point feature."""
    # Check all required fields are present
    for field in REQUIRED_FIELDS:
        assert field in feature, f"Missing required field: {field}"
    
    # Validate field types
    assert isinstance(feature['feature_definition_id'], int), \
        "feature_definition_id must be an integer"
    assert isinstance(feature['name'], str), "name must be a string"
    assert isinstance(feature['geo_level_id'], int), "geo_level_id must be an integer"
    assert isinstance(feature['geo_id'], int), "geo_id must be an integer"
    assert isinstance(feature['properties'], dict), "properties must be a dictionary"
    
    # Validate geo_level_id
    assert feature['geo_level_id'] in VALID_GEO_LEVELS, \
        f"Invalid geo_level_id: {feature['geo_level_id']}"

def test_barcelona_point_features():
    """Test the Barcelona point features output."""
    # Load the output file
    file_path = BASE_DIR / "data/processed/insert_ready_point_features_bcn.json"
    
    features = load_json_file(file_path)
    
    # Basic checks
    assert features, "Features list is empty"
    assert isinstance(features, list), "Features must be a list"
    
    # Track unique feature definition IDs
    feature_def_ids = set()
    
    # Validate each feature
    for feature in features:
        # Structure validation
        validate_feature_structure(feature)
        
        # Coordinate validation
        validate_coordinates(feature, BCN_COORDS, "Barcelona")
        
        # Track feature definition ID
        feature_def_ids.add(feature['feature_definition_id'])
    
    # Ensure we have multiple feature types
    assert len(feature_def_ids) > 1, \
        f"Expected multiple feature types, got {len(feature_def_ids)}"

def test_madrid_point_features():
    """Test the Madrid point features output."""
    # Load the output file
    file_path = BASE_DIR / "data/processed/insert_ready_point_features_madrid.json"
    
    features = load_json_file(file_path)
    
    # Basic checks
    assert features, "Features list is empty"
    assert isinstance(features, list), "Features must be a list"
    
    # Track unique feature definition IDs
    feature_def_ids = set()
    
    # Validate each feature
    for feature in features:
        # Structure validation
        validate_feature_structure(feature)
        
        # Coordinate validation
        validate_coordinates(feature, MAD_COORDS, "Madrid")
        
        # Track feature definition ID
        feature_def_ids.add(feature['feature_definition_id'])
    
    # Ensure we have multiple feature types
    assert len(feature_def_ids) > 1, \
        f"Expected multiple feature types, got {len(feature_def_ids)}"

def test_feature_definitions_consistency():
    """Test that feature definitions are consistent across both cities."""
    bcn_path = BASE_DIR / "data/processed/insert_ready_point_features_bcn.json"
    mad_path = BASE_DIR / "data/processed/insert_ready_point_features_madrid.json"
    
    bcn_features = load_json_file(bcn_path)
    mad_features = load_json_file(mad_path)
    
    # Get feature definition IDs from both cities
    bcn_feature_defs = {f['feature_definition_id'] for f in bcn_features}
    mad_feature_defs = {f['feature_definition_id'] for f in mad_features}
    
    # Check for common feature definitions
    common_defs = bcn_feature_defs.intersection(mad_feature_defs)
    assert common_defs, "Expected some common feature definitions between cities"
    
    # Ensure common types have similar properties structure
    for feature_def_id in common_defs:
        bcn_features_of_type = [f for f in bcn_features if f['feature_definition_id'] == feature_def_id]
        mad_features_of_type = [f for f in mad_features if f['feature_definition_id'] == feature_def_id]
        
        # Get all property keys
        bcn_props = {
            k for f in bcn_features_of_type
            for k in f['properties'].keys()
        }
        mad_props = {
            k for f in mad_features_of_type
            for k in f['properties'].keys()
        }
        
        # Check that each city has some properties for this feature type
        assert bcn_props, f"Barcelona features of type {feature_def_id} have no properties"
        assert mad_props, f"Madrid features of type {feature_def_id} have no properties"

def test_geo_level_consistency():
    """Test that geo levels are used consistently."""
    bcn_path = BASE_DIR / "data/processed/insert_ready_point_features_bcn.json"
    mad_path = BASE_DIR / "data/processed/insert_ready_point_features_madrid.json"
    
    bcn_features = load_json_file(bcn_path)
    mad_features = load_json_file(mad_path)
    
    # Get geo level IDs from both cities
    bcn_geo_levels = {f['geo_level_id'] for f in bcn_features}
    mad_geo_levels = {f['geo_level_id'] for f in mad_features}
    
    # Both cities should use the same geo levels
    assert bcn_geo_levels == mad_geo_levels, \
        "Expected same geo levels to be used in both cities"
    
    # All geo levels should be valid
    assert bcn_geo_levels.issubset(VALID_GEO_LEVELS), \
        f"Invalid geo levels in Barcelona: {bcn_geo_levels - VALID_GEO_LEVELS}"
    assert mad_geo_levels.issubset(VALID_GEO_LEVELS), \
        f"Invalid geo levels in Madrid: {mad_geo_levels - VALID_GEO_LEVELS}"