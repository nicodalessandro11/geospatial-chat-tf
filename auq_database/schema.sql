-- ====================================
-- Description: This SQL script sets up the database schema for the AUQ application.
-- Author: Nico D'Alessandro Calderon
-- Email: nicodalessandro11@gmail.com
-- Date: 2025-06-02
-- Version: 1.16.0
-- License: MIT License
-- ====================================

-- === Database Setup ===
-- This script is designed to be run in a PostgreSQL database with PostGIS extension enabled.
-- Note: PostGIS extension must be enabled in Supabase dashboard first
-- Database -> Extensions -> PostGIS

-- Set search path to include public schema
SET search_path TO public;

-- === 1. Extensions ===
-- Ensure PostGIS extension is enabled (do not drop it to avoid losing system tables)
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;

-- === 2. Tables ===
-- === Table: cities ===
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === Table: geographical_levels ===
CREATE TABLE geographical_levels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === Table: districts ===
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    district_code INTEGER NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    geom GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, district_code),
    UNIQUE(city_id, name)
);

-- === Table: neighbourhoods ===
CREATE TABLE neighbourhoods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    neighbourhood_code INTEGER NOT NULL,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    geom GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, neighbourhood_code),
    UNIQUE(district_id, name)
);

-- === Table: indicator_definitions ===
CREATE TABLE indicator_definitions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    unit TEXT,
    description TEXT,
    category TEXT,
    source JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === Table: indicators ===
CREATE TABLE indicators (
    id SERIAL PRIMARY KEY,
    indicator_def_id INTEGER REFERENCES indicator_definitions(id) ON DELETE CASCADE,
    geo_level_id INTEGER REFERENCES geographical_levels(id),
    geo_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    value NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indicator_def_id, geo_level_id, geo_id, city_id, year)
);

-- === Table: feature_definitions ===
CREATE TABLE feature_definitions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === Table: point_features ===
CREATE TABLE point_features (
    id SERIAL PRIMARY KEY,
    feature_definition_id INTEGER REFERENCES feature_definitions(id) ON DELETE SET NULL,
    name TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    geom GEOMETRY(POINT, 4326),
    geo_level_id INTEGER REFERENCES geographical_levels(id),
    geo_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_definition_id, ROUND(latitude::numeric, 6), ROUND(longitude::numeric, 6), city_id)
);

-- === Table: user_events ===
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- === Table: user_config ===
CREATE TABLE user_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    custom_features JSONB,
    custom_indicators JSONB,
    other_prefs JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === Table: profiles ===
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === 3. Indexes ===
CREATE INDEX idx_indicators_geo ON indicators (geo_level_id, geo_id);
CREATE INDEX idx_indicators_city ON indicators (city_id);
CREATE INDEX idx_point_features_geo ON point_features (geo_level_id, geo_id);
CREATE INDEX idx_point_features_definition ON point_features (feature_definition_id);
CREATE INDEX idx_point_features_city ON point_features (city_id);
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_created_at ON user_events(created_at);

-- === 4. Views ===
-- === View: geographical_unit_view ===
CREATE OR REPLACE VIEW geographical_unit_view WITH (security_invoker = on) AS
SELECT 1 AS geo_level_id, c.id AS geo_id, c.name, NULL::INTEGER AS code, NULL::INTEGER AS parent_id, c.id AS city_id, c.created_at, c.updated_at
FROM cities c
UNION ALL
SELECT 2, d.id, d.name, d.district_code, d.city_id, d.city_id, d.created_at, d.updated_at
FROM districts d
UNION ALL
SELECT 3, n.id, n.name, n.neighbourhood_code, n.district_id, n.city_id, n.created_at, n.updated_at
FROM neighbourhoods n;

-- === View: district_polygons_view ===
CREATE OR REPLACE VIEW district_polygons_view AS
SELECT id, name, district_code, city_id, ST_AsGeoJSON(geom)::json AS geometry
FROM districts;

-- === View: neighborhood_polygons_view ===
CREATE OR REPLACE VIEW neighborhood_polygons_view AS
SELECT id, name, neighbourhood_code, district_id, city_id, ST_AsGeoJSON(geom)::json AS geometry
FROM neighbourhoods;

