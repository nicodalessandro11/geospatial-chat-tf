-- Migration: Replace current_indicators_view with scalable version
-- Description: Creates a view that computes the latest indicators per level, supporting aggregation from lower levels
-- Author: Nico D'Alessandro Calderon
-- Date: 2025-05-21

-- Drop existing view if any
DROP VIEW IF EXISTS current_indicators_view;

-- Create the scalable view
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

-- Grant permission to public
GRANT SELECT ON current_indicators_view TO anon;
