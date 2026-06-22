'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface Tag {
  id: string
  name: string
  category: string
  description: string
  stocks?: any[]
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(data => {
        setTags(data.tags || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">科技标签</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : tags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map((tag: Tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tag.name}</h3>
                {tag.category && (
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 mb-3">
                    {tag.category}
                  </span>
                )}
                <p className="text-gray-600 text-sm mb-4">{tag.description}</p>
                {tag.stocks && tag.stocks.length > 0 && (
                  <div className="text-sm text-gray-500">
                    关联 {tag.stocks.length} 只标的
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">暂无标签</div>
        )}
      </main>
    </div>
  )
}
