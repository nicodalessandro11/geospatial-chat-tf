"""
emoji_logger.py

A lightweight emoji-enhanced logging utility for ETL pipelines and data scripts.

Provides a set of simple functions for printing log messages with visual emoji
prefixes to distinguish log levels. Useful for CLI tools, ETL tasks, and debugging
in a clear and friendly format.

Log levels supported:
- 📊 info()     – General process updates
- ✅ success()  – Completed steps or milestones
- ⚠️ warning()  – Non-critical warnings or skipped items
- ❗ error()    – Errors or failures in execution
- 🐞 debug()    – Detailed developer logs (for debugging only)

Each log line includes the file name and level for easier debugging:
📊 [main.py - info] Starting ETL process

Author: Nicolas D'Alessandro
Email: Nicodalessandro11@gmail.com
"""

import inspect
from pathlib import Path

def _get_caller():
    """Helper to retrieve the filename of the caller."""
    frame = inspect.stack()[2]
    filepath = frame.filename
    return Path(filepath).name

def info(message: str):
    """Prints an informational message prefixed with 📊."""
    caller = _get_caller()
    print(f"📊 [{caller} - info] {message}")

def success(message: str):
    """Prints a success message prefixed with ✅."""
    caller = _get_caller()
    print(f"✅ [{caller} - success] {message}")

def warning(message: str):
    """Prints a warning message prefixed with ⚠️."""
    caller = _get_caller()
    print(f"⚠️ [{caller} - warning] {message}")

def error(message: str):
    """Prints an error message prefixed with ❗."""
    caller = _get_caller()
    print(f"❗ [{caller} - error] {message}")

def debug(message: str):
    """Prints a debug message prefixed with 🐞."""
    caller = _get_caller()
    print(f"🐞 [{caller} - debug] {message}")
