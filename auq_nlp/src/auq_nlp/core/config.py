"""
Configuration management for AUQ NLP API

Centralized configuration using Pydantic settings with environment variable support.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Configuration
    api_title: str = "AUQ NLP API"
    api_description: str = "Natural Language Processing API for Urban Analytics Queries"
    api_version: str = "2.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    reload: bool = Field(default=False, env="RELOAD")
    
    # Database Configuration
    supabase_uri: str = Field(..., env="SUPABASE_URI")
    database_timeout: int = Field(default=30, env="DATABASE_TIMEOUT")
    
    # OpenAI Configuration
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4-turbo-preview", env="OPENAI_MODEL")
    openai_temperature: float = Field(default=0.0, env="OPENAI_TEMPERATURE")
    openai_max_tokens: int = Field(default=1500, env="OPENAI_MAX_TOKENS")
    openai_timeout: int = Field(default=60, env="OPENAI_TIMEOUT")
    
    # Cache Configuration
    cache_enabled: bool = Field(default=True, env="CACHE_ENABLED")
    cache_max_size: int = Field(default=1000, env="CACHE_MAX_SIZE")
    cache_ttl_seconds: int = Field(default=3600, env="CACHE_TTL_SECONDS")  # 1 hour
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["*"],
        env="CORS_ORIGINS"
    )
    cors_allow_credentials: bool = Field(default=False, env="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        env="CORS_ALLOW_METHODS"
    )
    cors_allow_headers: List[str] = Field(default=["*"], env="CORS_ALLOW_HEADERS")
    
    # Paths Configuration
    base_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3])
    prompt_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3] / "config" / "prompts")
    docs_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3] / "docs")
    
    # Prompt Configuration
    enhanced_prompt_file: str = Field(default="enhanced_prompt.txt", env="ENHANCED_PROMPT_FILE")
    fallback_prompt_file: str = Field(default="custom_prompt.txt", env="FALLBACK_PROMPT_FILE")
    
    # Validation Configuration
    validation_enabled: bool = Field(default=True, env="VALIDATION_ENABLED")
    max_population_city: int = Field(default=2_000_000, env="MAX_POPULATION_CITY")
    max_population_district: int = Field(default=400_000, env="MAX_POPULATION_DISTRICT")
    max_population_neighborhood: int = Field(default=80_000, env="MAX_POPULATION_NEIGHBORHOOD")
    
    # Performance Configuration
    max_conversation_history: int = Field(default=4, env="MAX_CONVERSATION_HISTORY")
    enable_precompiled_queries: bool = Field(default=True, env="ENABLE_PRECOMPILED_QUERIES")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @property
    def enhanced_prompt_path(self) -> Path:
        """Get the full path to the enhanced prompt file"""
        return self.prompt_dir / self.enhanced_prompt_file
    
    @property
    def fallback_prompt_path(self) -> Path:
        """Get the full path to the fallback prompt file"""
        return self.prompt_dir / self.fallback_prompt_file
    
    def validate_paths(self) -> bool:
        """Validate that required paths exist"""
        required_paths = [self.prompt_dir, self.docs_dir]
        
        for path in required_paths:
            if not path.exists():
                path.mkdir(parents=True, exist_ok=True)
        
        return True
    
    def get_openai_config(self) -> dict:
        """Get OpenAI configuration as a dictionary"""
        return {
            "model": self.openai_model,
            "temperature": self.openai_temperature,
            "openai_api_key": self.openai_api_key,
            "request_timeout": self.openai_timeout,
            "max_tokens": self.openai_max_tokens
        }
    
    def get_cors_config(self) -> dict:
        """Get CORS configuration as a dictionary"""
        return {
            "allow_origins": self.cors_origins,
            "allow_credentials": self.cors_allow_credentials,
            "allow_methods": self.cors_allow_methods,
            "allow_headers": self.cors_allow_headers
        }


# Global settings instance
settings = Settings() 