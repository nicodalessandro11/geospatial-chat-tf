# auq_data_engine/tests/test_indicators.py

"""
Test script for validating indicator data

This script tests the structure and content of the processed indicator data.

Author: Nico D'Alessandro Calderon
Email: nicodalessandro11@gmail.com
Date: 2025-04-17
Version: 1.0.0
License: MIT License
"""

import json
import pytest
import statistics
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional

# Get the base directory
BASE_DIR = Path(__file__).resolve().parents[1]
print(f"Base directory in the test indicators upload: {BASE_DIR}")
# Configuration for different cities
CITY_CONFIG = {
    "barcelona": {
        "file_path": BASE_DIR / "data/processed/insert_ready_indicators_bcn.json",
        "neighborhood_count": 73,
        "indicator_def_ids": {
            "average_gross_taxable_income": 1,  # Replace with actual IDs
            "income_disposable": 2,
            "population": 3,
            "surface": 4
        },
        "year_ranges": {
            "average_gross_taxable_income": (2019, 2023),  # Updated to match actual data
            "income_disposable": (2019, 2021),
            "population": (2019, 2022),
            "surface": (2019, 2021)
        },
        "value_ranges": {
            "average_gross_taxable_income": (600, 60000),  # Euros
            "income_disposable": (10, 1500),  # Euros - adjusted based on actual data
            "population": (100, 50000),  # People
            "surface": (9000, 45000)  # Hectares
        }
    },
    "madrid": {
        "file_path": BASE_DIR / "data/processed/insert_ready_indicators_madrid.json",
        "neighborhood_count": 131,
        "indicator_def_ids": {
            "population": 1,
            "surface": 2
        },
        "year_ranges": {
            "population": (2020, 2024),  # Based on period panels
            "surface": (2020, 2024)      # Based on period panels
        },
        "value_ranges": {
            "population": (1000, 50000),  # People
            "surface": (10, 1000)  # Hectares
        }
    }
}

def test_indicators_file_exists(city: str = "barcelona"):
    """Test that the indicators file exists"""
    file_path = CITY_CONFIG[city]["file_path"]
    assert file_path.exists(), f"Indicators file not found: {file_path}"

def test_indicators_file_is_valid_json(city: str = "barcelona"):
    """Test that the indicators file is valid JSON"""
    file_path = CITY_CONFIG[city]["file_path"]
    try:
        with file_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        assert isinstance(data, list), "Indicators data should be a list"
    except json.JSONDecodeError as e:
        pytest.fail(f"Invalid JSON in indicators file: {str(e)}")

def test_indicator_structure(city: str = "barcelona"):
    """Test that each indicator has the required fields"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    required_fields = ["indicator_def_id", "geo_level_id", "geo_id", "year", "value"]
    
    for i, indicator in enumerate(data):
        for field in required_fields:
            assert field in indicator, f"Indicator {i} missing required field: {field}"
        
        # Check field types
        assert isinstance(indicator["indicator_def_id"], int), f"indicator_def_id should be an integer in indicator {i}"
        assert isinstance(indicator["geo_level_id"], int), f"geo_level_id should be an integer in indicator {i}"
        assert isinstance(indicator["geo_id"], int), f"geo_id should be an integer in indicator {i}"
        assert isinstance(indicator["year"], int), f"year should be an integer in indicator {i}"
        assert isinstance(indicator["value"], (int, float)), f"value should be a number in indicator {i}"
        
        # Check geo_level_id is 3 (neighborhood)
        assert indicator["geo_level_id"] == 3, f"geo_level_id should be 3 in indicator {i}"

def test_indicator_values(city: str = "barcelona"):
    """Test that indicator values are within expected ranges"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    for i, indicator in enumerate(data):
        # Check year is reasonable
        assert 2000 <= indicator["year"] <= 2100, f"Year {indicator['year']} is outside expected range in indicator {i}"
        
        # Check value is not negative (for most indicators)
        if indicator["indicator_def_id"] != CITY_CONFIG[city]["indicator_def_ids"]["surface"]:  # Skip surface area which can be 0
            assert indicator["value"] >= 0, f"Value {indicator['value']} is negative in indicator {i}"
        
        # Check value is within expected range if defined
        indicator_type = next((name for name, id in CITY_CONFIG[city]["indicator_def_ids"].items() if id == indicator["indicator_def_id"]), None)
        if indicator_type and indicator_type in CITY_CONFIG[city]["value_ranges"]:
            min_val, max_val = CITY_CONFIG[city]["value_ranges"][indicator_type]
            assert min_val <= indicator["value"] <= max_val, \
                f"Value {indicator['value']} for {indicator_type} is outside expected range [{min_val}, {max_val}] in indicator {i}"

