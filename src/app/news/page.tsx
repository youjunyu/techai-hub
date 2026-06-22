'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  summary?: string
  published_at?: string
  category?: string
  importance: number
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    fetch(`/api/news?${params}`)
      .then(r => r.json())
      .then(data => {
        setNews(data.news || [])
        setLoading(false)
      })
  }, [category, search])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">科技资讯</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部分类</option>
            <option value="energy">能源层</option>
            <option value="idc">基础设施层</option>
            <option value="hardware">硬件层</option>
            <option value="platform">平台层</option>
            <option value="application">应用层</option>
          </select>
          <input
            type="text"
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : news.length > 0 ? (
          <div className="space-y-4">
            {news.map((item: NewsItem) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium text-lg">
                      {item.title}
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{item.source}</span>
                      {item.published_at && (
                        <span>{new Date(item.published_at).toLocaleString()}</span>
                      )}
                      {item.category && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <p className="mt-3 text-gray-600 text-sm">{item.summary}</p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.importance >= 4 ? 'bg-red-100 text-red-700' :
                      item.importance >= 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.importance}级
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">暂无资讯</div>
        )}
      </main>
    </div>
  )
}
