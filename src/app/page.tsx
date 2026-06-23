'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface NewsItem {
  id: string
  title: string
  source: string
  category?: string
  importance: number
  published_at?: string
  summary?: string
}

interface StatItem {
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()

    // 监听 auth 状态变化
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const loadData = async () => {
    // Load news
    const res = await fetch('/api/news?limit=5')
    const data = await res.json()
    setNews(data.news || [])

    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession()
    setUser(session?.user || null)

    setLoading(false)
  }

  const stats: StatItem[] = [
    { label: '科技资讯', value: '实时追踪', change: 'AI/机器人/半导体', trend: 'up' },
    { label: '产业链分析', value: '8+ 核心产业链', change: '覆盖AI全栈', trend: 'up' },
    { label: '投资标签', value: '智能标签池', change: 'HBM/光模块/机器人', trend: 'neutral' },
    { label: 'AI 日报', value: '每日自动生成', change: 'AI驱动', trend: 'up' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI 科技趋势与投资研究
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              实时追踪 AI 产业链动态，智能生成每日投资分析报告，
              助您在科技浪潮中把握投资先机
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {user ? (
                <>
                  <Link href="/chains" className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition">
                    探索产业链
                  </Link>
                  <Link href="/reports" className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition">
                    查看日报
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition">
                    免费注册
                  </Link>
                  <Link href="/login" className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition">
                    登录
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className={`text-sm mt-1 flex items-center gap-1 ${
                stat.trend === 'up' ? 'text-green-600' :
                stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.change}
                {stat.trend === 'up' && <span>↑</span>}
                {stat.trend === 'down' && <span>↓</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">最新资讯</h2>
          <Link href="/news" className="text-blue-600 hover:text-blue-800 text-sm">
            查看全部 →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.slice(0, 6).map((item: NewsItem) => (
              <Link key={item.id} href={`/news/${item.id}`} className="block">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-center gap-2 mb-3">
                    {item.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {item.category}
                      </span>
                    )}
                    <span className="text-yellow-500 text-xs">
                      {'★'.repeat(item.importance)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{item.source}</span>
                    {item.published_at && (
                      <span>{new Date(item.published_at).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/chains" className="group">
              <div className="bg-gray-50 rounded-xl p-8 text-center hover:bg-blue-50 transition">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">产业链分析</h3>
                <p className="text-gray-600 text-sm">
                  AI全栈产业链图谱，从芯片到应用全覆盖
                </p>
              </div>
            </Link>
            <Link href="/tags" className="group">
              <div className="bg-gray-50 rounded-xl p-8 text-center hover:bg-purple-50 transition">
                <div className="text-4xl mb-4">🏷️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">智能标签池</h3>
                <p className="text-gray-600 text-sm">
                  HBM、光模块、机器人等核心赛道标签化管理
                </p>
              </div>
            </Link>
            <Link href="/reports" className="group">
              <div className="bg-gray-50 rounded-xl p-8 text-center hover:bg-orange-50 transition">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">AI 日报</h3>
                <p className="text-gray-600 text-sm">
                  每日自动生成投资分析报告，邮件推送
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p>© 2026 TechAI Hub | AI科技趋势与投资研究平台</p>
          <p className="text-sm mt-2">本平台内容由 AI 辅助生成，仅供参考，不构成投资建议</p>
        </div>
      </footer>
    </div>
  )
}
