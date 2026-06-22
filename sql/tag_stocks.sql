-- tai_tag_stocks: 标签与股票的关联表（多对多）
-- 注意：tag_id 和 stock_id 均为 UUID 类型，与 tai_tags / tai_stocks 主键一致

DROP TABLE IF EXISTS tai_tag_stocks;

CREATE TABLE tai_tag_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tai_tags(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES tai_stocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, stock_id)
);

CREATE INDEX idx_tai_tag_stocks_tag ON tai_tag_stocks(tag_id);
CREATE INDEX idx_tai_tag_stocks_stock ON tai_tag_stocks(stock_id);
