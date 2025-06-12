"""
Cache Manager for AUQ NLP API

Implements intelligent caching for frequent queries to improve response times
and reduce OpenAI API costs.

Author: Nicolas Dalessandro
Date: 2025-06-11
Version: 1.0.0
"""

import hashlib
import json
import time
from typing import Optional, Dict, Any
from functools import lru_cache
import os


class QueryCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
    
    def _generate_key(self, question: str, context: str = "") -> str:
        """Generate cache key from question and context"""
        content = f"{question.lower().strip()}|{context}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _is_expired(self, cache_entry: Dict[str, Any]) -> bool:
        """Check if cache entry is expired"""
        return time.time() - cache_entry["timestamp"] > self.ttl_seconds
    
    def get(self, question: str, context: str = "") -> Optional[Dict[str, Any]]:
        """Get cached response for a question"""
        key = self._generate_key(question, context)
        
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if self._is_expired(entry):
            del self.cache[key]
            return None
        
        # Update access time for LRU
        entry["last_accessed"] = time.time()
        return entry["response"]
    
    def set(self, question: str, response: Dict[str, Any], context: str = ""):
        """Cache a response for a question"""
        key = self._generate_key(question, context)
        
        # Implement simple LRU eviction
        if len(self.cache) >= self.max_size:
            self._evict_oldest()
        
        self.cache[key] = {
            "response": response,
            "timestamp": time.time(),
            "last_accessed": time.time(),
            "question": question
        }
    
    def _evict_oldest(self):
        """Evict the least recently used entry"""
        if not self.cache:
            return
        
        oldest_key = min(
            self.cache.keys(),
            key=lambda k: self.cache[k]["last_accessed"]
        )
        del self.cache[oldest_key]
    
    def clear(self):
        """Clear all cached entries"""
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        valid_entries = sum(
            1 for entry in self.cache.values()
            if not self._is_expired(entry)
        )
        
        return {
            "total_entries": len(self.cache),
            "valid_entries": valid_entries,
            "expired_entries": len(self.cache) - valid_entries,
            "max_size": self.max_size,
            "ttl_seconds": self.ttl_seconds
        }


class PrecompiledQueries:
    """Pre-compiled common queries for instant responses"""
    
    COMMON_QUERIES = {
        "population_barcelona": {
            "patterns": [
                "población de barcelona",
                "cuántos habitantes tiene barcelona",
                "population of barcelona",
                "barcelona population"
            ],
            "sql": """
                SELECT g.name, i.value 
                FROM geographical_unit_view g
                JOIN current_indicators_view i ON g.geo_id = i.geo_id 
                WHERE g.geo_level_id = 1 
                AND g.name = 'Barcelona'
                AND i.indicator_name ILIKE '%population%'
                ORDER BY i.year DESC
                LIMIT 1
            """,
            "response_template": "The population of Barcelona is {value:,.0f} inhabitants."
        },
        
        "districts_count": {
            "patterns": [
                "cuántos distritos tiene barcelona",
                "número de distritos en barcelona",
                "how many districts in barcelona"
            ],
            "sql": """
                SELECT COUNT(*) as district_count
                FROM geographical_unit_view
                WHERE geo_level_id = 2 AND city_id = 1
            """,
            "response_template": "Barcelona has {district_count} districts."
        },
        
        "population_by_district": {
            "patterns": [
                "población por distrito",
                "districts by population",
                "población de los distritos"
            ],
            "sql": """
                SELECT g.name, i.value 
                FROM geographical_unit_view g
                JOIN current_indicators_view i ON g.geo_id = i.geo_id 
                WHERE g.geo_level_id = 2 
                AND g.city_id = 1
                AND i.indicator_name ILIKE '%population%'
                ORDER BY i.value DESC
            """,
            "response_template": "Here are the Barcelona districts by population:\\n{formatted_results}"
        }
    }
    
    @classmethod
    def find_matching_query(cls, question: str) -> Optional[Dict[str, Any]]:
        """Find a pre-compiled query that matches the question"""
        question_lower = question.lower().strip()
        
        for query_info in cls.COMMON_QUERIES.values():
            for pattern in query_info["patterns"]:
                if pattern in question_lower:
                    return query_info
        
        return None
    
    @classmethod
    def format_response(cls, template: str, results: Any) -> str:
        """Format the response using the template and results"""
        try:
            if isinstance(results, list) and len(results) > 0:
                if "formatted_results" in template:
                    # Format list results
                    formatted = "\\n".join([
                        f"• {row[0]}: {row[1]:,.0f}" if isinstance(row[1], (int, float))
                        else f"• {row[0]}: {row[1]}"
                        for row in results[:10]  # Limit to top 10
                    ])
                    return template.format(formatted_results=formatted)
                elif len(results[0]) > 1:
                    # Single result with multiple columns
                    result_dict = dict(zip(
                        ["name", "value", "district_count"],
                        results[0]
                    ))
                    return template.format(**result_dict)
            
            # Single value result
            if isinstance(results, (int, float)):
                return template.format(value=results)
            elif isinstance(results, list) and len(results) > 0:
                return template.format(value=results[0][0])
            
        except (KeyError, IndexError, TypeError) as e:
            print(f"Error formatting response: {e}")
            return f"Results: {results}"
        
        return f"Results: {results}"
    
    @classmethod
    def get_response(cls, question: str) -> Optional[Dict[str, Any]]:
        """Get a precompiled response for a question if available"""
        matching_query = cls.find_matching_query(question)
        if matching_query:
            return {
                "sql": matching_query["sql"],
                "template": matching_query["response_template"],
                "found": True
            }
        return None


# Global cache instance
query_cache = QueryCache(max_size=1000, ttl_seconds=3600)  # 1 hour TTL 