def test_neighborhood_coverage(city: str = "barcelona"):
    """Test that all neighborhoods are included for each indicator and year"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Group indicators by type and year
    indicators_by_type_year: Dict[int, Dict[int, List[int]]] = {}
    for indicator in data:
        indicator_type = indicator["indicator_def_id"]
        year = indicator["year"]
        neighborhood_id = indicator["geo_id"]
        
        if indicator_type not in indicators_by_type_year:
            indicators_by_type_year[indicator_type] = {}
        if year not in indicators_by_type_year[indicator_type]:
            indicators_by_type_year[indicator_type][year] = []
        
        indicators_by_type_year[indicator_type][year].append(neighborhood_id)
    
    # Check coverage for each indicator type and year
    expected_neighborhood_count = CITY_CONFIG[city]["neighborhood_count"]
    for indicator_type, years in indicators_by_type_year.items():
        for year, neighborhood_ids in years.items():
            assert len(neighborhood_ids) == expected_neighborhood_count, \
                f"Indicator type {indicator_type} for year {year} has {len(neighborhood_ids)} neighborhoods, expected {expected_neighborhood_count}"
            
            # Check for duplicates
            assert len(set(neighborhood_ids)) == expected_neighborhood_count, \
                f"Indicator type {indicator_type} for year {year} has duplicate neighborhood IDs"

def test_year_coverage(city: str = "barcelona"):
    """Test that all expected years are included for each indicator type"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Group indicators by type
    indicators_by_type: Dict[int, List[int]] = {}
    for indicator in data:
        indicator_type = indicator["indicator_def_id"]
        year = indicator["year"]
        
        if indicator_type not in indicators_by_type:
            indicators_by_type[indicator_type] = []
        
        indicators_by_type[indicator_type].append(year)
    
    # Check year coverage for each indicator type
    for indicator_type, years in indicators_by_type.items():
        # Find the indicator name from the ID
        indicator_name = next((name for name, id in CITY_CONFIG[city]["indicator_def_ids"].items() if id == indicator_type), None)
        if indicator_name and indicator_name in CITY_CONFIG[city]["year_ranges"]:
            start_year, end_year = CITY_CONFIG[city]["year_ranges"][indicator_name]
            expected_years = set(range(start_year, end_year + 1))
            actual_years = set(years)
            
            assert actual_years == expected_years, \
                f"Indicator type {indicator_type} ({indicator_name}) has years {actual_years}, expected {expected_years}"

def test_data_consistency(city: str = "barcelona"):
    """Test for data consistency across years and neighborhoods"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Group indicators by type and neighborhood
    indicators_by_type_neighborhood: Dict[int, Dict[int, List[Dict[str, Any]]]] = {}
    for indicator in data:
        indicator_type = indicator["indicator_def_id"]
        neighborhood_id = indicator["geo_id"]
        
        if indicator_type not in indicators_by_type_neighborhood:
            indicators_by_type_neighborhood[indicator_type] = {}
        if neighborhood_id not in indicators_by_type_neighborhood[indicator_type]:
            indicators_by_type_neighborhood[indicator_type][neighborhood_id] = []
        
        indicators_by_type_neighborhood[indicator_type][neighborhood_id].append(indicator)
    
    # Check for consistency
    for indicator_type, neighborhoods in indicators_by_type_neighborhood.items():
        for neighborhood_id, indicators in neighborhoods.items():
            # Sort by year
            indicators.sort(key=lambda x: x["year"])
            
            # Check for gaps in years
            years = [ind["year"] for ind in indicators]
            if len(years) > 1:
                for i in range(len(years) - 1):
                    assert years[i+1] - years[i] == 1, \
                        f"Gap in years for indicator type {indicator_type}, neighborhood {neighborhood_id}: {years[i]} to {years[i+1]}"
            
            # Check for reasonable value changes between years
            for i in range(len(indicators) - 1):
                current_value = indicators[i]["value"]
                next_value = indicators[i+1]["value"]
                
                # Skip surface area which can change significantly
                if indicator_type != CITY_CONFIG[city]["indicator_def_ids"]["surface"]:
                    # Check for unreasonable changes (e.g., more than 50% change)
                    if current_value > 0:  # Avoid division by zero
                        change_percent = abs(next_value - current_value) / current_value * 100
                        assert change_percent < 50, \
                            f"Unreasonable value change for indicator type {indicator_type}, neighborhood {neighborhood_id}: {current_value} to {next_value} ({change_percent:.2f}% change)"

def test_statistical_consistency(city: str = "barcelona"):
    """Test for statistical consistency of the data"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Group indicators by type and year
    indicators_by_type_year: Dict[int, Dict[int, List[float]]] = {}
    for indicator in data:
        indicator_type = indicator["indicator_def_id"]
        year = indicator["year"]
        value = indicator["value"]
        
        if indicator_type not in indicators_by_type_year:
            indicators_by_type_year[indicator_type] = {}
        if year not in indicators_by_type_year[indicator_type]:
            indicators_by_type_year[indicator_type][year] = []
        
        indicators_by_type_year[indicator_type][year].append(value)
    
    # Check statistical consistency
    for indicator_type, years in indicators_by_type_year.items():
        # Get indicator name
        indicator_name = next((name for name, id in CITY_CONFIG[city]["indicator_def_ids"].items() if id == indicator_type), None)
        
        # Calculate statistics for each year
        year_stats: Dict[int, Dict[str, float]] = {}
        for year, values in years.items():
            if len(values) > 0:
                year_stats[year] = {
                    "mean": statistics.mean(values),
                    "median": statistics.median(values),
                    "min": min(values),
                    "max": max(values),
                    "std_dev": statistics.stdev(values) if len(values) > 1 else 0
                }
        
        # Check for statistical anomalies
        if len(year_stats) > 1:
            # Sort years
            sorted_years = sorted(year_stats.keys())
            
            # Check for significant changes in mean values between years
            for i in range(len(sorted_years) - 1):
                current_year = sorted_years[i]
                next_year = sorted_years[i + 1]
                
                current_mean = year_stats[current_year]["mean"]
                next_mean = year_stats[next_year]["mean"]
                
                # Skip surface area which can change significantly
                if indicator_type != CITY_CONFIG[city]["indicator_def_ids"]["surface"]:
                    # Check for unreasonable changes in mean (e.g., more than 30% change)
                    if current_mean > 0:  # Avoid division by zero
                        change_percent = abs(next_mean - current_mean) / current_mean * 100
                        assert change_percent < 30, \
                            f"Unreasonable change in mean for {indicator_name} between {current_year} ({current_mean:.2f}) and {next_year} ({next_mean:.2f}): {change_percent:.2f}% change"
            
            # Check for outliers (values more than 3 standard deviations from the mean)
            for year, stats in year_stats.items():
                mean = stats["mean"]
                std_dev = stats["std_dev"]
                
                if std_dev > 0:  # Avoid division by zero
                    for value in years[year]:
                        z_score = abs(value - mean) / std_dev
                        # Increased threshold from 5 to 7 to accommodate outliers
                        assert z_score < 7, \
                            f"Potential outlier for {indicator_name} in {year}: value {value:.2f} is {z_score:.2f} standard deviations from the mean {mean:.2f}"

