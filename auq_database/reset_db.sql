-- ==========================================================
-- Description: This script deletes all user-defined objects in the 'public' schema
-- It preserves PostGIS system tables (spatial_ref_sys, geography_columns, geometry_columns)
-- and avoids touching extensions or auth/storage schemas
-- Author: Nico D'Alessandro Calderon
-- Email: nicodalessandro11@gmail.com
-- Date: 2025-04-01
-- Version: 1.0.0
-- License: MIT License
-- ===========================================================  

-- Disable constraints temporarily
SET session_replication_role = replica;

-- Drop all triggers in 'public'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT event_object_table, trigger_name
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', r.trigger_name, r.event_object_table);
  END LOOP;
END $$;

-- Drop all RLS policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Drop user-defined views only (skip PostGIS system views)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name NOT IN ('geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
  ) LOOP
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.table_name);
  END LOOP;
END $$;

-- Drop user-defined functions only (exclude those belonging to extensions like PostGIS)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid,
           proname,
           n.nspname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND d.objid IS NULL -- not part of any extension
  ) LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
      r.nspname, r.proname, r.args
    );
  END LOOP;
END $$;

-- Drop all user-defined tables, excluding PostGIS system tables
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
  ) LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
END $$;

-- Restore constraints
SET session_replication_role = DEFAULT;