-- === Views ===
-- Drop existing views if they exist
DROP VIEW IF EXISTS geographical_unit_view;
DROP VIEW IF EXISTS district_polygons_view;
DROP VIEW IF EXISTS neighborhood_polygons_view;

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

-- Grant SELECT permissions on views
GRANT SELECT ON geographical_unit_view TO anon;
GRANT SELECT ON district_polygons_view TO anon;
GRANT SELECT ON neighborhood_polygons_view TO anon;