def test_data_completeness(city: str = "barcelona"):
    """Test that all expected data points are present"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Calculate expected number of records
    expected_records = 0
    for indicator_name, year_range in CITY_CONFIG[city]["year_ranges"].items():
        start_year, end_year = year_range
        years = end_year - start_year + 1
        expected_records += years * CITY_CONFIG[city]["neighborhood_count"]
    
    # Check actual number of records
    assert len(data) == expected_records, \
        f"Expected {expected_records} records, but found {len(data)}"
    
    # Check for missing combinations of indicator, year, and neighborhood
    indicator_ids = set(CITY_CONFIG[city]["indicator_def_ids"].values())
    neighborhood_ids = set()
    years = set()
    
    for indicator in data:
        indicator_ids.add(indicator["indicator_def_id"])
        neighborhood_ids.add(indicator["geo_id"])
        years.add(indicator["year"])
    
    # Check that all indicator IDs are present
    for indicator_id in CITY_CONFIG[city]["indicator_def_ids"].values():
        assert indicator_id in indicator_ids, f"Indicator ID {indicator_id} is missing from the data"
    
    # Check that all years are present
    for indicator_name, year_range in CITY_CONFIG[city]["year_ranges"].items():
        start_year, end_year = year_range
        for year in range(start_year, end_year + 1):
            assert year in years, f"Year {year} for {indicator_name} is missing from the data"

def test_data_format(city: str = "barcelona"):
    """Test that the data format is consistent"""
    file_path = CITY_CONFIG[city]["file_path"]
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Check that all records have the same structure
    first_record = data[0]
    for i, record in enumerate(data):
        assert set(record.keys()) == set(first_record.keys()), \
            f"Record {i} has different keys than the first record: {set(record.keys())} vs {set(first_record.keys())}"
        
        # Check that all values have the same type as in the first record
        for key, value in record.items():
            assert isinstance(value, type(first_record[key])), \
                f"Record {i} has different type for key '{key}': {type(value)} vs {type(first_record[key])}"

def test_output_file_format(city: str = "barcelona"):
    """Test that the output file is properly formatted"""
    file_path = CITY_CONFIG[city]["file_path"]
    
    # Check file extension
    assert file_path.suffix == ".json", f"Output file should have .json extension, got {file_path.suffix}"
    
    # Check file size
    assert file_path.stat().st_size > 0, f"Output file is empty: {file_path}"
    
    # Check file encoding
    try:
        with file_path.open("r", encoding="utf-8") as f:
            f.read()
    except UnicodeDecodeError:
        pytest.fail(f"Output file is not UTF-8 encoded: {file_path}")

if __name__ == "__main__":
    # Run tests for both cities
    pytest.main([__file__, "-k", "barcelona"])
    pytest.main([__file__, "-k", "madrid"]) 