-- === View: current_indicators_view ===
CREATE OR REPLACE VIEW current_indicators_view AS
WITH latest_years AS (
  SELECT
    indicator_def_id,
    city_id,
    MAX(year) AS latest_year
  FROM indicators
  GROUP BY indicator_def_id, city_id
),
base AS (
  SELECT
    i.indicator_def_id,
    i.geo_id,
    i.year,
    i.value,
    i.geo_level_id,
    i.city_id,
    id.name AS indicator_name,
    id.unit,
    id.category
  FROM indicators i
  JOIN indicator_definitions id ON i.indicator_def_id = id.id
  JOIN latest_years ly ON
    i.indicator_def_id = ly.indicator_def_id AND
    i.city_id = ly.city_id AND
    i.year = ly.latest_year
),
neighborhood_values AS (
  SELECT 
    b.*,
    n.name AS area_name,
    n.district_id
  FROM base b
  JOIN neighbourhoods n ON b.geo_id = n.id
  WHERE b.geo_level_id = 3
),
district_values AS (
  SELECT 
    b.*,
    d.name AS area_name,
    NULL AS district_id
  FROM base b
  JOIN districts d ON b.geo_level_id = 2 AND b.geo_id = d.id

  UNION ALL

  SELECT
    nv.indicator_def_id,
    nv.district_id AS geo_id,
    nv.year,
    CASE 
      WHEN nv.indicator_name IN ('Population', 'Surface') THEN SUM(nv.value)
      ELSE AVG(nv.value)
    END AS value,
    2 AS geo_level_id,
    nv.city_id,
    nv.indicator_name,
    nv.unit,
    nv.category,
    d.name AS area_name,
    NULL AS district_id
  FROM neighborhood_values nv
  JOIN districts d ON nv.district_id = d.id
  WHERE NOT EXISTS (
    SELECT 1 FROM base b2
    WHERE b2.geo_level_id = 2
      AND b2.indicator_def_id = nv.indicator_def_id
      AND b2.city_id = nv.city_id
      AND b2.year = nv.year
  )
  GROUP BY
    nv.indicator_def_id, nv.district_id, nv.year, nv.indicator_name,
    nv.unit, nv.category, d.name, nv.city_id
),
city_values AS (
  SELECT 
    b.*,
    c.name AS area_name,
    NULL AS district_id
  FROM base b
  JOIN cities c ON b.geo_level_id = 1 AND b.geo_id = c.id

  UNION ALL

  SELECT
    dv.indicator_def_id,
    dv.city_id AS geo_id,
    dv.year,
    CASE 
      WHEN dv.indicator_name IN ('Population', 'Surface') THEN SUM(dv.value)
      ELSE AVG(dv.value)
    END AS value,
    1 AS geo_level_id,
    dv.city_id,
    dv.indicator_name,
    dv.unit,
    dv.category,
    c.name AS area_name,
    NULL AS district_id
  FROM district_values dv
  JOIN cities c ON dv.city_id = c.id
  WHERE NOT EXISTS (
    SELECT 1 FROM base b2
    WHERE b2.geo_level_id = 1
      AND b2.indicator_def_id = dv.indicator_def_id
      AND b2.city_id = dv.city_id
      AND b2.year = dv.year
  )
  GROUP BY
    dv.indicator_def_id, dv.city_id, dv.year, dv.indicator_name,
    dv.unit, dv.category, c.name
)

-- Final SELECT
SELECT 
  'neighborhood' AS level,
  indicator_def_id, geo_id, year, value, indicator_name,
  unit, category, area_name, 3 AS geo_level_id, city_id
FROM neighborhood_values

UNION ALL

SELECT 
  'district' AS level,
  indicator_def_id, geo_id, year, value, indicator_name,
  unit, category, area_name, 2 AS geo_level_id, city_id
FROM district_values

UNION ALL

SELECT 
  'city' AS level,
  indicator_def_id, geo_id, year, value, indicator_name,
  unit, category, area_name, 1 AS geo_level_id, city_id
FROM city_values;

-- === View: time_series_indicators_view ===
CREATE OR REPLACE VIEW time_series_indicators_view AS
WITH base AS (
  SELECT
    i.indicator_def_id,
    i.geo_id,
    i.year,
    i.value,
    i.geo_level_id,
    i.city_id,
    id.name AS indicator_name,
    id.unit,
    id.category
  FROM indicators i
  JOIN indicator_definitions id ON i.indicator_def_id = id.id
),
neighborhood_values AS (
  SELECT 
    b.*,
    n.name AS area_name,
    n.district_id
  FROM base b
  JOIN neighbourhoods n ON b.geo_id = n.id
  WHERE b.geo_level_id = 3
),
district_values AS (
  SELECT 
    b.*,
    d.name AS area_name,
    NULL AS district_id
  FROM base b
  JOIN districts d ON b.geo_level_id = 2 AND b.geo_id = d.id

  UNION ALL

  SELECT
    nv.indicator_def_id,
    nv.district_id AS geo_id,
    nv.year,
    CASE 
      WHEN nv.indicator_name IN ('Population', 'Surface') THEN SUM(nv.value)
      ELSE AVG(nv.value)
    END AS value,
    2 AS geo_level_id,
    nv.city_id,
    nv.indicator_name,
    nv.unit,
    nv.category,
    d.name AS area_name,
    NULL AS district_id
  FROM neighborhood_values nv
  JOIN districts d ON nv.district_id = d.id
  WHERE NOT EXISTS (
    SELECT 1 FROM base b2
    WHERE b2.geo_level_id = 2
      AND b2.indicator_def_id = nv.indicator_def_id
      AND b2.city_id = nv.city_id
      AND b2.year = nv.year
  )
  GROUP BY
    nv.indicator_def_id, nv.district_id, nv.year, nv.indicator_name,
    nv.unit, nv.category, d.name, nv.city_id
),
city_values AS (
  SELECT 
    b.*,
    c.name AS area_name,
    NULL AS district_id
  FROM base b
  JOIN cities c ON b.geo_level_id = 1 AND b.geo_id = c.id

  UNION ALL

  SELECT
    dv.indicator_def_id,
    dv.city_id AS geo_id,
    dv.year,
    CASE 
      WHEN dv.indicator_name IN ('Population', 'Surface') THEN SUM(dv.value)
      ELSE AVG(dv.value)
    END AS value,
    1 AS geo_level_id,
    dv.city_id,
    dv.indicator_name,
    dv.unit,
    dv.category,
    c.name AS area_name,
    NULL AS district_id
  FROM district_values dv
  JOIN cities c ON dv.city_id = c.id
  WHERE NOT EXISTS (
    SELECT 1 FROM base b2
    WHERE b2.geo_level_id = 1
      AND b2.indicator_def_id = dv.indicator_def_id
      AND b2.city_id = dv.city_id
      AND b2.year = dv.year
  )
  GROUP BY
    dv.indicator_def_id, dv.city_id, dv.year, dv.indicator_name,
    dv.unit, dv.category, c.name
)

