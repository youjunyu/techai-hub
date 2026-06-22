import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface CrawlResult {
  source: string
  count: number
  error?: string
}

// User-Agents to mimic real browsers
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    })
    return res
  } finally {
    clearTimeout(id)
  }
}

function extractText(html: string, selector: string): string {
  // Simple regex-based extraction (fallback when no DOM parser)
  const regex = new RegExp(`<${selector}[^>]*>(.*?)</${selector}>`, 'gis')
  const matches = html.match(regex)
  if (!matches) return ''
  return matches
    .map(m => m.replace(/<[^>]*>/g, '').trim())
    .filter(t => t.length > 10)
    .join('\n')
    .slice(0, 5000)
}

// Crawl 36氪 AI section
async function crawl36kr(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://36kr.com/information/AI/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // Extract article titles and links
    const articles: { title: string; url: string; summary?: string }[] = []
    const titleRegex = /<a[^>]+href="(/p/\d+)"[^>]*>([\s\S]*?)<\/a>/gi
    let match

    while ((match = titleRegex.exec(html)) !== null && articles.length < 20) {
      const url = `https://36kr.com${match[1]}`
      const titleText = match[2].replace(/<[^>]*>/g, '').trim()
      if (titleText.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title: titleText, url })
      }
    }

    // Save to database
    let saved = 0
    for (const article of articles) {
      try {
        const { error } = await supabaseAdmin.from('tai_news').upsert({
          title: article.title,
          url: article.url,
          source: '36氪',
          category: 'AI算力',
          importance: 3,
          published_at: new Date().toISOString(),
        }, { onConflict: 'url' })
        if (!error) saved++
      } catch { /* skip */ }
    }

    return { source: '36氪', count: saved }
  } catch (e: any) {
    return { source: '36氪', count: 0, error: e.message }
  }
}

// Crawl 机器之心
async function crawlJiQizhixin(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.jiqizhixin.com/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
    // Look for article cards
    const cardRegex = /<a[^>]+href="(https?:\/\/www\.jiqizhixin\.com\/article\/[^"]+)"[^>]*>[\s\S]*?<[^>]+class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi
    let match

    while ((match = cardRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const titleText = match[2].replace(/<[^>]*>/g, '').trim()
      if (titleText.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title: titleText, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      try {
        const { error } = await supabaseAdmin.from('tai_news').upsert({
          title: article.title,
          url: article.url,
          source: '机器之心',
          category: 'AI算力',
          importance: 3,
          published_at: new Date().toISOString(),
        }, { onConflict: 'url' })
        if (!error) saved++
      } catch { /* skip */ }
    }

    return { source: '机器之心', count: saved }
  } catch (e: any) {
    return { source: '机器之心', count: 0, error: e.message }
  }
}

// Crawl 量子位
async function crawlQbitAI(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.qbitai.com/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
    const linkRegex = /<a[^>]+href="(https?:\/\/www\.qbitai\.com\/\d{4}\/\d{2}\/\d{2}\/[^"]+)"[^>]*>([^<]+)<\/a>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const titleText = match[2].trim()
      if (titleText.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title: titleText, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      try {
        const { error } = await supabaseAdmin.from('tai_news').upsert({
          title: article.title,
          url: article.url,
          source: '量子位',
          category: 'AI前沿',
          importance: 3,
          published_at: new Date().toISOString(),
        }, { onConflict: 'url' })
        if (!error) saved++
      } catch { /* skip */ }
    }

    return { source: '量子位', count: saved }
  } catch (e: any) {
    return { source: '量子位', count: 0, error: e.message }
  }
}

// Crawl 财联社电报
async function crawlCailian(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.cls.cn/telegraph', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const items: { title: string; url: string }[] = []

    // Look for telegraph items
    const itemRegex = /<div[^>]+class="[^"]*telegraph-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi
    let match

    while ((match = itemRegex.exec(html)) !== null && items.length < 30) {
      const content = match[1]
      const titleMatch = content.match(/<p[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
      if (titleMatch) {
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim()
        if (title.length > 5 && !items.find(i => i.title === title)) {
          items.push({ title, url: `https://www.cls.cn/detail/${Date.now()}` })
        }
      }
    }

    let saved = 0
    for (const item of items) {
      try {
        const { error } = await supabaseAdmin.from('tai_news').upsert({
          title: item.title,
          url: item.url,
          source: '财联社',
          category: '市场快讯',
          importance: 4,
          published_at: new Date().toISOString(),
        }, { onConflict: 'url' })
        if (!error) saved++
      } catch { /* skip */ }
    }

    return { source: '财联社', count: saved }
  } catch (e: any) {
    return { source: '财联社', count: 0, error: e.message }
  }
}

// Main crawl handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({ sources: 'all' }))
    const { sources = 'all' } = body

    const crawlers: Record<string, () => Promise<CrawlResult>> = {
      '36kr': crawl36kr,
      'jiqizhixin': crawlJiQizhixin,
      'qbitai': crawlQbitAI,
      'cailian': crawlCailian,
    }

    let targets: Record<string, () => Promise<CrawlResult>>
    if (sources === 'all') {
      targets = crawlers
    } else if (Array.isArray(sources)) {
      targets = Object.fromEntries(
        Object.entries(crawlers).filter(([k]) => sources.includes(k))
      ) as any
    } else if (typeof sources === 'string' && crawlers[sources]) {
      targets = { [sources]: crawlers[sources] }
    } else {
      targets = crawlers
    }

    const results: CrawlResult[] = []
    // Run sequentially to avoid overwhelming servers
    for (const [name, fn] of Object.entries(targets)) {
      console.log(`[Crawler] Starting ${name}...`)
      const result = await fn()
      console.log(`[Crawler] ${name}: ${result.count} items${result.error ? ` (${result.error})` : ''}`)
      results.push(result)
      // Small delay between crawlers
      await new Promise(r => setTimeout(r, 1000))
    }

    const total = results.reduce((sum, r) => sum + r.count, 0)
    const errors = results.filter(r => r.error)

    return NextResponse.json({
      message: `Crawled ${total} items from ${results.length} sources`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Crawl failed' }, { status: 500 })
  }
}
