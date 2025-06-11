-- Migration: Add city_id to indicators table
-- Description: Adds city_id column to indicators table and updates constraints
-- Author: Nico D'Alessandro Calderon
-- Date: 2024-04-17

-- Start transaction
BEGIN;

-- Add city_id column
ALTER TABLE indicators 
ADD COLUMN city_id INTEGER NOT NULL DEFAULT 1 REFERENCES cities(id) ON DELETE CASCADE;

-- Drop existing unique constraint
ALTER TABLE indicators 
DROP CONSTRAINT IF EXISTS indicators_indicator_def_id_geo_level_id_geo_id_year_key;

-- Add new unique constraint including city_id
ALTER TABLE indicators 
ADD CONSTRAINT indicators_indicator_def_id_geo_level_id_geo_id_city_id_year_key 
UNIQUE (indicator_def_id, geo_level_id, geo_id, city_id, year);

-- Create index for city_id
CREATE INDEX idx_indicators_city ON indicators (city_id);

-- Remove the default value constraint after data migration
ALTER TABLE indicators 
ALTER COLUMN city_id DROP DEFAULT;

-- Commit transaction
COMMIT; 