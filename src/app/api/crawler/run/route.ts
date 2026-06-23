import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateNewsSummary } from '@/lib/ai-summary'
import { logCrawlerError } from '@/lib/logger'

// Helper to save a news item (NO AI summary during crawl - just store raw data)
async function saveNewsItem(item: { title: string; url: string; source: string; category: string; importance: number; summary?: string; published_at?: string }) {
  try {
    const { error } = await supabaseAdmin()
      .from('tai_news')
      .upsert({
        title: item.title,
        url: item.url,
        source: item.source,
        category: item.category,
        importance: item.importance,
        summary: item.summary || item.title, // Use provided summary or title; AI will process later
        published_at: item.published_at || new Date().toISOString(),
        is_processed: false, // Mark as not yet AI-processed
      }, { onConflict: 'url' })
    return !error
  } catch (e: any) {
    await logCrawlerError(item.source, e, { title: item.title, url: item.url })
    return false
  }
}

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

// ======== Crawl Sources ========

// 1. 36氪 AI section
async function crawl36kr(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://36kr.com/information/AI/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string; summary?: string; published_at?: string }[] = []
    const titleRegex = new RegExp("<a[^>]+href=\"(/p/\\d+)\"[^>]*>([\\s\\S]*?)<\/a>", "gi")
    let match

    while ((match = titleRegex.exec(html)) !== null && articles.length < 20) {
      const url = `https://36kr.com${match[1]}`
      const titleText = match[2].replace(/<[^>]*>/g, '').trim()
      if (titleText.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title: titleText, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      if (await saveNewsItem({ ...article, source: '36氪', category: 'AI算力', importance: 3 })) saved++
    }

    return { source: '36氪', count: saved }
  } catch (e: any) {
    await logCrawlerError('36kr', e)
    return { source: '36氪', count: 0, error: e.message }
  }
}

// 2. 机器之心
async function crawlJiQizhixin(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.jiqizhixin.com/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
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
      if (await saveNewsItem({ ...article, source: '机器之心', category: 'AI算力', importance: 3 })) saved++
    }

    return { source: '机器之心', count: saved }
  } catch (e: any) {
    await logCrawlerError('jiqizhixin', e)
    return { source: '机器之心', count: 0, error: e.message }
  }
}

// 3. 量子位
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
      if (await saveNewsItem({ ...article, source: '量子位', category: 'AI前沿', importance: 3 })) saved++
    }

    return { source: '量子位', count: saved }
  } catch (e: any) {
    await logCrawlerError('qbitai', e)
    return { source: '量子位', count: 0, error: e.message }
  }
}

// 4. 财联社电报
async function crawlCailian(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.cls.cn/telegraph', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const items: { title: string; url: string }[] = []
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
      if (await saveNewsItem({ ...item, source: '财联社', category: '市场快讯', importance: 4 })) saved++
    }

    return { source: '财联社', count: saved }
  } catch (e: any) {
    await logCrawlerError('cailian', e)
    return { source: '财联社', count: 0, error: e.message }
  }
}

// 5. IT之家 - AI 板块
async function crawlITHome(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.ithome.com/list/ai/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string; published_at?: string }[] = []
    // IT之家列表页文章链接
    const linkRegex = /<a[^>]+href="(https?:\/\/www\.ithome\.com\/\d\/\d{3}\/\d{3}\.htm)"[^>]*>([^<]+)<\/a>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const title = match[2].trim()
      if (title.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      if (await saveNewsItem({ ...article, source: 'IT之家', category: 'AI算力', importance: 3 })) saved++
    }

    return { source: 'IT之家', count: saved }
  } catch (e: any) {
    await logCrawlerError('ithome', e)
    return { source: 'IT之家', count: 0, error: e.message }
  }
}

// 6. 雷锋网 - AI 频道
async function crawlLeifeng(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.leiphone.com/category/ai', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
    const linkRegex = /<a[^>]+href="(https?:\/\/www\.leiphone\.com\/category\/\w+\/\d+\.html)"[^>]*>\s*<[^>]*>\s*([^<]+)<\/[^>]*>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const title = match[2].trim()
      if (title.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      if (await saveNewsItem({ ...article, source: '雷锋网', category: 'AI应用', importance: 3 })) saved++
    }

    return { source: '雷锋网', count: saved }
  } catch (e: any) {
    await logCrawlerError('leifeng', e)
    return { source: '雷锋网', count: 0, error: e.message }
  }
}

