'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface Chain {
  id: string
  name: string
  description: string
  is_public: boolean
  layers?: any[]
  creator?: { name: string }
}

export default function ChainsPage() {
  const [chains, setChains] = useState<Chain[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    fetch('/api/chains')
      .then(r => r.json())
      .then(data => {
        setChains(data.chains || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">产业链知识库</h1>
            {user && (
              <Link href="/chains/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                新建产业链
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : chains.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chains.map((chain: Chain) => (
              <Link key={chain.id} href={`/chains/${chain.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{chain.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{chain.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs ${chain.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {chain.is_public ? '公开' : '私有'}
                  </span>
                  {chain.creator && (
                    <span className="text-sm text-gray-500">by {chain.creator.name}</span>
                  )}
                </div>
                {chain.layers && (
                  <div className="mt-4 text-sm text-gray-500">
                    {chain.layers.length} 个层级
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            暂无产业链，{user && <Link href="/chains/new" className="text-blue-600">创建第一个</Link>}
          </div>
        )}
      </main>
    </div>
  )
}
