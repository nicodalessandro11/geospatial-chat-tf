#!/usr/bin/env python3
"""
Main entry point for AUQ NLP API

This script serves as the main entry point for running the AUQ NLP API server.
It handles environment setup, configuration validation, and server startup.

Usage:
    python run.py                    # Run with default settings
    python run.py --port 8080        # Run on custom port
    python run.py --debug            # Run in debug mode
    python run.py --reload           # Run with auto-reload
"""

import argparse
import sys
import os
from pathlib import Path

# Add src to Python path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

try:
    import uvicorn
    from src.auq_nlp.api.main import app
    from src.auq_nlp.core.config import settings
    from src.auq_nlp.utils.logging import setup_logging, success, error
except ImportError as e:
    print(f"❌ Failed to import required modules: {e}")
    print("💡 Make sure you've installed the requirements: pip install -r requirements.txt")
    sys.exit(1)


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="AUQ NLP API Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py                         # Run with default settings
  python run.py --port 8080             # Run on port 8080
  python run.py --host 127.0.0.1        # Run on localhost only
  python run.py --debug --reload        # Development mode
  python run.py --log-level DEBUG       # Verbose logging
        """
    )
    
    parser.add_argument(
        "--host",
        default=settings.host,
        help=f"Host to bind to (default: {settings.host})"
    )
    
    parser.add_argument(
        "--port",
        type=int,
        default=settings.port,
        help=f"Port to bind to (default: {settings.port})"
    )
    
    parser.add_argument(
        "--reload",
        action="store_true",
        default=settings.reload,
        help="Enable auto-reload for development"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        default=settings.debug,
        help="Enable debug mode"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default=settings.log_level,
        help=f"Set log level (default: {settings.log_level})"
    )
    
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of worker processes (default: 1)"
    )
    
    return parser.parse_args()


def validate_environment():
    """Validate environment variables and configuration"""
    try:
        # Test if we can access the required settings
        _ = settings.supabase_uri
        _ = settings.openai_api_key
        
        # Validate paths
        settings.validate_paths()
        success("Configuration validation passed")
        return True
    except Exception as e:
        error(f"Configuration validation failed: {e}")
        error("Please check your .env file has SUPABASE_URI and OPENAI_API_KEY")
        return False


def print_startup_banner():
    """Print startup banner with system information"""
    banner = f"""
🌟 ═══════════════════════════════════════════════════════════════
    AUQ NLP API - Are U Query-ous Natural Language Processing
═══════════════════════════════════════════════════════════════ 🌟

📊 System Information:
   • Version: {settings.api_version}
   • OpenAI Model: {settings.openai_model}
   • Cache Enabled: {settings.cache_enabled}
   • Validation Enabled: {settings.validation_enabled}
   • Debug Mode: {settings.debug}

🌐 Server Configuration:
   • Host: {settings.host}
   • Port: {settings.port}
   • Log Level: {settings.log_level}

🚀 Starting server...
"""
    print(banner)


def main():
    """Main entry point"""
    args = parse_arguments()
    
    # Setup logging
    setup_logging(level=args.log_level)
    
    # Print banner
    print_startup_banner()
    
    # Validate environment
    if not validate_environment():
        sys.exit(1)
    
    # Update settings with command line arguments
    if args.debug:
        settings.debug = True
    
    try:
        # Start the server
        uvicorn.run(
            "src.auq_nlp.api.main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level=args.log_level.lower(),
            workers=args.workers if not args.reload else 1,
            access_log=args.debug,
            server_header=False,
            date_header=False
        )
    except KeyboardInterrupt:
        success("\n👋 AUQ NLP API server stopped gracefully")
    except Exception as e:
        error(f"Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 