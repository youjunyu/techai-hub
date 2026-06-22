'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface Tag {
  id: string
  name: string
  category: string
  description: string | null
  color: string | null
  stock_count?: number
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [follows, setFollows] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession()
    setUser(session?.user || null)

    // Load tags
    const res = await fetch('/api/tags')
    const data = await res.json()
    setTags(data.tags || [])

    // Load user follows
    if (session?.user) {
      const token = session.access_token
      const followsRes = await fetch('/api/follows', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const followsData = await followsRes.json()
      const tagFollows = new Set((followsData.follows || [])
        .filter((f: any) => f.follow_type === 'tag')
        .map((f: any) => f.target_id))
      setFollows(tagFollows)
    }

    setLoading(false)
  }

  const handleFollow = async (tagId: string, tagName: string) => {
    if (!user) {
      alert('请先登录')
      return
    }
    const token = (await supabaseClient.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/follows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ follow_type: 'tag', target_id: tagId, target_name: tagName }),
    })
    if (res.ok) {
      setFollows(prev => new Set(prev).add(tagId))
    } else {
      const data = await res.json()
      alert(data.error || '操作失败')
    }
  }

  const handleUnfollow = async (tagId: string) => {
    const token = (await supabaseClient.auth.getSession()).data.session?.access_token
    // Get follow_id first
    const followsRes = await fetch('/api/follows', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const followsData = await followsRes.json()
    const follow = (followsData.follows || []).find((f: any) => f.target_id === tagId)
    
    if (follow) {
      const res = await fetch('/api/follows', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ follow_id: follow.id }),
      })
      if (res.ok) {
        setFollows(prev => {
          const next = new Set(prev)
          next.delete(tagId)
          return next
        })
      }
    }
  }

  const filteredTags = category ? tags.filter(t => t.category === category) : tags

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">智能标签池</h1>
          <p className="text-gray-500 mt-1">追踪 AI 核心赛道，把握投资风向</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部分类</option>
            <option value="AI算力">AI算力</option>
            <option value="光模块">光模块</option>
            <option value="HBM存储">HBM存储</option>
            <option value="人形机器人">人形机器人</option>
            <option value="半导体">半导体</option>
            <option value="新能源">新能源</option>
            <option value="AI应用">AI应用</option>
          </select>
          <div className="text-sm text-gray-500 self-center">
            共 {filteredTags.length} 个标签
          </div>
        </div>

        {/* Tags Grid */}
        {filteredTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTags.map((tag) => {
              const isFollowing = follows.has(tag.id)
              return (
                <div key={tag.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(tag.category)}`}>
                        {tag.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{tag.name}</h3>
                    </div>
                    {isFollowing ? (
                      <button
                        onClick={() => handleUnfollow(tag.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                      >
                        已关注
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(tag.id, tag.name)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
                      >
                        + 关注
                      </button>
                    )}
                  </div>
                  
                  {tag.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tag.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {tag.stock_count !== undefined ? `${tag.stock_count} 只股票` : ''}
                    </span>
                    <Link href={`/tags/${tag.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                      查看详情 →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">暂无匹配的标签</p>
          </div>
        )}
      </main>
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'AI算力': 'bg-purple-100 text-purple-700',
    '光模块': 'bg-blue-100 text-blue-700',
    'HBM存储': 'bg-indigo-100 text-indigo-700',
    '人形机器人': 'bg-green-100 text-green-700',
    '半导体': 'bg-gray-100 text-gray-700',
    '新能源': 'bg-orange-100 text-orange-700',
    'AI应用': 'bg-pink-100 text-pink-700',
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}
