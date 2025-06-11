-- Migration: Add city_id to point_features
-- Description: Adds city_id column to point_features table and creates an index for it
-- Author: Nico D'Alessandro Calderon
-- Date: 2025-05-20

-- Add city_id column
ALTER TABLE point_features 
ADD COLUMN city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE;

-- Create index for city_id
CREATE INDEX idx_point_features_city ON point_features (city_id);

-- Update existing records based on geo_level_id and geo_id
UPDATE point_features pf
SET city_id = CASE
    WHEN pf.geo_level_id = 1 THEN pf.geo_id
    WHEN pf.geo_level_id = 2 THEN d.city_id
    WHEN pf.geo_level_id = 3 THEN n.city_id
END
FROM districts d
LEFT JOIN neighbourhoods n ON n.district_id = d.id
WHERE 
    (pf.geo_level_id = 2 AND pf.geo_id = d.id) OR
    (pf.geo_level_id = 3 AND pf.geo_id = n.id);

-- Add NOT NULL constraint after data migration
ALTER TABLE point_features 
ALTER COLUMN city_id SET NOT NULL; 