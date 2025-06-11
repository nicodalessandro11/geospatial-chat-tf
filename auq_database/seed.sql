-- ====================================
-- Description: Seed script for the initial setup of the database
-- This script populates the database with initial data for cities, geographical levels,
-- feature definitions, and indicator definitions.
-- Author: Nico D'Alessandro Calderon
-- Email: nicodalessandro11@gmail.com
-- Date: 2025-04-01
-- Version: 1.0.0
-- License: MIT License
-- ====================================

-- Insert cities
INSERT INTO cities (name) VALUES
    ('Barcelona'),
    ('Madrid');

-- Insert geographical levels
-- 1: City, 2: District, 3: Neighbourhood
INSERT INTO geographical_levels (name) VALUES
    ('City'),
    ('District'),
    ('Neighbourhood');

-- Insert feature definitions (used in point_features.feature_type_id)
INSERT INTO feature_definitions (name, description) VALUES
    ('Libraries', 'Public libraries and documentation centers'),
    ('Cultural centers', 'Athenaeums, civic centers and community cultural spaces'),
    ('Auditoriums', 'Large auditoriums and concert halls'),
    ('Heritage spaces', 'Places of historical, cultural or heritage interest'),
    ('Creation factories', 'Cultural and artistic innovation centers'),
    ('Museums', 'Museums and permanent collections'),
    ('Cinemas', 'Commercial or cultural movie theaters'),
    ('Exhibition centers', 'Spaces for artistic or thematic exhibitions'),
    ('Archives', 'Historical, district archives and heritage libraries'),
    ('Live music venues', 'Venues for concerts and musical performances'),
    ('Performing arts venues', 'Theaters and spaces for stage performances'),
    ('Municipal markets', 'Public markets for food and local products'),
    ('Parks and gardens', 'Urban green spaces including parks, gardens, and natural areas'),
    ('Educational centers', 'Schools, colleges, and other educational institutions'),
    ('Health centers', 'Health centers and hospitals'),
    ('Playgrounds', 'Outdoor areas equipped for children to play'),
    ('Time Banks', 'Community programs for exchanging services using time as currency'),
    ('Musical bars and pubs', 'Bars and pubs with live or recorded music for entertainment'),
    ('Cocktail bars', 'Venues specialized in serving cocktails and mixed drinks'),
    ('Nightclubs', 'Entertainment venues with DJs, dancing, and late-night music'),
    ('Sports facilities', 'Gyms, sports fields, courts, and athletic centers'),
    ('Karaokes', 'Venues where patrons sing along to music tracks with lyrics'),
    ('Municipal museums', 'Museums managed and operated by the local municipality'),
    ('Swimming', 'Pools and facilities for recreational or competitive swimming'),
    ('Restaurants', 'Establishments that prepare and serve meals to customers'),
    ('Theaters', 'Buildings or venues for dramatic or musical performances'),
    ('Universities', 'Institutions of higher education offering undergraduate and postgraduate degrees'),
    ('Zoo', 'Facilities where animals are kept for public viewing and conservation');



INSERT INTO indicator_definitions (name, description, unit, category, source) VALUES
-- 1. Population
(
  'Population',
  'Total number of residents officially registered in the city on January 1 of each year, based on municipal population records.',
  'inhabitants',
  'Demography',
  '{
    "barcelona": {
      "url": "https://opendata-ajuntament.barcelona.cat/data/en/dataset/pad_mdbas",
      "description": "Population of Barcelona according to the Municipal Register of Inhabitants on January 1 of each year",
      "calculation": "Direct count based on the Municipal Register of Inhabitants (Padró Municipal d Habitants)"
    },
    "madrid": {
      "url": "tbd",
      "description": "TBD",
      "calculation": "TBD"
    }
  }'
),

-- 2. Surface
(
  'Surface',
  'Total surface area of each neighborhood in the city, measured in hectares.',
  'hectares',
  'Territory, Town Planning and Infrastructures',
  '{
    "barcelona": {
      "url": "https://opendata-ajuntament.barcelona.cat/data/en/dataset/est-superficie",
      "description": "Neighborhoods area size of the city of Barcelona (h2).",
      "calculation": "Geospatial measurement of each surface neighborhood in hectares"
    },
    "madrid": {
      "url": "tbd",
      "description": "TBD",
      "calculation": "TBD"
    }
  }'
),

-- 3. Average gross taxable income per person
(
  'Average gross taxable income per person',
  'Gross annual taxable income per person, estimated at neighborhood level based on census section aggregation.',
  'euros per person',
  'Society and Welfare',
  '{
    "barcelona": {
      "url": "https://opendata-ajuntament.barcelona.cat/data/en/dataset/atles-renda-bruta-per-persona",
      "description": "Average gross taxable income per person (€) in the city of Barcelona based on the experimental project Atlas de distribución de la renta de los hogares of Instituto Nacional de Estadística (INE).",
      "calculation": "Mean of census section values aggregated at the neighborhood level"
    },
    "madrid": {
      "url": "tbd",
      "description": "TBD",
      "calculation": "TBD"
    }
  }'
),

-- 4. Disposable income per capita
(
  'Disposable income per capita',
  'Net annual disposable income available per person in the household, estimated from household-level data and divided by average household size.',
  'euros per person',
  'Society and Welfare',
  '{
    "barcelona": {
      "url": "https://opendata-ajuntament.barcelona.cat/data/en/dataset/renda-disponible-llars-bcn",
      "description": "Estimation of the Disposable Income of households per person (€) in the city of Barcelona by census sections, based on the Income Account for Barcelona of the Idescat and the Atlas de Distribución de la Renta de las Hogares del INE.",
      "calculation": "Net household income divided by average household size, aggregated from census data"
    },
    "madrid": {
      "url": "tbd",
      "description": "TBD",
      "calculation": "TBD"
    }
  }'
);

-- === Create Procedure ===

-- Procedure: execute_sql for supabase integration
DROP FUNCTION IF EXISTS execute_sql(TEXT);

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

-- Grant permissions for usage
GRANT EXECUTE ON FUNCTION execute_sql TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;