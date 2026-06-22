-- TechAI Hub Database Schema
-- Table prefix: tai_
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth, but we store extra fields)
CREATE TABLE IF NOT EXISTS tai_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  report_email TEXT DEFAULT '5581012@qq.com',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News table
CREATE TABLE IF NOT EXISTS tai_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  published_at TIMESTAMPTZ,
  category TEXT, -- energy, idc, hardware, platform, application
  importance INTEGER DEFAULT 3, -- 1-5
  tags TEXT[], -- array of tag names
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry chains table
CREATE TABLE IF NOT EXISTS tai_industry_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  creator_id UUID REFERENCES tai_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain layers table
CREATE TABLE IF NOT EXISTS tai_chain_layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID REFERENCES tai_industry_chains(id) ON DELETE CASCADE,
  layer_name TEXT NOT NULL,
  layer_order INTEGER NOT NULL,
  description TEXT,
  key_metrics TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain nodes table
CREATE TABLE IF NOT EXISTS tai_chain_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layer_id UUID REFERENCES tai_chain_layers(id) ON DELETE CASCADE,
  node_name TEXT NOT NULL,
  node_type TEXT DEFAULT 'company', -- company, tech, product
  description TEXT,
  related_stocks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tai_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stocks table
CREATE TABLE IF NOT EXISTS tai_stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL, -- A, HK, US
  sector TEXT,
  core_logic TEXT,
  risk_factors TEXT,
  latest_price NUMERIC,
  market_cap NUMERIC,
  tag_id UUID REFERENCES tai_tags(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, market)
);

-- Daily reports table
CREATE TABLE IF NOT EXISTS tai_daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES tai_users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- structured report content
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User follows table (tags and chains)
CREATE TABLE IF NOT EXISTS tai_user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES tai_users(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tai_tags(id) ON DELETE CASCADE,
  chain_id UUID REFERENCES tai_industry_chains(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag_id, chain_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_category ON tai_news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON tai_news(published_at);
CREATE INDEX IF NOT EXISTS idx_chains_creator ON tai_industry_chains(creator_id);
CREATE INDEX IF NOT EXISTS idx_stocks_tag ON tai_stocks(tag_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_date ON tai_daily_reports(user_id, report_date);

-- RLS Policies
ALTER TABLE tai_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_industry_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_chain_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_chain_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tai_user_follows ENABLE ROW LEVEL SECURITY;

-- Users: users can read/write their own
CREATE POLICY "Users can read own" ON tai_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own" ON tai_users FOR UPDATE USING (auth.uid() = id);

-- News: everyone can read, only service role can insert
CREATE POLICY "News readable by all" ON tai_news FOR SELECT USING (true);

-- Industry chains: public readable, creator can modify
CREATE POLICY "Chains public readable" ON tai_industry_chains FOR SELECT USING (is_public = TRUE OR auth.uid() = creator_id);
CREATE POLICY "Chains creator update" ON tai_industry_chains FOR ALL USING (auth.uid() = creator_id);

-- Daily reports: only owner can read
CREATE POLICY "Reports owner only" ON tai_daily_reports FOR ALL USING (auth.uid() = user_id);

-- User follows: only owner
CREATE POLICY "Follows owner only" ON tai_user_follows FOR ALL USING (auth.uid() = user_id);

-- Insert default AI industry chain data
INSERT INTO tai_industry_chains (name, description, is_public, creator_id) VALUES
('AI算力产业链', '从电力到应用层的完整AI算力产业链', TRUE, NULL)
ON CONFLICT DO NOTHING;
