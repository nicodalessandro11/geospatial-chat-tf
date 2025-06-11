-- Migration: Add unique constraint to point_features
-- Description: Adds a unique constraint to prevent duplicate points based on coordinates, feature type and city
-- Author: Nico D'Alessandro Calderon
-- Date: 2025-05-21

-- Create a function to round coordinates to 6 decimal places (about 11cm precision)
CREATE OR REPLACE FUNCTION round_coordinate(coord DECIMAL) 
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(coord::numeric, 6);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a unique index using the rounded coordinates
CREATE UNIQUE INDEX point_features_unique_point_idx 
ON point_features (
    feature_definition_id,
    round_coordinate(latitude),
    round_coordinate(longitude),
    city_id
);

-- Add comment to explain the index
COMMENT ON INDEX point_features_unique_point_idx IS 
'Prevents duplicate points by ensuring that points with the same rounded coordinates (6 decimal places) cannot be used for the same feature type in the same city'; 