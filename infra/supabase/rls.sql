-- OnePlace Invest Row Level Security Policies
-- Run this AFTER schema.sql in your Supabase SQL Editor

-- ============================================
-- PROFILES RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- New users can insert their profile (handled by trigger but backup policy)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STRATEGIES RLS
-- ============================================
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- Users can view their own strategies
CREATE POLICY "Users can view own strategies"
  ON strategies FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public template strategies
CREATE POLICY "Anyone can view public templates"
  ON strategies FOR SELECT
  USING (is_public = TRUE AND is_template = TRUE);

-- Users can create strategies
CREATE POLICY "Users can create strategies"
  ON strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own strategies
CREATE POLICY "Users can update own strategies"
  ON strategies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own strategies
CREATE POLICY "Users can delete own strategies"
  ON strategies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ALLOCATIONS RLS
-- ============================================
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Users can view allocations of their own strategies
CREATE POLICY "Users can view own allocations"
  ON allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = allocations.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can view allocations of public templates
CREATE POLICY "Anyone can view public template allocations"
  ON allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = allocations.strategy_id
      AND s.is_public = TRUE
      AND s.is_template = TRUE
    )
  );

-- Users can create allocations for their strategies
CREATE POLICY "Users can create allocations"
  ON allocations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = allocations.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can update allocations of their strategies
CREATE POLICY "Users can update own allocations"
  ON allocations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = allocations.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can delete allocations of their strategies
CREATE POLICY "Users can delete own allocations"
  ON allocations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = allocations.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================
-- PROJECTIONS RLS
-- ============================================
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;

-- Users can view projections of their strategies
CREATE POLICY "Users can view own projections"
  ON projections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = projections.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can create projections for their strategies
CREATE POLICY "Users can create projections"
  ON projections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = projections.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can delete projections of their strategies
CREATE POLICY "Users can delete own projections"
  ON projections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM strategies s
      WHERE s.id = projections.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================
-- RISK_QUESTIONNAIRE_RESPONSES RLS
-- ============================================
ALTER TABLE risk_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view own risk responses"
  ON risk_questionnaire_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their responses
CREATE POLICY "Users can create risk responses"
  ON risk_questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ALERTS RLS
-- ============================================
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create alerts
CREATE POLICY "Users can create alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their alerts
CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their alerts
CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MARKET_CACHE RLS (public read, admin write)
-- ============================================
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read market cache
CREATE POLICY "Anyone can read market cache"
  ON market_cache FOR SELECT
  USING (TRUE);

-- Only service role can write (for background jobs)
-- No insert/update/delete policies for regular users

-- ============================================
-- SAVED_TEMPLATES RLS
-- ============================================
ALTER TABLE saved_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view own templates"
  ON saved_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view public templates
CREATE POLICY "Anyone can view public templates"
  ON saved_templates FOR SELECT
  USING (is_public = TRUE);

-- Users can create templates
CREATE POLICY "Users can create templates"
  ON saved_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their templates
CREATE POLICY "Users can update own templates"
  ON saved_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their templates
CREATE POLICY "Users can delete own templates"
  ON saved_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FIRE_GOALS RLS
-- ============================================
ALTER TABLE fire_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own FIRE goals
CREATE POLICY "Users can view own fire goals"
  ON fire_goals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their FIRE goals
CREATE POLICY "Users can create fire goals"
  ON fire_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their FIRE goals
CREATE POLICY "Users can update own fire goals"
  ON fire_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their FIRE goals
CREATE POLICY "Users can delete own fire goals"
  ON fire_goals FOR DELETE
  USING (auth.uid() = user_id);
