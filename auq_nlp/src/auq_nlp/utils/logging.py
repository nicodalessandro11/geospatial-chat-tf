"""
Logging utilities for AUQ NLP

Provides centralized logging configuration and emoji-enhanced loggers.
"""

import logging
import sys
from typing import Optional
from ..core.config import settings


class EmojiFormatter(logging.Formatter):
    """Custom formatter that adds emojis to log levels"""
    
    EMOJI_MAP = {
        'DEBUG': '🔍',
        'INFO': '💡',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'CRITICAL': '🚨'
    }
    
    def format(self, record):
        # Add emoji to the log level
        emoji = self.EMOJI_MAP.get(record.levelname, '📝')
        record.emoji = emoji
        
        # Format the message
        formatted = super().format(record)
        return f"{emoji} {formatted}"


def setup_logging(
    level: Optional[str] = None,
    format_string: Optional[str] = None,
    use_emoji: bool = True
) -> None:
    """
    Setup application logging configuration
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_string: Custom format string
        use_emoji: Whether to use emoji formatter
    """
    log_level = level or settings.log_level
    log_format = format_string or settings.log_format
    
    # Convert string level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Create formatter
    if use_emoji:
        formatter = EmojiFormatter(log_format)
    else:
        formatter = logging.Formatter(log_format)
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    
    # Add handler to root logger
    root_logger.addHandler(console_handler)
    
    # Set specific loggers to appropriate levels
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given name
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Convenience functions with emojis (for backward compatibility)
def info(message: str, logger_name: str = "auq_nlp") -> None:
    """Log info message with emoji"""
    logger = get_logger(logger_name)
    logger.info(message)


def success(message: str, logger_name: str = "auq_nlp") -> None:
    """Log success message (as info with special emoji)"""
    logger = get_logger(logger_name)
    logger.info(f"✅ {message}")


def warning(message: str, logger_name: str = "auq_nlp") -> None:
    """Log warning message with emoji"""
    logger = get_logger(logger_name)
    logger.warning(message)


def error(message: str, logger_name: str = "auq_nlp") -> None:
    """Log error message with emoji"""
    logger = get_logger(logger_name)
    logger.error(message) 