# *Are-u-Queryous?* — Data Engine Service

This document outlines the ETL pipeline for integrating and uploading urban geospatial datasets into Supabase. The system supports multiple cities (e.g., Barcelona, Madrid) and handles various dataset types (districts, neighbourhoods, point features, indicators) through city-specific API integrations.

## City-Specific API Integration

Each city has its own API implementation:

### Barcelona

- Uses the Barcelona Open Data API (`opendata-ajuntament.barcelona.cat`)
- Implements SQL-based queries for data extraction
- Features include:
  - Playgrounds, Libraries, Museums
  - Sports facilities, Parks and gardens
  - Cultural venues (Theaters, Cinemas)
  - Educational institutions

### Madrid

- Uses Madrid's Open Data API
- Implements REST-based data extraction
- Features include:
  - Parks and gardens
  - Museums and cultural centers
  - Health facilities
  - Educational centers
  - Libraries

## Standard ETL Flow

Each dataset follows this 3-phase process:

1. **Extract**: Data is fetched from city-specific APIs using dedicated API clients
2. **Transform**: Data is cleaned, validated, and formatted according to standardized schemas
3. **Load**: The final dataset is uploaded to Supabase

## Execution Flow (Orchestration)

All processes are orchestrated via:

```bash
main.py
```

This script runs in this exact order:

1. **District ETLs**
2. **Neighbourhood ETLs**
3. **Run validation tests**
4. **Point Feature ETLs**
5. **Indicator ETLs**

Uploads to Supabase only happen if validations pass (`pytest`).

## Project Structure

```bash
auq_data_engine/
├── data/                             # Processed datasets and API manifests
│   └── processed/                    # Cleaned & formatted datasets
│
├── barcelona/                        # Barcelona-specific ETL scripts
│   ├── api_client.py                 # Barcelona Open Data API client
│   ├── load_districts.py
│   ├── load_neighbourhoods.py
│   ├── load_point_features.py
│   ├── load_indicators.py
│   └── __init__.py
│
├── madrid/                           # Madrid-specific ETL scripts
│   ├── api_client.py                 # Madrid Open Data API client
│   ├── load_districts.py
│   ├── load_neighbourhoods.py
│   ├── load_point_features.py
│   ├── load_indicators.py
│   └── __init__.py
│
├── upload/                           # Supabase upload utilities
│   └── upload_to_supabase.py
│
├── tests/                            # Pytest validation rules
│   └── test_base_data_upload.py
│
├── main.py                           # Main orchestrator
├── pyproject.toml                    # Project configuration
└── __init__.py                       # Package initialization
```

## API Integration Details

### Barcelona API

- Uses SQL-based queries for precise data filtering
- Implements retry mechanism with exponential backoff
- Handles rate limiting and timeout scenarios
- Supports multiple feature types through SQL filters

### Madrid API

- Uses REST endpoints for data extraction
- Implements custom area code mapping for location data
- Handles multiple data formats (JSON, XML)
- Supports various feature categories through dedicated processors

## API Client Implementations

Each city has its own dedicated API client implementation that handles data retrieval and processing:

### Barcelona API Client (`barcelona/api_client.py`)

The Barcelona API client is designed to work with the CKAN-based Open Data API:

- **Base URL**: `https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search`
- **Key Features**:
  - Pagination support with configurable limit (default: 1000 records)
  - Automatic handling of large datasets through offset-based pagination
  - Support for both JSON and CSV output formats
  - Built-in error handling and logging
  - Data validation before saving

Example usage:

```python
from barcelona.api_client import run

# Fetch data and save as JSON
run(
    resource_id="your-resource-id",
    output_path="path/to/output.json",
    output_format="json"
)
```

### Madrid API Client (`madrid/api_client.py`)

The Madrid API client interfaces with Madrid's Open Data API:

- **Base URL**: `https://datos.madrid.es/egob/catalogo/`
- **Key Features**:
  - Automatic format detection (JSON/CSV) based on endpoint
  - Direct DataFrame conversion for CSV responses
  - UTF-8 encoding support
  - Comprehensive error handling
  - Simple endpoint-based data retrieval

Example usage:

```python
from madrid.api_client import run

# Fetch data from endpoint
data = run("your-endpoint.json")  # or .csv
```

Both clients implement:

- Robust error handling
- Logging with emoji indicators for better visibility
- Type hints for better code maintainability
- Command-line interface for direct usage
- Consistent return types (DataFrame or Dict)

## Benefits of This Structure

- **Modular**: Add cities or datasets without breaking existing logic
- **Safe**: Uploads only proceed after passing validation
- **Scalable**: Easily extendable with new dataset types and API integrations
- **Consistent**: Standardized data format across different city APIs
- **Reliable**: Built-in error handling and retry mechanisms

## Naming Conventions

- `load_[dataset].py` → contains `run()` for that dataset
- `insert_ready_[dataset]_[city].json` → processed file for upload
- `[city]-[dataset].json` → original file hosted on Supabase

## Validation

Each processed dataset is tested against:

- Geometry structure match
- Record counts
- Join validity (e.g. neighbourhoods with valid district IDs)
- API response format validation
- Data type consistency

Tests are written using `pytest`.

## Technologies

| Tool          | Purpose                    |
|---------------|----------------------------|
| **Pandas**    | Data wrangling             |
| **GeoPandas** | Geometry + GeoJSON parsing |
| **Shapely**   | Geometry objects           |
| **Supabase**  | Cloud DB for open data     |
| **pytest**    | Dataset validations        |
| **Requests**  | API client                 |

## GitHub Actions Automation

The ETL pipeline is automated using GitHub Actions. The workflow:

1. Runs daily at 00:00 UTC
2. Can be triggered manually from the Actions tab
3. Runs automatically on pushes to main branch

### Setup Requirements

1. Add these secrets to your GitHub repository:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key

2. The workflow will:
   - Set up Python 3.11 environment
   - Install system dependencies (libgeos-dev)
   - Install Python packages
   - Run the ETL pipeline
   - Execute tests
   - Report success/failure

### Manual Trigger

To run the pipeline manually:

1. Go to the repository's "Actions" tab
2. Select "ETL Pipeline" workflow
3. Click "Run workflow"

### Monitoring

- Check the Actions tab for workflow runs
- View logs for each step
- Get notifications on failures

## Running the Engine

The AUQ Data Engine can be run in two ways:

### 1. Run with Python (Manual)

Run the full ETL process: extract, transform, test, and upload:

```bash
PYTHONPATH=shared python -m auq_data_engine.main
```

Testing and skip the upload step:

```bash
PYTHONPATH=shared python -m auq_data_engine.main --skip-upload
```

### 2. Run with the Makefile (Recommended)

Run full engine:

```bash
make run-engine
```

Run without upload:

```bash
make run-engine-dev
```

## License & Ownership

All code and scripts in this repository are released under the [MIT License](./LICENSE).  
You are free to use, modify, and distribute them with proper attribution.

### Datasets Licensing

> Most datasets are under:

- **Barcelona** → [CC BY 4.0](https://opendata-ajuntament.barcelona.cat/)
- **Madrid** → Open Municipal License

Always retain attribution when visualizing or sharing.
