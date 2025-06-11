# *Are-u-Queryous?* — Monorepo

This monorepo contains the complete codebase for the **Are-u-Queryous?** platform, a geospatial data visualization tool designed to explore, compare, and analyze open urban datasets at multiple geographical levels.Are-u-Queryous?

> Developed as part of the Universitat Oberta de Catalunya (UOC) Final Degree Project (TFG) by **Nico Dalessandro Calderon**

## Monorepo Structure

```bash
├── auq_backend/        # REST API Placeholder with Detailed Documentation
├── auq_data_engine/    # Python ETL pipeline for urban datasets 
├── auq_database/       # PostgreSQL + PostGIS schema, migrations, seed data
├── auq_frontend/       # Next.js + Leaflet frontend application (in progress)
├── auq_nlp/            # NLP module placeholder (Optional Feature not yet implemented)
├── shared/             # Common scripts, Python libs, and documentation
├── Makefile            # Automation entrypoint
└── README.md           # You’re here!
````

## Platform Overview

The system enables:

* **Interactive geospatial visualization** (districts, neighborhoods, POIs)
* **Comparative analysis** between urban zones
* **Real-time data fetching** from a PostGIS-enabled Supabase backend
* **Custom filtering** and dynamic charts
* **Modular and scalable ETL pipeline** for new cities or datasets

## Modules

### Frontend (`auq_frontend/`)

* Built with **Next.js**, **Tailwind CSS**, and **Leaflet**
* Supports:

  * Map view, compare view, visualization dashboards
  * Point features, dark mode, mobile responsiveness
  * Admin dashboard with Supabase auth
* Data can be fetched either via **Supabase** or the internal **API**

📖 [See Frontend README](./auq_frontend/README.md)

### Backend API (`auq_backend/`)

* REST API layer using Fast API for integration with Next.js API routes
* Matches frontend expectations 1:1 (format, field names)
* Features:

  * GeoJSON and tabular endpoints
  * Filtering, comparison, and indicator views
  * Caching, JWT auth, and error handling built-in

📖 [See API Design Doc](./auq_backend/api-design.md)

### Database (`auq_database/`)

* PostgreSQL + PostGIS schema optimized for:

  * Multi-city support
  * Dynamic indicators
  * GeoJSON generation
* Comes with:

  * Versioned migrations
  * Seed/test data
  * Full reset flow via `Makefile`

📖 [See Database README](./auq_database/README.md)

### Data Engine (`auq_data_engine/`)

* Python ETL system using `Pandas`, `GeoPandas`, and `Shapely`
* Orchestrates ingestion → cleaning → validation → Supabase upload
* Modular per city (`barcelona/`, `madrid/`, etc.)
* Safe: uploads only happen after tests pass

📖 [See Data Engine README](./auq_data_engine/README.md)

### Shared Utilities (`shared/`)

* Common Python libraries: emoji logging, reusable helpers
* GPT-powered scripts:

  * Changelog generator
  * Commit message generator
* Internal documentation:

  * Python scripting standards
  * Git commit format

📖  [See Shared README](./shared/README.md)

## Quickstart

### 1. Requirements

* **Node.js** v20
* **Python** 3.11
* A Supabase project with anon & service keys

> If using **GitHub Codespaces**, Python and Node are preinstalled and `venv` is not required.

### 2. Environment Setup

```bash
cp shared/.env.example .env
cp auq_frontend/.env.local.example auq_frontend/.env.local
```

Then Create a Supabase Project then add your Supabase credentials (URL, anon/public keys) to the files above (.env.example template available).

### 3. Install Dependencies

```bash
make setup-venv
make install-common-lib
make install-frontend
```

> If developing locally, it's recommended to activate your virtual environment:

```bash
source .venv/bin/activate
```

### 4. Load the Database

```bash
make reset-and-migrate-db
```

This will:

* Reset your Supabase database
* Apply migrations from `auq_database/migrations/`
* Seed the database with test data

### 5. Run the ETL Pipeline

```bash
make run-engine
```

Use `make run-engine-dev` to skip the upload step during development.

### 6. Launch the Frontend

```bash
make dev-frontend
```

Then open your browser at [http://localhost:3000](http://localhost:3000)

### 7. (Optional) Run Tests

```bash
make test
```

## Dataset Sources

* **Barcelona** → [Open Data BCN](https://opendata-ajuntament.barcelona.cat/)
* **Madrid** → [Madrid City Open Data](https://datos.madrid.es/portal/site/egob)

## Documentation Highlights

* [API Design](./auq_backend/api-design.md)
* [Python Standards](./shared/docs/python_scripts_guidelines.md)
* [Commit Template](./shared/docs/commit_template.md)
* [Changelog](./CHANGELOG.md)

## License & Attribution

All code is released under the [MIT License](./LICENSE).
Please attribute **Nico Dalessandro Calderon** and the **Are U Query-ous** project if reused.

## Acknowledgments

The project integrates real-world open data with modern geospatial web technologies to offer a scalable, interactive platform for exploring, comparing, and understanding urban environments.

It was developed as the Final Degree Project (TFG) for the **Bachelor's Degree in Techniques for Software Application Development** at the **Universitat Oberta de Catalunya (UOC)**.

It was conducted under the thematic area of **Localization-Based Systems and Intelligent Spaces**, with the following academic guidance:

* **Project Supervisor**: Dr. Joaquín Torres Sospedra
* **Coordinating Professor**: Dr. Antoni Pérez-Navarro

Special thanks to both for their continued support, feedback, and guidance throughout the development process.
