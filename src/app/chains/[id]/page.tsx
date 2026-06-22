'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

interface ChainDetail {
  id: string
  name: string
  description: string
  icon: string | null
  layers: {
    id: string
    layer_name: string
    layer_order: number
    description: string | null
    nodes: {
      id: string
      node_name: string
      node_type: string
      description: string | null
      related_stocks: string[]
    }[]
  }[]
}

export default function ChainDetailPage({ params }: { params: { id: string } }) {
  const [chain, setChain] = useState<ChainDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChain()
  }, [params.id])

  const loadChain = async () => {
    const res = await fetch(`/api/chains/${params.id}`)
    const data = await res.json()
    if (res.ok) setChain(data.chain)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!chain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">产业链不存在</p>
          <Link href="/chains" className="text-blue-600 hover:text-blue-800">← 返回产业链列表</Link>
        </div>
      </div>
    )
  }

  const layerColors = [
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-orange-500 to-orange-600',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/chains" className="text-blue-600 hover:text-blue-800 text-sm">
            ← 返回产业链列表
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chain Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{chain.name}</h1>
          {chain.description && (
            <p className="text-gray-600 text-lg">{chain.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>共 {chain.layers?.length || 0} 个层级</span>
            <span>{(chain.layers || []).reduce((sum, l) => sum + (l.nodes?.length || 0), 0)} 个节点</span>
          </div>
        </div>

        {/* Chain Visualization */}
        {chain.layers && chain.layers.length > 0 ? (
          <div className="space-y-8">
            {chain.layers
              .sort((a, b) => a.layer_order - b.layer_order)
              .map((layer, layerIndex) => (
                <div key={layer.id}>
                  {/* Layer Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${layerColors[layerIndex % layerColors.length]} flex items-center justify-center text-white font-bold`}>
                      {layer.layer_order}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{layer.layer_name}</h2>
                      {layer.description && (
                        <p className="text-sm text-gray-500">{layer.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Layer Flow Arrow */}
                  {layerIndex < chain.layers.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="flex flex-col items-center text-gray-300">
                        <div className="w-px h-6 bg-gray-300"></div>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Nodes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-14">
                    {(layer.nodes || []).map((node) => (
                      <div
                        key={node.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-900">{node.node_name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {node.node_type || '节点'}
                          </span>
                        </div>

                        {node.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{node.description}</p>
                        )}

                        {node.related_stocks && node.related_stocks.length > 0 && (
                          <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-1">关联标的</p>
                            <div className="flex flex-wrap gap-1">
                              {node.related_stocks.slice(0, 4).map((stock, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                  {stock}
                                </span>
                              ))}
                              {node.related_stocks.length > 4 && (
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs">
                                  +{node.related_stocks.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">暂无层级数据</div>
            <p className="text-gray-400 text-sm">请通过管理后台添加产业链层级和节点</p>
          </div>
        )}
      </main>
    </div>
  )
}
