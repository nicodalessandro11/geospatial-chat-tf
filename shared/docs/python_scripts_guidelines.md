# *Are-u-Queryous?* - Python Script Standards & Best Practices

This document defines the professional standards for **all Python scripts** within the `uoc-tfg-auq` project — including ETL pipelines, utilities, analysis modules, CLI tools, and integrations. These guidelines ensure consistency, testability, and maintainability across the codebase.

## Required Components in Every Python Script

### 1. Module-Level Docstring

Each script must begin with a docstring that includes:

* Script name and purpose
* Input/output description or behavior summary
* Author name
* Email
* Date
* Version
* License

```python
"""
Script: [Name or purpose]

- Brief description of what this script does
- Expected inputs and outputs (CLI args, files, API)
- Integration context or how it's used in the project

Author: [Your Name]
Email: [Your Email]
Date: [YYYY-MM-DD]
Version: [Script Version]
License: MIT License
"""
```

### 2. Configuration Block (Constants)

Scripts must define constants near the top:

* For file names, paths, IDs, or API endpoints
* Ensure `BASE_DIR` is computed from `__file__` for portability

```python
from pathlib import Path

INPUT_URL = "https://.../districts.json"
CITY_ID = 1
OUTPUT_FILENAME = "insert_ready_districts_bcn.json"

BASE_DIR = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT_PATH = BASE_DIR / "data/processed" / OUTPUT_FILENAME
```

### 3. Logging with `shared.emoji_logger`

All scripts must use the standard logging interface:

```python
from shared.emoji_logger import info, success, warning, error
```

Example usage:

```python
info("Starting processing...")
success("Operation completed.")
warning("Invalid entry skipped.")
error("Failed to connect to Supabase.")
```

### 4. Error Handling

Use `try/except` around risky operations to:

* Catch I/O or network errors
* Handle unexpected input values or formats
* Log the issue and allow the script to continue or exit gracefully

### 5. Main Function (`run()` or equivalent)

Each script should expose a single callable `run()` function (or another clearly named entry point):

```python
def run(input_url: str = INPUT_URL, output_path: Path = DEFAULT_OUTPUT_PATH, city_id: int = CITY_ID) -> None:
    ...
```

This promotes:

* Reusability in tests or pipelines
* Clear separation between logic and CLI

### 6. Validation (When Applicable)

For scripts handling spatial or structured data, perform validation steps (e.g. WKT parsing with `shapely`):

```python
from shapely import wkt
_ = wkt.loads(wkt_geom)  # raise exception on invalid input
```

Catch parsing or logic errors and log them.

### 7. Output Format

If the script writes output, use clear formatting and encoding (e.g. JSON):

```python
import json

with output_path.open("w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
```

### 8. Summary Logging

At the end, log summary information relevant to the script:

* Record counts processed/skipped
* Operation durations (if applicable)
* Paths written to, etc.

### 9. CLI Fallback (`__main__` with `argparse`)

All scripts should support direct execution with arguments:

```python
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Describe what this script does.")
    parser.add_argument("--input_url", type=str, default=INPUT_URL)
    parser.add_argument("--output_path", type=str, default=str(DEFAULT_OUTPUT_PATH))
    parser.add_argument("--city_id", type=int, default=CITY_ID)

    args = parser.parse_args()
    run(input_url=args.input_url, output_path=Path(args.output_path), city_id=args.city_id)
```

Customize flags based on your script's purpose.

## ✅ Summary Checklist

| Component                 | Required | Notes                                     |
| ------------------------- | -------- | ----------------------------------------- |
| Module docstring          | ✅        | Includes metadata and license             |
| Constant config block     | ✅        | For paths, filenames, IDs                 |
| Emoji logger usage        | ✅        | For consistent, expressive logs           |
| Main callable function    | ✅        | `run()` or equivalent                     |
| Error handling            | ✅        | `try/except` for critical ops             |
| Data validation (if any)  | ✅        | Required for input-heavy scripts          |
| Output formatting         | ✅        | Preferably JSON, with encoding            |
| Summary logging           | ✅        | Totals, paths, errors                     |
| Optional CLI (`argparse`) | ✅        | Enables flexible script reuse and testing |

## Why This Matters

Following this standard ensures that Python scripts:

* Can be tested independently and reused programmatically
* Integrate cleanly into data pipelines, CLI tools, or scheduled jobs
* Are easier to debug, review, and maintain — for yourself and teammates

## License & Ownership

All code and scripts in this repository are released under the [MIT License](../LICENSE).  
You are free to use, modify, and distribute them with proper attribution.
