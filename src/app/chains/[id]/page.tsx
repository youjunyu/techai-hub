'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function ChainDetailPage({ params }: { params: { id: string } }) {
  const [chain, setChain] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/chains/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setChain(data.chain)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>
  if (!chain) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">产业链不存在</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/chains" className="text-gray-600 hover:text-blue-600">← 返回</Link>
            <h1 className="text-2xl font-bold text-gray-900">{chain.name}</h1>
            <span className={`px-2 py-1 rounded-full text-xs ${chain.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {chain.is_public ? '公开' : '私有'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 mb-8">{chain.description}</p>

        {/* Layers */}
        <div className="space-y-8">
          {chain.layers?.map((layer: any, idx: number) => (
            <div key={layer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {layer.layer_order}
                </span>
                <h3 className="text-xl font-bold text-gray-900">{layer.layer_name}</h3>
              </div>
              {layer.description && (
                <p className="text-gray-600 mb-4">{layer.description}</p>
              )}
              {layer.key_metrics && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">关键指标：</span>
                  <span className="text-sm text-gray-700">{layer.key_metrics}</span>
                </div>
              )}
              {layer.nodes && layer.nodes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {layer.nodes.map((node: any) => (
                    <div key={node.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="font-medium text-gray-900">{node.node_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{node.node_type}</div>
                      {node.related_stocks && node.related_stocks.length > 0 && (
                        <div className="mt-2">
                          {node.related_stocks.map((stock: string, i: number) => (
                            <span key={i} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded mr-1">
                              {stock}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
