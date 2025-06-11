# *Are-u-Queryous?* — Shared Utilities

This module provides **reusable libraries, scripts, and documentation** shared across the monorepo. It enables consistency, code reuse, and tooling across the data engine, frontend, and backend.

## Structure

```bash
shared/
├── common_lib/                 # Reusable Python library (importable via PYTHONPATH)
│   ├── emoji_logger.py         # Standardized CLI logging with emoji-enhanced output
│   ├── __init__.py
│   ├── LICENSE
│   ├── pyproject.toml          # Optional config for tools or packaging
│   └── README.md               # Documentation for the library
│
├── docs/                       # Markdown documentation used by the team
│   ├── commit_template.md      # Git commit format for all modules
│   └── python_scripts_guidelines.md  # Guidelines for writing Python scripts
│
├── scripts/                    # CLI automation tools using GPT/OpenAI API
│   ├── data/                   # Input/output artifacts used by scripts
│   ├── generate_changelog.py   # Generate `CHANGELOG.md` from git history or project notes
│   ├── git_commit_message_generator.py  # GPT-powered generator for commit messages
│   ├── test_supabase_connection.py      # Test Supabase connection and configuration
│   └── __init__.py
│
├── .env.example                # Example env file for central repo (used by Python scripts)
├── .env.local.example          # Example env file for the frontend (Next.js config)
├── LICENSE                     # MIT License
└── README.md                   # You're reading it
```

## How to Use

### Import the Shared Python Library

If you're using scripts or ETL modules:

```bash
# Add this in your Makefile or CLI session:
export PYTHONPATH=shared

# Then you can import like:
from common_lib.emoji_logger import info, success, error
```

## GPT Automation Scripts

These scripts require an OpenAI API key. Copy `.env.example` to the root:

```bash
cp shared/.env.example .env
```

Add your key:

```bash
OPENAI_API_KEY=sk-...
```

> Note: The `.env` file is used for the **central repo** (ETL, automation scripts). The **frontend** uses its own `.env.local` file and does not rely on this one.

Then run:

```bash
# Generate clean changelogs from history
python -m shared.scripts.generate_changelog

# Generate professional commit messages from staged files
python -m shared.scripts.git_commit_message_generator

# Test Supabase connection and configuration
python -m shared.scripts.test_supabase_connection
```

## Docs Included

* [`commit_template.md`](docs/commit_template.md) — Emoji-based Git log style for all contributors
* [`python_scripts_guidelines.md`](docs/python_scripts_guidelines.md) — Standard for all internal Python ETL/utility scripts

## Notes

* Scripts in `scripts/` are executable independently, but rely on utilities from `common_lib/`.
* You can expand this module with additional shared utilities: path handling, Supabase wrappers, etc.

## License & Ownership

All code and scripts in this repository are released under the [MIT License](./LICENSE).  
You are free to use, modify, and distribute them with proper attribution.
