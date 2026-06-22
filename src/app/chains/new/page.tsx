'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function NewChainPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [layers, setLayers] = useState([
    { layer_name: '', layer_order: 1, description: '', key_metrics: '' },
    { layer_name: '', layer_order: 2, description: '', key_metrics: '' },
  ])

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    })
  }, [router])

  const addLayer = () => {
    setLayers([...layers, {
      layer_name: '',
      layer_order: layers.length + 1,
      description: '',
      key_metrics: ''
    }])
  }

  const updateLayer = (index: number, field: string, value: string) => {
    const updated = [...layers]
    updated[index] = { ...updated[index], [field]: value }
    setLayers(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/chains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          is_public: isPublic,
          layers: layers.filter(l => l.layer_name)
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '创建失败')
      } else {
        router.push(`/chains/${data.chain.id}`)
      }
    } catch (e) {
      setError('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">新建产业链</h1>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">产业链名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">公开（所有人可见）</span>
              </label>
            </div>
          </div>

          {/* Layers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">产业链层级</h3>
            <div className="space-y-4">
              {layers.map((layer, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">层级名称</label>
                      <input
                        type="text"
                        value={layer.layer_name}
                        onChange={(e) => updateLayer(i, 'layer_name', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">顺序</label>
                      <input
                        type="number"
                        value={layer.layer_order}
                        onChange={(e) => updateLayer(i, 'layer_order', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">描述</label>
                      <input
                        type="text"
                        value={layer.description}
                        onChange={(e) => updateLayer(i, 'description', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">关键指标</label>
                      <input
                        type="text"
                        value={layer.key_metrics}
                        onChange={(e) => updateLayer(i, 'key_metrics', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLayer}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              + 添加层级
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '创建中...' : '创建产业链'}
          </button>
        </form>
      </div>
    </div>
  )
}
