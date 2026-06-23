'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface TagDetail {
  id: string
  name: string
  category: string
  description: string | null
  color: string | null
  created_at: string
  stocks: {
    id: string
    name: string
    code: string
    market: string
    sector: string | null
    core_logic: string | null
  }[]
  news: {
    id: string
    title: string
    source: string
    importance: number
    published_at: string | null
  }[]
}

export default function TagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tag, setTag] = useState<TagDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    loadTag()
  }, [id])

  const loadTag = async () => {
    const res = await fetch(`/api/tags/${id}`)
    const data = await res.json()
    if (res.ok) {
      setTag(data.tag)
      
      // Also load related news
      const newsRes = await fetch(`/api/news?tag=${encodeURIComponent(data.tag.name)}&limit=10`)
      const newsData = await newsRes.json()
      if (newsData.news) {
        setTag(prev => prev ? { ...prev, news: newsData.news } : null)
      }
    }
    setLoading(false)
  }

  const handleAIAnalysis = async () => {
    if (!tag) return
    setAnalyzing(true)
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/tags/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tagId: tag.id, tagName: tag.name, category: tag.category }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiAnalysis(data.analysis)
      } else {
        alert(data.error || '分析失败')
      }
    } catch (e) {
      alert('分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">标签不存在</p>
          <Link href="/tags" className="text-blue-600 hover:text-blue-800">← 返回标签列表</Link>
        </div>
      </div>
    )
  }

  const categoryColors: Record<string, string> = {
    'AI算力': 'bg-purple-100 text-purple-700',
    '光模块': 'bg-blue-100 text-blue-700',
    'HBM存储': 'bg-indigo-100 text-indigo-700',
    '人形机器人': 'bg-green-100 text-green-700',
    '半导体': 'bg-gray-100 text-gray-700',
    '新能源': 'bg-orange-100 text-orange-700',
    'AI应用': 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/tags" className="text-blue-600 hover:text-blue-800 text-sm">
            ← 返回标签列表
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tag Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${categoryColors[tag.category] || 'bg-gray-100 text-gray-700'}`}>
              {tag.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-900">{tag.name}</h1>
          </div>
          {tag.description && (
            <p className="text-gray-600 text-lg">{tag.description}</p>
          )}
          <div className="mt-4 flex gap-6 text-sm text-gray-500">
            <span>关联股票: <strong className="text-gray-900">{tag.stocks?.length || 0}</strong> 只</span>
            <span>相关资讯: <strong className="text-gray-900">{tag.news?.length || 0}</strong> 条</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🤖 AI 赛道分析
            </h2>
            <button
              onClick={handleAIAnalysis}
              disabled={analyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {analyzing ? '分析中...' : '生成分析'}
            </button>
          </div>
          {aiAnalysis ? (
            <div className="prose prose-sm max-w-none bg-white/60 rounded-lg p-4">
              {aiAnalysis.split('\n').map((line, i) => (
                <p key={i} className="text-gray-700 mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">点击「生成分析」获取 AI 对该赛道的投资分析</p>
          )}
        </div>

        {/* Related Stocks */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">关联股票池</h2>
          {tag.stocks && tag.stocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tag.stocks.map((stock) => (
                <div key={stock.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{stock.name}</h3>
                      <p className="text-sm text-gray-500">{stock.code} · {stock.market}</p>
                    </div>
                    {stock.sector && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {stock.sector}
                      </span>
                    )}
                  </div>
                  {stock.core_logic && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{stock.core_logic}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              暂无关联股票
            </div>
          )}
        </div>

        {/* Related News */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">相关资讯</h2>
          {tag.news && tag.news.length > 0 ? (
            <div className="space-y-4">
              {tag.news.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`} className="block">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">{item.source}</span>
                      <span className="text-yellow-500 text-xs">
                        {'★'.repeat(item.importance)}
                      </span>
                      {item.published_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.published_at).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600">{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              暂无相关资讯
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
