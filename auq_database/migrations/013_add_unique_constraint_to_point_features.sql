-- Migration: Add unique constraint to point_features
-- Description: Adds a unique constraint to ensure no duplicate point features with same location and type
-- Author: Nico D'Alessandro Calderon
-- Date: 2024-04-25

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'point_features'::regclass 
        AND conname = 'point_features_unique_location'
    ) THEN
        ALTER TABLE point_features 
        ADD CONSTRAINT point_features_unique_location 
        UNIQUE (feature_definition_id, latitude, longitude, city_id);
    END IF;
END $$;

-- Log the migration
INSERT INTO migrations (name, applied_at)
VALUES ('013_add_unique_constraint_to_point_features', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING; 