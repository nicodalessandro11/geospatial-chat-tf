-- === RLS Policies ===
CREATE POLICY "Service role access on cities"
  ON cities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on districts"
  ON districts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on neighbourhoods"
  ON neighbourhoods FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on geographical_levels"
  ON geographical_levels FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on indicator_definitions"
  ON indicator_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on indicators"
  ON indicators FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on feature_definitions"
  ON feature_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on point_features"
  ON point_features FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === Create SELECT policies for public (anon) access ===
CREATE POLICY "Anon read: cities" 
ON cities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: districts" ON districts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: neighbourhoods" ON neighbourhoods FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: geographical_levels" ON geographical_levels FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: indicator_definitions" ON indicator_definitions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: indicators" ON indicators FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: feature_definitions" ON feature_definitions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read: point_features" ON point_features FOR SELECT TO anon USING (true);

-- Grant Insert, Select, Update, Delete on all tables in schema public to service_role
GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
