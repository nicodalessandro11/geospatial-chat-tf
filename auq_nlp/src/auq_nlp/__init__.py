"""
AUQ NLP - Are U Query-ous Natural Language Processing API

A sophisticated urban data analysis system that converts natural language
questions into SQL queries for spatial and demographic data analysis.

Author: Nicolas Dalessandro
Email: nicodalessandro11@gmail.com
Version: 2.0.0
License: MIT License
"""

__version__ = "2.0.0"
__author__ = "Nicolas Dalessandro"
__email__ = "nicodalessandro11@gmail.com"

# Import core components for easy access
from .core.config import settings
from .core.cache import QueryCache
from .core.validator import ResultValidator

__all__ = [
    "settings",
    "QueryCache", 
    "ResultValidator",
] 