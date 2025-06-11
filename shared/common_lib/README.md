# *Are-u-Queryous?* - Emoji Logger

A lightweight emoji-enhanced logging utility for ETL pipelines and data scripts.

## ✨ Overview

`common_lib.emoji_logger` provides a set of simple functions for printing log messages with visual emoji prefixes to distinguish log levels. It's especially useful in CLI tools, ETL workflows, and data processing pipelines where quick visual feedback improves clarity.

Each log message automatically includes the caller's filename and log level for easier debugging.

## 🔧 Log Levels Supported

| Function  | Emoji | Description                        |
|-----------|-------|------------------------------------|
| `info()`     | 📊    | General process updates           |
| `success()`  | ✅    | Completed steps or milestones     |
| `warning()`  | ⚠️    | Non-critical warnings             |
| `error()`    | ❗    | Errors or execution failures      |
| `debug()`    | 🐞    | Developer-level debug logs        |

## 🚀 Example Usage

```python
from common_lib import emoji_logger as log

log.info("Starting ETL process")
log.success("Data successfully loaded")
log.warning("Missing values found in column 'age'")
log.error("Failed to write to database")
log.debug("Current record ID: 12345")
```

Example output:

```bash
📊 [main.py - info] Starting ETL process
✅ [main.py - success] Data successfully loaded
⚠️ [main.py - warning] Missing values found in column 'age'
❗ [main.py - error] Failed to write to database
🐞 [main.py - debug] Current record ID: 12345
```

## License & Ownership

All code and scripts in this repository are released under the [MIT License](./LICENSE).  
You are free to use, modify, and distribute them with proper attribution.
