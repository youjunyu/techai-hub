'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface Follow {
  id: string
  follow_type: 'tag' | 'stock'
  target_id: string
  target_name: string
  created_at: string
}

export default function WatchlistPage() {
  const [follows, setFollows] = useState<Follow[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession()
    setUser(session?.user || null)
    
    if (session?.user) {
      const token = session.access_token
      const res = await fetch('/api/follows', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      setFollows(data.follows || [])
    }
    setLoading(false)
  }

  const handleUnfollow = async (followId: string) => {
    const token = (await supabaseClient.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/follows', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ follow_id: followId }),
    })
    if (res.ok) {
      setFollows(follows.filter(f => f.id !== followId))
    }
  }

  const tagFollows = follows.filter(f => f.follow_type === 'tag')
  const stockFollows = follows.filter(f => f.follow_type === 'stock')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">请登录查看自选股</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">我的自选</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {follows.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有自选</h3>
            <p className="text-gray-500 mb-6">去标签页或股票池添加你关注的标的吧</p>
            <div className="flex justify-center gap-4">
              <Link href="/tags" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                浏览标签
              </Link>
              <Link href="/chains" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                产业链
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tags Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🏷️ 关注标签 ({tagFollows.length})
              </h2>
              {tagFollows.length > 0 ? (
                <div className="space-y-3">
                  {tagFollows.map((follow) => (
                    <div key={follow.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
                      <Link href={`/tags/${follow.target_id}`} className="flex-1">
                        <div className="font-medium text-gray-900 hover:text-blue-600">{follow.target_name}</div>
                        <div className="text-sm text-gray-500">标签</div>
                      </Link>
                      <button
                        onClick={() => handleUnfollow(follow.id)}
                        className="text-red-500 hover:text-red-700 text-sm px-3 py-1"
                      >
                        取消关注
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                  暂无关注的标签
                </div>
              )}
            </div>

            {/* Stocks Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📈 关注股票 ({stockFollows.length})
              </h2>
              {stockFollows.length > 0 ? (
                <div className="space-y-3">
                  {stockFollows.map((follow) => (
                    <div key={follow.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{follow.target_name}</div>
                        <div className="text-sm text-gray-500">股票</div>
                      </div>
                      <button
                        onClick={() => handleUnfollow(follow.id)}
                        className="text-red-500 hover:text-red-700 text-sm px-3 py-1"
                      >
                        取消关注
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                  暂无关注的股票
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
