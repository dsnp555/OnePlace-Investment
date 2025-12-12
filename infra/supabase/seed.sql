-- OnePlace Invest Sample/Seed Data
-- Run this AFTER schema.sql and rls.sql for demo purposes

-- ============================================
-- SAMPLE MARKET CACHE DATA
-- ============================================
INSERT INTO market_cache (symbol, name, category, price, change_percent, extra_data) VALUES
  ('NIFTY50', 'Nifty 50 Index', 'index', 19750.25, 0.45, '{"dayHigh": 19800, "dayLow": 19650, "volume": 125000000}'),
  ('SENSEX', 'BSE Sensex', 'index', 65890.50, 0.52, '{"dayHigh": 66000, "dayLow": 65500, "volume": 98000000}'),
  ('GOLD', 'Gold (₹/10g)', 'commodity', 62500.00, -0.15, '{"purity": "24K", "unit": "10g"}'),
  ('SILVER', 'Silver (₹/kg)', 'commodity', 76500.00, 0.28, '{"purity": "999", "unit": "kg"}'),
  ('USDINR', 'USD/INR', 'forex', 83.25, 0.05, '{}'),
  ('BTC', 'Bitcoin', 'crypto', 3700000.00, 2.15, '{"marketCap": "1.2T USD"}'),
  ('ETH', 'Ethereum', 'crypto', 195000.00, 1.85, '{"marketCap": "280B USD"}'),
  ('RBI_REPO', 'RBI Repo Rate', 'rate', 6.50, 0, '{"effectiveFrom": "2024-02-08"}'),
  ('PPF', 'PPF Interest Rate', 'rate', 7.10, 0, '{"quarter": "Q4 FY24"}'),
  ('FD_SBI', 'SBI FD Rate (1-2Y)', 'rate', 6.80, 0, '{"bank": "SBI", "tenure": "1-2 years"}')
ON CONFLICT (symbol) DO UPDATE SET
  price = EXCLUDED.price,
  change_percent = EXCLUDED.change_percent,
  fetched_at = NOW();

-- ============================================
-- SAMPLE PUBLIC TEMPLATES
-- These will be owned by a system user or first admin
-- ============================================

-- Note: These inserts require a valid user_id. 
-- In production, you would insert these after creating a system user.
-- For now, they serve as example data structure.

-- Example template data structure (to be inserted via API after user creation):
/*
INSERT INTO saved_templates (user_id, name, description, template_data, is_public) VALUES
(
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
  'Conservative Starter',
  'A low-risk portfolio suitable for beginners or those nearing retirement',
  '{
    "mode": "lumpsum",
    "normalize": true,
    "allocations": [
      {"category": "Fixed Deposits", "percent": 35, "expectedAnnualReturn": 0.065},
      {"category": "Bonds", "percent": 25, "expectedAnnualReturn": 0.07},
      {"category": "Gold", "percent": 15, "expectedAnnualReturn": 0.07},
      {"category": "Mutual Funds", "percent": 15, "expectedAnnualReturn": 0.09},
      {"category": "PPF", "percent": 10, "expectedAnnualReturn": 0.071}
    ]
  }',
  TRUE
),
(
  '00000000-0000-0000-0000-000000000000',
  'Balanced Growth',
  'A balanced portfolio with moderate risk and growth potential',
  '{
    "mode": "sip",
    "normalize": true,
    "allocations": [
      {"category": "Mutual Funds", "percent": 30, "expectedAnnualReturn": 0.10},
      {"category": "Stocks", "percent": 25, "expectedAnnualReturn": 0.12},
      {"category": "Index Funds", "percent": 20, "expectedAnnualReturn": 0.10},
      {"category": "Bonds", "percent": 10, "expectedAnnualReturn": 0.07},
      {"category": "Gold", "percent": 10, "expectedAnnualReturn": 0.07},
      {"category": "REITs", "percent": 5, "expectedAnnualReturn": 0.08}
    ]
  }',
  TRUE
),
(
  '00000000-0000-0000-0000-000000000000',
  'Aggressive Growth',
  'High-risk, high-reward portfolio for young investors with long time horizons',
  '{
    "mode": "sip",
    "normalize": true,
    "allocations": [
      {"category": "Stocks", "percent": 45, "expectedAnnualReturn": 0.12},
      {"category": "Mutual Funds", "percent": 25, "expectedAnnualReturn": 0.11},
      {"category": "ETFs", "percent": 15, "expectedAnnualReturn": 0.10},
      {"category": "Crypto", "percent": 10, "expectedAnnualReturn": 0.15},
      {"category": "REITs", "percent": 5, "expectedAnnualReturn": 0.08}
    ]
  }',
  TRUE
);
*/

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant read access to market_cache for anonymous users (if needed)
-- GRANT SELECT ON market_cache TO anon;

-- Grant all permissions to authenticated users on their tables
-- This is handled by RLS policies, but you can add explicit grants if needed:
-- GRANT ALL ON profiles TO authenticated;
-- GRANT ALL ON strategies TO authenticated;
-- GRANT ALL ON allocations TO authenticated;
-- GRANT ALL ON projections TO authenticated;
-- GRANT ALL ON alerts TO authenticated;
-- GRANT ALL ON saved_templates TO authenticated;
-- GRANT ALL ON fire_goals TO authenticated;
-- GRANT ALL ON risk_questionnaire_responses TO authenticated;
