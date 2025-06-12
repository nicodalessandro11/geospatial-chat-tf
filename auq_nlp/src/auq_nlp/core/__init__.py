"""
Core module for AUQ NLP

Contains the fundamental components: configuration, caching, validation,
and shared utilities for the natural language processing system.
"""

from .config import settings
from .cache import QueryCache, PrecompiledQueries
# from .validator import ResultValidator  # Temporarily disabled to avoid circular import

__all__ = [
    "settings",
    "QueryCache",
    "PrecompiledQueries", 
    # "ResultValidator",
] 