-- Final SELECT
SELECT 
  'neighborhood' AS level,
  indicator_def_id, geo_id, year, value, indicator_name,
  unit, category, area_name, 3 AS geo_level_id, city_id
FROM neighborhood_values

UNION ALL

SELECT 
  'district' AS level,
  indicator_def_id, geo_id, year, value, indicator_name,
  unit, category, area_name, 2 AS geo_level_id, city_id
FROM district_values

UNION ALL

SELECT 
  'city' AS level,
  indicator_def_id, geo_id, year, value, indicator_name,
  unit, category, area_name, 1 AS geo_level_id, city_id
FROM city_values;

-- === 5. Functions ===
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, is_admin, created_at)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', false, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute dynamic SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- === 6. Triggers ===
-- Trigger for creating profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- === 7. Row-Level Security (RLS) ===
-- Enable RLS on all tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbourhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographical_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- === 8. RLS Policies ===
-- Service role policies
CREATE POLICY "Service role access on cities" ON cities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on districts" ON districts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on neighbourhoods" ON neighbourhoods FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on geographical_levels" ON geographical_levels FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on indicator_definitions" ON indicator_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on indicators" ON indicators FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on feature_definitions" ON feature_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on point_features" ON point_features FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on user_events" ON user_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on user_config" ON user_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read policies
CREATE POLICY "Anon read: cities" ON cities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: districts" ON districts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: neighbourhoods" ON neighbourhoods FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: geographical_levels" ON geographical_levels FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: indicator_definitions" ON indicator_definitions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: indicators" ON indicators FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: feature_definitions" ON feature_definitions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: point_features" ON point_features FOR SELECT TO anon USING (true);

-- User events policies
CREATE POLICY "Authenticated users can insert their own events" ON user_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authenticated users can select their own events" ON user_events FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User config policies
CREATE POLICY "Authenticated users can select their own config" ON user_config FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert their own config" ON user_config FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authenticated users can update their own config" ON user_config FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated read: feature_definitions" ON feature_definitions FOR SELECT TO authenticated USING (true);

-- Profile policies
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated read: indicator_definitions" ON indicator_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: indicators" ON indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: cities" ON cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: districts" ON districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: neighbourhoods" ON neighbourhoods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: point_features" ON point_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: geographical_levels" ON geographical_levels FOR SELECT TO authenticated USING (true);

-- === 9. Permissions ===
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant INSERT on selected tables
GRANT INSERT ON cities TO service_role;
GRANT INSERT ON districts TO service_role;
GRANT INSERT ON neighbourhoods TO service_role;
GRANT INSERT ON point_features TO service_role;
GRANT INSERT ON feature_definitions TO service_role;
GRANT INSERT ON indicator_definitions TO service_role;
GRANT INSERT ON indicators TO service_role;
GRANT INSERT ON user_events TO service_role;
GRANT INSERT ON user_config TO service_role;
GRANT INSERT ON profiles TO service_role;

-- Grant INSERT/UPDATE on user tables
GRANT INSERT, UPDATE ON user_events TO authenticated;
GRANT INSERT, UPDATE ON user_config TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to views
GRANT SELECT ON geographical_unit_view TO anon;
GRANT SELECT ON district_polygons_view TO anon;
GRANT SELECT ON neighborhood_polygons_view TO anon;
GRANT SELECT ON current_indicators_view TO anon;
GRANT SELECT ON time_series_indicators_view TO anon;
GRANT SELECT ON time_series_indicators_view TO authenticated;
GRANT SELECT ON time_series_indicators_view TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;