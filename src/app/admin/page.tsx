'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← 返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          {['overview', 'tags', 'stocks', 'news', 'chains'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' ? '概览' :
               tab === 'tags' ? '标签管理' :
               tab === 'stocks' ? '股票池' :
               tab === 'news' ? '资讯管理' : '产业链管理'}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickStat title="资讯总数" value="加载中..." action="/api/news" />
            <QuickStat title="标签数量" value="加载中..." action="/api/tags" />
            <QuickStat title="产业链" value="加载中..." action="/api/chains" />
            <QuickStat title="日报数量" value="加载中..." action="/api/reports" />
          </div>
        )}

        {/* Tags */}
        {activeTab === 'tags' && (
          <TagManager />
        )}

        {/* Stocks */}
        {activeTab === 'stocks' && (
          <StockManager />
        )}

        {/* News */}
        {activeTab === 'news' && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">资讯管理</h3>
            <p className="text-gray-500 mb-4">资讯通过爬虫自动抓取，或手动添加</p>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  const res = await fetch('/api/crawler/run', { method: 'POST' })
                  const data = await res.json()
                  alert(data.message || JSON.stringify(data))
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                运行爬虫
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/api/admin/seed', { method: 'POST' })
                  const data = await res.json()
                  alert(data.message || JSON.stringify(data))
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                填充示例数据
              </button>
            </div>
          </div>
        )}

        {/* Chains */}
        {activeTab === 'chains' && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">产业链管理</h3>
            <p className="text-gray-500 mb-4">通过产业链页面创建和管理产业链结构</p>
            <Link href="/chains/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block">
              创建产业链
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function QuickStat({ title, value, action }: { title: string; value: string; action: string }) {
  const [count, setCount] = useState('...')

  useEffect(() => {
    fetch(action)
      .then(r => r.json())
      .then(data => {
        if (data.tags) setCount(`${data.tags.length} 个`)
        else if (data.news) setCount(`${data.news.length} 条`)
        else if (data.chains) setCount(`${data.chains.length} 个`)
        else if (data.reports) setCount(`${data.reports.length} 份`)
        else setCount('0')
      })
      .catch(() => setCount('0'))
  }, [action])

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{count}</div>
    </div>
  )
}

function TagManager() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', description: '', color: '#3b82f6' })

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(data => {
      setTags(data.tags || [])
      setLoading(false)
    })
  }, [])

  const handleCreate = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: '', category: '', description: '', color: '#3b82f6' })
      // Reload
      const data = await res.json()
      setTags([...tags, data.tag])
    }
  }

  if (loading) return <div className="bg-white rounded-xl p-6">加载中...</div>

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">标签列表</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {showForm ? '取消' : '+ 新建标签'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="标签名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">选择分类</option>
            <option value="AI算力">AI算力</option>
            <option value="光模块">光模块</option>
            <option value="HBM存储">HBM存储</option>
            <option value="人形机器人">人形机器人</option>
            <option value="半导体">半导体</option>
            <option value="新能源">新能源</option>
          </select>
          <textarea
            placeholder="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            创建
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tags.map((tag: any) => (
          <div key={tag.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium text-gray-900">{tag.name}</span>
                <span className="ml-2 text-xs text-gray-500">{tag.category}</span>
              </div>
            </div>
            {tag.description && (
              <p className="text-xs text-gray-500 mt-1">{tag.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StockManager() {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stocks').then(r => r.json()).then(data => {
      setStocks(data.stocks || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="bg-white rounded-xl p-6">加载中...</div>

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">股票池 ({stocks.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2">名称</th>
              <th className="text-left py-2">代码</th>
              <th className="text-left py-2">市场</th>
              <th className="text-left py-2">板块</th>
              <th className="text-left py-2">标签</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s: any) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2">{s.code}</td>
                <td className="py-2">{s.market}</td>
                <td className="py-2">{s.sector || '-'}</td>
                <td className="py-2">{Array.isArray(s.tags) ? s.tags.join(', ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
