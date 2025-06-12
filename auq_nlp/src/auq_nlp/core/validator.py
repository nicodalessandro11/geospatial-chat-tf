"""
Result Validator for AUQ NLP API

Validates SQL query results to ensure data quality and catch common errors.

Author: Nicolas Dalessandro
Date: 2025-06-11
Version: 1.0.0
"""

from typing import Any, List, Dict, Optional, Union
import re
from auq_nlp.utils.logging import warning, error, info


class ResultValidator:
    """Validates SQL query results for data quality and logical consistency"""
    
    # Known valid Barcelona districts
    VALID_DISTRICTS = {
        "Ciutat Vella", "Eixample", "Sants-Montjuïc", "Les Corts", 
        "Sarrià-Sant Gervasi", "Gràcia", "Horta-Guinardó", "Nou Barris",
        "Sant Andreu", "Sant Martí"
    }
    
    # Population ranges for validation (approximate)
    POPULATION_RANGES = {
        1: (1_500_000, 2_000_000),  # Barcelona city
        2: (50_000, 400_000),       # Districts
        3: (5_000, 80_000)          # Neighborhoods
    }
    
    # Valid feature types
    VALID_FEATURE_TYPES = {
        "school", "hospital", "park", "metro_station", "bus_stop",
        "library", "market", "sports_center", "cultural_center"
    }
    
    def validate_population_data(self, result: Any, geo_level: int = None) -> Dict[str, Any]:
        """Validate population data results"""
        validation = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "cleaned_result": result
        }
        
        try:
            # Handle different result formats
            if isinstance(result, list) and len(result) > 0:
                for row in result:
                    if len(row) >= 2:
                        name, value = row[0], row[1]
                        
                        # Validate population value
                        if isinstance(value, (int, float)):
                            if value < 0:
                                validation["errors"].append(f"Negative population for {name}: {value}")
                                validation["is_valid"] = False
                            
                            elif geo_level and geo_level in self.POPULATION_RANGES:
                                min_pop, max_pop = self.POPULATION_RANGES[geo_level]
                                if value < min_pop or value > max_pop:
                                    validation["warnings"].append(
                                        f"Population {value:,.0f} for {name} seems unusual "
                                        f"(expected range: {min_pop:,.0f}-{max_pop:,.0f})"
                                    )
                        
                        # Validate district names
                        if geo_level == 2 and name not in self.VALID_DISTRICTS:
                            validation["warnings"].append(f"Unknown district name: {name}")
            
        except Exception as e:
            validation["errors"].append(f"Error validating population data: {str(e)}")
            validation["is_valid"] = False
        
        return validation
    
    def validate_geographic_entity(self, name: str, geo_level: int) -> Dict[str, Any]:
        """Validate geographic entity names"""
        validation = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "suggestions": []
        }
        
        if not name or not isinstance(name, str):
            validation["errors"].append("Invalid entity name")
            validation["is_valid"] = False
            return validation
        
        # Check district names
        if geo_level == 2:
            if name not in self.VALID_DISTRICTS:
                validation["warnings"].append(f"'{name}' is not a known Barcelona district")
                
                # Suggest similar names
                suggestions = self._find_similar_names(name, self.VALID_DISTRICTS)
                if suggestions:
                    validation["suggestions"] = suggestions
        
        # Check for common misspellings or variations
        cleaned_name = self._clean_name(name)
        if cleaned_name != name:
            validation["warnings"].append(f"Name normalized from '{name}' to '{cleaned_name}'")
            validation["cleaned_name"] = cleaned_name
        
        return validation
    
    def validate_count_result(self, result: Any, feature_type: str = None) -> Dict[str, Any]:
        """Validate counting results (schools, hospitals, etc.)"""
        validation = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "cleaned_result": result
        }
        
        try:
            count = None
            
            # Extract count from different result formats
            if isinstance(result, (int, float)):
                count = result
            elif isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], (int, float)):
                    count = result[0]
                elif isinstance(result[0], (list, tuple)) and len(result[0]) > 0:
                    count = result[0][0]
            
            if count is not None:
                if count < 0:
                    validation["errors"].append(f"Negative count: {count}")
                    validation["is_valid"] = False
                
                elif count > 1000:  # Suspiciously high
                    validation["warnings"].append(
                        f"Very high count ({count}) - please verify this is correct"
                    )
                
                # Feature-specific validation
                if feature_type:
                    if feature_type not in self.VALID_FEATURE_TYPES:
                        validation["warnings"].append(f"Unknown feature type: {feature_type}")
                    
                    # Reasonable ranges for different features
                    if feature_type == "school" and count > 100:
                        validation["warnings"].append(f"Unusually high school count: {count}")
                    elif feature_type == "hospital" and count > 20:
                        validation["warnings"].append(f"Unusually high hospital count: {count}")
            
        except Exception as e:
            validation["errors"].append(f"Error validating count result: {str(e)}")
            validation["is_valid"] = False
        
        return validation
    
    def validate_sql_query(self, query: str) -> Dict[str, Any]:
        """Validate SQL query for common issues"""
        validation = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "suggestions": []
        }
        
        query_lower = query.lower().strip()
        
        # Check for dangerous operations
        dangerous_keywords = ["drop", "delete", "truncate", "alter", "update", "insert"]
        for keyword in dangerous_keywords:
            if f" {keyword} " in query_lower or query_lower.startswith(keyword):
                validation["errors"].append(f"Dangerous SQL operation detected: {keyword}")
                validation["is_valid"] = False
        
        # Check for best practices
        if "geographical_unit_view" not in query_lower:
            if any(table in query_lower for table in ["districts", "neighborhoods", "cities"]):
                validation["warnings"].append(
                    "Consider using geographical_unit_view instead of individual spatial tables"
                )
        
        if "geo_level_id" not in query_lower and "geographical_unit_view" in query_lower:
            validation["warnings"].append(
                "Missing geo_level_id filter - results may be ambiguous"
            )
        
        if " * " in query_lower:
            validation["warnings"].append(
                "SELECT * may return unnecessary data - consider selecting specific columns"
            )
        
        return validation
    
    def _clean_name(self, name: str) -> str:
        """Clean and normalize geographic names"""
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', name.strip())
        
        # Common normalizations
        replacements = {
            "Sant ": "Sant ",  # Ensure proper spacing
            "St ": "Sant ",
            "St. ": "Sant ",
        }
        
        for old, new in replacements.items():
            cleaned = cleaned.replace(old, new)
        
        return cleaned
    
    def _find_similar_names(self, name: str, valid_names: set, threshold: float = 0.6) -> List[str]:
        """Find similar names using simple string similarity"""
        name_lower = name.lower()
        suggestions = []
        
        for valid_name in valid_names:
            valid_lower = valid_name.lower()
            
            # Simple similarity based on common characters
            if name_lower in valid_lower or valid_lower in name_lower:
                suggestions.append(valid_name)
            elif self._calculate_similarity(name_lower, valid_lower) > threshold:
                suggestions.append(valid_name)
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate simple string similarity (Jaccard similarity)"""
        set1 = set(str1.split())
        set2 = set(str2.split())
        
        if not set1 and not set2:
            return 1.0
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union if union > 0 else 0.0
    
    def generate_validation_report(self, validations: List[Dict[str, Any]]) -> str:
        """Generate a human-readable validation report"""
        total_validations = len(validations)
        valid_count = sum(1 for v in validations if v["is_valid"])
        
        report = f"Validation Report: {valid_count}/{total_validations} passed\n"
        
        for i, validation in enumerate(validations):
            if validation["errors"]:
                report += f"\nErrors in validation {i+1}:\n"
                for error in validation["errors"]:
                    report += f"  ❌ {error}\n"
            
            if validation["warnings"]:
                report += f"\nWarnings in validation {i+1}:\n"
                for warning in validation["warnings"]:
                    report += f"  ⚠️ {warning}\n"
        
        return report


# Global validator instance
result_validator = ResultValidator() 