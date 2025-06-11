# *Are-u-Queryous?* — Database Schema & Migrations

This module defines the complete **relational database schema** for the Are U Query-ous platform, designed to support geospatial visualization, comparative urban analysis, and multi-level filtering of open data across cities.

It includes:

- The full schema structure (`schema.sql`)
- Initial seed data (`seed.sql`)
- A database reset utility (`reset_db.sql`)
- Versioned migrations (`migrations/`)
- This documentation file (`README.md`)

## Contents

| File/Folder         | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `schema.sql`        | Consolidated SQL schema — full database structure at current state          |
| `migrations/`       | Versioned SQL migration files applied in order                              |
| `seed.sql`          | Optional test dataset for local development and demo purposes               |
| `reset_db.sql`      | Utility script to reset the database state while preserving PostGIS system tables |
| `README.md`         | This documentation file                                                     |

## Database Requirements

- **PostgreSQL** ≥ 13  
- **PostGIS** ≥ 3.0 (for geospatial features)

If you're using [Supabase](https://supabase.com/), these extensions are available by default.

## Quickstart

### 1. Create your database

You can use Supabase, Docker, or a local PostgreSQL instance. However, Supabase is recommended for seamless integration with the Frontend.

```bash
createdb areuqueryous
```

### 2. Run the schema

```bash
psql -U postgres -d areuqueryous -f schema.sql
```

### 3. (Optional but required for the ETL) Insert seed data

```bash
psql -U postgres -d areuqueryous -f seed.sql
```

### 4. (Optional) Reset the database

If you need to start fresh, you can use the reset script:

```bash
psql -U postgres -d areuqueryous -f reset_db.sql
```

## Database Structure (Overview)

- **cities**: List of supported cities
- **districts**, **neighborhoods**: Administrative levels with demographic + economic data
- **geographical\_levels**: Defines the hierarchy (city, district, neighborhood)
- **indicator\_definitions**, **indicators**: Describes and stores dynamic metrics
- **feature\_definitions**, **point\_features**: Describes point-of-interest features in the city
- **geometry columns**: PostGIS-enabled geometries used for GeoJSON APIs

## Dev Tips

- You can use [pgAdmin](https://www.pgadmin.org/) or Supabase Studio to inspect the database visually.
- All GeoJSON-compatible geometry columns follow PostGIS standards and can be queried directly via API.
- Use `reset_db.sql` to clean the database while preserving PostGIS system tables and extensions.

## Versioning & Maintenance

If new changes to the schema are needed:

1. Update the `schema.sql` file with the new changes
2. Test the changes locally
3. Document any breaking changes in the README

## Migrations

This project uses a folder-based migration system to version the database schema over time.

All migration scripts are stored in the `migrations/` directory and are executed sequentially. Each file is prefixed with a numeric identifier and describes a specific change in the schema, views, permissions, or RLS policies.

### Migration Workflow

1. To reset and reapply the database from scratch:

```bash
make reset-and-migrate-db
```

This command runs `reset_db.sql`, then applies all SQL files in `migrations/` in order, and finally loads optional seed data.

2. To add a new change:

- Create a new file in `migrations/` with a sequential prefix (e.g., `007_add_new_table.sql`)
- Describe the purpose in a comment header
- Commit the file with a descriptive message

> The file `schema.sql` is a read-only snapshot of the current full database structure and should be regenerated (e.g. via `pg_dump -s`) after any major migration.

### Folder Structure

```bash
auq_database/
├── migrations/
│   ├── 001_init_extensions_and_tables.sql
│   ├── 002_views.sql
│   ├── 003_functions.sql
│   └── ...
├── schema.sql
├── seed.sql
├── reset_db.sql
```

## License & Ownership

All code and scripts in this repository are released under the [MIT License](./LICENSE).
You are free to use, modify, and distribute them with proper attribution.
