'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function TagDetailPage({ params }: { params: { id: string } }) {
  const [tag, setTag] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tags/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setTag(data.tag)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>
  if (!tag) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">标签不存在</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/tags" className="text-gray-600 hover:text-blue-600">← 返回</Link>
            <h1 className="text-2xl font-bold text-gray-900">{tag.name}</h1>
            {tag.category && (
              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                {tag.category}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tag.description && (
          <p className="text-gray-600 mb-8">{tag.description}</p>
        )}

        {/* Stocks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold mb-4">关联标的</h3>
          {tag.stocks && tag.stocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">代码</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">名称</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">市场</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">行业</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">核心逻辑</th>
                  </tr>
                </thead>
                <tbody>
                  {tag.stocks.map((stock: any) => (
                    <tr key={stock.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-mono text-sm">{stock.code}</td>
                      <td className="py-3 px-4">{stock.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          stock.market === 'A' ? 'bg-red-100 text-red-700' :
                          stock.market === 'HK' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {stock.market}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{stock.sector || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{stock.core_logic || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">暂无关联标的</p>
          )}
        </div>
      </main>
    </div>
  )
}
