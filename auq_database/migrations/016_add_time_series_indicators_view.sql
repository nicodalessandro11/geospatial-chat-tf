-- ====================================
-- Description: This migration creates a view for time series indicators that aggregates data across neighborhoods and districts for all years.
-- Author: Nico D'Alessandro Calderon
-- Email: nicodalessandro11@gmail.com
-- Date: 2025-05-27
-- Version: 1.0.0
-- License: MIT License
-- ====================================

-- === Drop existing view ===
DROP VIEW IF EXISTS time_series_indicators_view;

-- === Create time series indicators view ===
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

-- === Grant permissions ===
GRANT SELECT ON time_series_indicators_view TO anon;
GRANT SELECT ON time_series_indicators_view TO authenticated;
GRANT SELECT ON time_series_indicators_view TO service_role; 

-- === Add unique constraint to user_config table ===
ALTER TABLE user_config ADD CONSTRAINT user_config_user_id_key UNIQUE (user_id);

-- Add authenticated read policy for feature_definitions
CREATE POLICY "Authenticated read: feature_definitions" ON feature_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: indicator_definitions" ON indicator_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: indicators" ON indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: cities" ON cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: districts" ON districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: neighbourhoods" ON neighbourhoods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: point_features" ON point_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read: geographical_levels" ON geographical_levels FOR SELECT TO authenticated USING (true);

-- ================================================
-- End of migration 016_add_time_series_indicators_view.sql
-- ================================================