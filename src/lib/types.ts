export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  report_email: string
  created_at: string
}

export interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  summary?: string
  content?: string
  published_at?: string
  category?: string
  importance: number
  tags: string[]
  is_processed: boolean
  created_at: string
}

export interface IndustryChain {
  id: string
  name: string
  description?: string
  is_public: boolean
  creator_id?: string
  created_at: string
  layers?: ChainLayer[]
}

export interface ChainLayer {
  id: string
  chain_id: string
  layer_name: string
  layer_order: number
  description?: string
  key_metrics?: string
  nodes?: ChainNode[]
}

export interface ChainNode {
  id: string
  layer_id: string
  node_name: string
  node_type: string
  description?: string
  related_stocks?: string[]
}

export interface Tag {
  id: string
  name: string
  category?: string
  description?: string
  created_at: string
}

export interface Stock {
  id: string
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
  sector?: string
  core_logic?: string
  risk_factors?: string
  latest_price?: number
  market_cap?: number
  tag_id?: string
  tag?: Tag
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  title: string
  content: ReportContent
  is_sent: boolean
  sent_at?: string
  created_at: string
}

export interface ReportContent {
  headline_summary: HeadlineItem[]
  industry_updates: IndustryUpdate[]
  tag_analysis: TagAnalysis[]
  investment_advice: string
}

export interface HeadlineItem {
  title: string
  source: string
  summary: string
  importance: number
}

export interface IndustryUpdate {
  chain_name: string
  updates: string[]
}

export interface TagAnalysis {
  tag_name: string
  stocks: StockAnalysis[]
  outlook: string
}

export interface StockAnalysis {
  code: string
  name: string
  market: string
  analysis: string
  risk: string
}
