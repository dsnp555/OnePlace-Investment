-- OnePlace Invest Database Schema
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores user profile information
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  dob DATE,
  income_monthly NUMERIC(15, 2),
  expenses_monthly NUMERIC(15, 2),
  existing_investments NUMERIC(15, 2) DEFAULT 0,
  risk_profile TEXT CHECK (risk_profile IN ('conservative', 'balanced', 'aggressive')),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STRATEGIES TABLE
-- Stores investment strategies
-- ============================================
CREATE TABLE IF NOT EXISTS strategies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('lumpsum', 'sip', 'goal', 'withdrawal')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  duration_years NUMERIC(5, 2) NOT NULL CHECK (duration_years > 0),
  compounding TEXT DEFAULT 'monthly' CHECK (compounding IN ('daily', 'monthly', 'quarterly', 'annually')),
  normalize_mode BOOLEAN DEFAULT TRUE,
  inflation_rate NUMERIC(5, 4) DEFAULT 0.05,
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALLOCATIONS TABLE
-- Stores asset allocations for each strategy
-- ============================================
CREATE TABLE IF NOT EXISTS allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  percent NUMERIC(6, 2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  percent_normalized NUMERIC(6, 2),
  amount NUMERIC(15, 2),
  expected_annual_return NUMERIC(5, 4) NOT NULL CHECK (expected_annual_return >= -1 AND expected_annual_return <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTIONS TABLE
-- Stores calculation snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS projections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE NOT NULL,
  snapshot JSONB NOT NULL,
  aggregate_fv NUMERIC(20, 2),
  aggregate_cagr NUMERIC(8, 6),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RISK_QUESTIONNAIRE_RESPONSES TABLE
-- Stores user risk assessment answers
-- ============================================
CREATE TABLE IF NOT EXISTS risk_questionnaire_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  calculated_score INTEGER NOT NULL CHECK (calculated_score >= 0 AND calculated_score <= 100),
  calculated_profile TEXT NOT NULL CHECK (calculated_profile IN ('conservative', 'balanced', 'aggressive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALERTS TABLE
-- Stores user notification preferences
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('milestone', 'rebalance', 'market_warning', 'monthly_summary')),
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'push', 'whatsapp')),
  enabled BOOLEAN DEFAULT TRUE,
  cron_spec TEXT,
  meta JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKET_CACHE TABLE
-- Caches market data for quick access
-- ============================================
CREATE TABLE IF NOT EXISTS market_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(15, 4),
  change_percent NUMERIC(8, 4),
  extra_data JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED_TEMPLATES TABLE
-- Stores reusable strategy templates
-- ============================================
CREATE TABLE IF NOT EXISTS saved_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FIRE_GOALS TABLE
-- Stores FIRE (Financial Independence) goals
-- ============================================
CREATE TABLE IF NOT EXISTS fire_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  target_annual_expenses NUMERIC(15, 2) NOT NULL,
  withdrawal_rate NUMERIC(5, 4) DEFAULT 0.04,
  fire_number NUMERIC(20, 2),
  current_progress NUMERIC(20, 2) DEFAULT 0,
  estimated_years NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allocations_strategy_id ON allocations(strategy_id);
CREATE INDEX IF NOT EXISTS idx_projections_strategy_id ON projections(strategy_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_market_cache_symbol ON market_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_saved_templates_public ON saved_templates(is_public) WHERE is_public = TRUE;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_templates_updated_at ON saved_templates;
CREATE TRIGGER update_saved_templates_updated_at
  BEFORE UPDATE ON saved_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fire_goals_updated_at ON fire_goals;
CREATE TRIGGER update_fire_goals_updated_at
  BEFORE UPDATE ON fire_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
