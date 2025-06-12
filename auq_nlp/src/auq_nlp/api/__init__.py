"""
API module for AUQ NLP

Contains FastAPI application, endpoints, and request/response models.
"""

from .main import app, create_app

__all__ = [
    "app",
    "create_app",
] 