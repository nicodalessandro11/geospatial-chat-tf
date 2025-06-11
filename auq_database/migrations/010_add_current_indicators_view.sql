-- Migration: Add current_indicators_view
-- Description: Creates a view that provides current indicator values with proper aggregations for all geographical levels
-- Author: Nico D'Alessandro Calderon
-- Date: 2025-05-21

-- Drop existing view if it exists
DROP VIEW IF EXISTS current_indicators_view;

-- Create the new view
CREATE OR REPLACE VIEW current_indicators_view AS
WITH latest_years AS (
  SELECT
    i.indicator_def_id,
    i.city_id,
    MAX(i.year) AS latest_year
  FROM indicators i
  WHERE i.geo_level_id = 3
  GROUP BY i.indicator_def_id, i.city_id
),
neighborhood_values AS (
  SELECT 
    i.indicator_def_id,
    i.geo_id,
    i.year,
    i.value,
    id.name AS indicator_name,
    id.unit,
    id.category,
    n.name AS area_name,
    n.district_id,
    i.city_id
  FROM indicators i
  JOIN neighbourhoods n ON i.geo_id = n.id
  JOIN latest_years ly 
    ON i.indicator_def_id = ly.indicator_def_id 
   AND i.city_id = ly.city_id 
   AND i.year = ly.latest_year
  JOIN indicator_definitions id ON i.indicator_def_id = id.id
  WHERE i.geo_level_id = 3
),
district_values AS (
  SELECT
    nv.indicator_def_id,
    nv.district_id AS geo_id,
    nv.year,
    CASE 
      WHEN nv.indicator_name IN ('Population', 'Surface') THEN SUM(nv.value)
      ELSE AVG(nv.value)
    END AS value,
    nv.indicator_name,
    nv.unit,
    nv.category,
    d.name AS area_name,
    nv.city_id
  FROM neighborhood_values nv
  JOIN districts d ON nv.district_id = d.id
  GROUP BY 
    nv.indicator_def_id,
    nv.district_id,
    nv.year,
    nv.indicator_name,
    nv.unit,
    nv.category,
    d.name,
    nv.city_id
),
city_values AS (
  SELECT
    dv.indicator_def_id,
    dv.city_id AS geo_id,  -- used as geo_id for city level
    dv.city_id,            -- keep actual city_id field explicitly
    dv.year,
    CASE 
      WHEN dv.indicator_name IN ('Population', 'Surface') THEN SUM(dv.value)
      ELSE AVG(dv.value)
    END AS value,
    dv.indicator_name,
    dv.unit,
    dv.category,
    c.name AS area_name
  FROM district_values dv
  JOIN cities c ON dv.city_id = c.id
  GROUP BY 
    dv.indicator_def_id,
    dv.city_id,
    dv.year,
    dv.indicator_name,
    dv.unit,
    dv.category,
    c.name
)

-- Combine all levels
SELECT 
  'neighborhood' AS level,
  indicator_def_id,
  geo_id,
  year,
  value,
  indicator_name,
  unit,
  category,
  area_name,
  3 AS geo_level_id,
  city_id
FROM neighborhood_values

UNION ALL

SELECT 
  'district' AS level,
  indicator_def_id,
  geo_id,
  year,
  value,
  indicator_name,
  unit,
  category,
  area_name,
  2 AS geo_level_id,
  city_id
FROM district_values

UNION ALL

SELECT 
  'city' AS level,
  indicator_def_id,
  geo_id,
  year,
  value,
  indicator_name,
  unit,
  category,
  area_name,
  1 AS geo_level_id,
  city_id
FROM city_values;

-- Grant permissions
GRANT SELECT ON current_indicators_view TO anon;
