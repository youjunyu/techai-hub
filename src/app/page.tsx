'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [chains, setChains] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })

    // Fetch data
    Promise.all([
      fetch('/api/chains').then(r => r.json()),
      fetch('/api/tags').then(r => r.json()),
      fetch('/api/news?limit=10').then(r => r.json()),
    ]).then(([chainsData, tagsData, newsData]) => {
      setChains(chainsData.chains || [])
      setTags(tagsData.tags || [])
      setNews(newsData.news || [])
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                TechAI Hub
              </Link>
              <span className="ml-2 text-sm text-gray-500">AI科技趋势与投资研究</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/news" className="text-gray-600 hover:text-blue-600">资讯</Link>
              <Link href="/chains" className="text-gray-600 hover:text-blue-600">产业链</Link>
              <Link href="/tags" className="text-gray-600 hover:text-blue-600">标签</Link>
              <Link href="/reports" className="text-gray-600 hover:text-blue-600">日报</Link>
              {user ? (
                <>
                  <Link href="/profile" className="text-gray-600 hover:text-blue-600">个人中心</Link>
                  <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">退出</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-blue-600">登录</Link>
                  <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    注册
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI科技趋势与投资研究平台
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            聚合全球科技资讯，构建AI产业链知识库，生成个性化投资分析日报
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{chains.length}</div>
            <div className="text-gray-600">产业链</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{tags.length}</div>
            <div className="text-gray-600">科技标签</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{news.length}</div>
            <div className="text-gray-600">资讯文章</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-orange-600">5</div>
            <div className="text-gray-600">市场覆盖</div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest News */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-4">最新资讯</h2>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-4">
                  {news.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium">
                        {item.title}
                      </a>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{item.source}</span>
                        {item.published_at && (
                          <span>{new Date(item.published_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无资讯，等待爬虫抓取...</p>
              )}
              <Link href="/news" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
                查看全部 →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Industry Chains */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-4">热门产业链</h2>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : chains.length > 0 ? (
                <div className="space-y-3">
                  {chains.slice(0, 5).map((chain: any) => (
                    <Link key={chain.id} href={`/chains/${chain.id}`}
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                      <div className="font-medium text-gray-900">{chain.name}</div>
                      <div className="text-sm text-gray-500 truncate">{chain.description}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无产业链</p>
              )}
              <Link href="/chains" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
                查看全部 →
              </Link>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-4">热门标签</h2>
              {loading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse h-8 w-16 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
              ) : tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((tag: any) => (
                    <Link key={tag.id} href={`/tags/${tag.id}`}
                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm hover:bg-blue-200">
                      {tag.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无标签</p>
              )}
              <Link href="/tags" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
                查看全部 →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>© 2026 TechAI Hub. All rights reserved.</p>
          <p className="mt-2 text-sm">AI科技趋势与投资研究平台 | 每日投资分析日报</p>
        </div>
      </footer>
    </div>
  )
}
