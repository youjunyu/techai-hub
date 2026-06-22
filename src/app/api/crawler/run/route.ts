import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Simple crawler implementation
const NEWS_SOURCES = [
  {
    name: '36氪',
    url: 'https://36kr.com/information/AI',
    selector: '.article-item-title a',
    baseUrl: 'https://36kr.com'
  },
  {
    name: '量子位',
    url: 'https://www.qbitai.com/',
    selector: '.article-list-title a',
    baseUrl: 'https://www.qbitai.com'
  },
  {
    name: '机器之心',
    url: 'https://www.jiqizhixin.com/',
    selector: '.article-title a, .title a',
    baseUrl: 'https://www.jiqizhixin.com'
  },
  {
    name: '财联社',
    url: 'https://www.cls.cn/telegraph',
    selector: '.telegraph-content-box a, .telegraph-title a',
    baseUrl: 'https://www.cls.cn'
  }
]

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TechAI-Hub/1.0)',
      'Accept': 'text/html,application/xhtml+xml'
    },
    signal: AbortSignal.timeout(15000)
  })
  return response.text()
}

function extractLinks(html: string, selector: string, baseUrl: string): string[] {
  const links: string[] = []
  const regex = new RegExp(`<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)</a>`, 'gi')
  let match
  while ((match = regex.exec(html)) !== null) {
    const href = match[1]
    const text = match[2].trim()
    if (text.length > 5 && text.length < 100 && !href.includes('javascript')) {
      if (href.startsWith('/')) {
        links.push(baseUrl + href)
      } else if (href.startsWith('http')) {
        links.push(href)
      }
    }
  }
  return links.slice(0, 10)
}

async function fetchAndSummarize(url: string, title: string, source: string): Promise<any> {
  try {
    const html = await fetchPage(url)
    // Extract text content (simple approach)
    const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi)
    const text = textMatch ? textMatch.slice(0, 5).join(' ').replace(/<[^>]+>/g, '').slice(0, 500) : ''
    
    return {
      title,
      source,
      url,
      summary: text.slice(0, 200) || title,
      content: text,
      published_at: new Date().toISOString(),
      category: 'general',
      importance: 3
    }
  } catch (e) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allNews: any[] = []

    for (const source of NEWS_SOURCES) {
      try {
        const html = await fetchPage(source.url)
        const links = extractLinks(html, source.selector, source.baseUrl)
        
        for (const link of links.slice(0, 3)) {
          const title = link.split('/').pop()?.replace(/-/g, ' ') || link
          const article = await fetchAndSummarize(link, title, source.name)
          if (article) {
            allNews.push(article)
          }
          await new Promise(r => setTimeout(r, 500)) // Rate limit
        }
      } catch (e) {
        console.log(`Failed to crawl ${source.name}:`, e)
      }
    }

    // Save to database
    if (allNews.length > 0) {
      const { error } = await supabaseAdmin
        .from('tai_news')
        .insert(allNews)
      
      if (error) throw error
    }

    return NextResponse.json({ 
      message: 'Crawler completed',
      news_count: allNews.length,
      sources: NEWS_SOURCES.length
    })
  } catch (e) {
    return NextResponse.json({ error: 'Crawler failed' }, { status: 500 })
  }
}