// 7. 半导体行业观察
async function crawlICViews(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.icviews.cn/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
    const linkRegex = /<a[^>]+href="(https?:\/\/www\.icviews\.cn\/\w+\/\d+\.html)"[^>]*>([^<]+)<\/a>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const title = match[2].trim()
      if (title.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      if (await saveNewsItem({ ...article, source: '半导体行业观察', category: '半导体', importance: 3 })) saved++
    }

    return { source: '半导体行业观察', count: saved }
  } catch (e: any) {
    await logCrawlerError('icviews', e)
    return { source: '半导体行业观察', count: 0, error: e.message }
  }
}

// 8. 快科技 - AI 板块
async function crawlMyDrivers(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://www.mydrivers.com/newsclass/1162.htm', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
    const linkRegex = /<a[^>]+href="(https?:\/\/news\.mydrivers\.com\/\d\/\d{3}\/\d{3}\.html)"[^>]*>([^<]+)<\/a>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const title = match[2].trim()
      if (title.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      if (await saveNewsItem({ ...article, source: '快科技', category: 'AI算力', importance: 3 })) saved++
    }

    return { source: '快科技', count: saved }
  } catch (e: any) {
    await logCrawlerError('mydrivers', e)
    return { source: '快科技', count: 0, error: e.message }
  }
}

// 9. 东方财富 - 科技要闻（RSS API）
async function crawlEastmoney(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://data.eastmoney.com/telegraphy/default.html', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const items: { title: string; url: string }[] = []
    // 东方财富电报页面
    const itemRegex = /<li[^>]*class="[^"]*telegraph-item[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi
    let match

    while ((match = itemRegex.exec(html)) !== null && items.length < 20) {
      const title = match[1].replace(/<[^>]*>/g, '').trim()
      if (title.length > 5 && !items.find(i => i.title === title)) {
        items.push({ title, url: `https://data.eastmoney.com/telegraphy/${Date.now()}` })
      }
    }

    let saved = 0
    for (const item of items) {
      if (await saveNewsItem({ ...item, source: '东方财富', category: '市场快讯', importance: 4 })) saved++
    }

    return { source: '东方财富', count: saved }
  } catch (e: any) {
    await logCrawlerError('eastmoney', e)
    return { source: '东方财富', count: 0, error: e.message }
  }
}

// 10. 网易科技
async function crawlNeteaseTech(): Promise<CrawlResult> {
  try {
    const res = await fetchWithTimeout('https://tech.163.com/', 15000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const articles: { title: string; url: string }[] = []
    const linkRegex = /<a[^>]+href="(https?:\/\/tech\.163\.com\/\d{2}\/\d{4}\/\d{2}\/[^"]+)"[^>]*>([^<]+)<\/a>/gi
    let match

    while ((match = linkRegex.exec(html)) !== null && articles.length < 20) {
      const url = match[1]
      const title = match[2].trim()
      if (title.length > 5 && !articles.find(a => a.url === url)) {
        articles.push({ title, url })
      }
    }

    let saved = 0
    for (const article of articles) {
      if (await saveNewsItem({ ...article, source: '网易科技', category: '综合', importance: 3 })) saved++
    }

    return { source: '网易科技', count: saved }
  } catch (e: any) {
    await logCrawlerError('netease', e)
    return { source: '网易科技', count: 0, error: e.message }
  }
}

// ======== Main Handler ========

const ALL_CRAWLERS: Record<string, () => Promise<CrawlResult>> = {
  '36kr': crawl36kr,
  'jiqizhixin': crawlJiQizhixin,
  'qbitai': crawlQbitAI,
  'cailian': crawlCailian,
  'ithome': crawlITHome,
  'leifeng': crawlLeifeng,
  'icviews': crawlICViews,
  'mydrivers': crawlMyDrivers,
  'eastmoney': crawlEastmoney,
  'netease': crawlNeteaseTech,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({ sources: 'all' }))
    const { sources = 'all' } = body

    let targets: Record<string, () => Promise<CrawlResult>>
    if (sources === 'all') {
      targets = ALL_CRAWLERS
    } else if (Array.isArray(sources)) {
      targets = Object.fromEntries(
        Object.entries(ALL_CRAWLERS).filter(([k]) => sources.includes(k))
      ) as any
    } else if (typeof sources === 'string' && ALL_CRAWLERS[sources]) {
      targets = { [sources]: ALL_CRAWLERS[sources] }
    } else {
      targets = ALL_CRAWLERS
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
    await logCrawlerError('crawler-main', e)
    return NextResponse.json({ error: e.message || 'Crawl failed' }, { status: 500 })
  }
}
