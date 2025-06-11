-- ====================================
-- Migration: 014_create_user_events_table.sql
-- Description: Create user_events table for logging user activity (analytics)
-- Author: Nico D'Alessandro Calderon
-- Email: nicodalessandro11@gmail.com
-- Date: 2025-05-26
-- Version: 1.0.0
-- License: MIT License
-- ====================================

-- === 1. Table: user_events ===
CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g. 'login', 'view_map', 'compare', 'visualize'
    event_details JSONB,      -- Optional: extra info (area, indicator, error, etc)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_events IS 'Logs meaningful user actions for analytics and admin monitoring.';
COMMENT ON COLUMN user_events.event_type IS 'Type of event: login, view_map, compare, visualize, etc.';
COMMENT ON COLUMN user_events.event_details IS 'Optional JSON with extra info about the event.';

-- === 2. Indexes for analytics ===
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at);

-- === 3. Row Level Security (RLS) ===
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- By default, allow service_role full access (adjust as needed)
CREATE POLICY "Service role access on user_events"
  ON user_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- (Optional) Allow users to insert their own events
CREATE POLICY "Authenticated users can insert their own events"
  ON user_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- (Optional) Allow users to select their own events
CREATE POLICY "Authenticated users can select their own events"
  ON user_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- === 4. Grant permissions ===
GRANT SELECT, INSERT ON user_events TO service_role;
GRANT SELECT, INSERT ON user_events TO authenticated;

-- === 5. Table: user_config ===
CREATE TABLE IF NOT EXISTS user_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    custom_features JSONB,
    custom_indicators JSONB,
    other_prefs JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === RLS for user_config ===
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "Service role access on user_config"
  ON user_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow users to select/update/insert their own config
CREATE POLICY "Authenticated users can select their own config"
  ON user_config FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert their own config"
  ON user_config FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own config"
  ON user_config FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_config TO service_role;

-- === 6. Table: profiles ===
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === RLS for profiles ===
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "Service role access on profiles"
  ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow users to select/update/insert their own profile
CREATE POLICY "Authenticated users can select their own profile"
  ON profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert their own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO service_role;

-- ================================================
-- End of migration 014_create_user_events_table.sql
-- ================================================