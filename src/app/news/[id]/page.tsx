'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface NewsDetail {
  id: string
  title: string
  source: string
  url: string
  summary: string | null
  content: string | null
  published_at: string | null
  category: string | null
  importance: number
  tags: string[] | null
  view_count: number
  created_at: string
}

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const [news, setNews] = useState<NewsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNews()
  }, [params.id])

  const loadNews = async () => {
    try {
      const res = await fetch(`/api/news/${params.id}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '加载失败')
      } else {
        setNews(data.news)
      }
    } catch (e) {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '资讯不存在'}</p>
          <Link href="/news" className="text-blue-600 hover:text-blue-800">
            ← 返回资讯列表
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const importanceStars = '★'.repeat(news.importance) + '☆'.repeat(5 - news.importance)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/news" className="text-blue-600 hover:text-blue-800 text-sm">
            ← 返回资讯列表
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {news.category || '综合'}
              </span>
              <span className="text-yellow-500 text-sm">{importanceStars}</span>
              {news.tags && news.tags.length > 0 && (
                <div className="flex gap-1">
                  {news.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
              {news.title}
            </h1>

            <div className="flex items-center text-sm text-gray-500 gap-4">
              <span>来源: {news.source}</span>
              <span>发布时间: {formatDate(news.published_at)}</span>
              <span>阅读: {news.view_count || 0}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {news.summary && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-gray-700 leading-relaxed">{news.summary}</p>
              </div>
            )}

            {news.content ? (
              <div className="prose prose-gray max-w-none">
                {news.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                暂无详细内容
              </div>
            )}

            {/* Source Link */}
            {news.url && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  查看原文 →
                </a>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
