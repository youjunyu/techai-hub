-- tai_tag_stocks: many-to-many junction table for tags and stocks
CREATE TABLE IF NOT EXISTS tai_tag_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tai_tags(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES tai_stocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, stock_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tai_tag_stocks_tag_id ON tai_tag_stocks(tag_id);
CREATE INDEX IF NOT EXISTS idx_tai_tag_stocks_stock_id ON tai_tag_stocks(stock_id);
