'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

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
          {['overview', 'tags', 'stocks', 'news', 'chains', 'cron', 'errors'].map((tab) => (
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
               tab === 'news' ? '资讯管理' :
               tab === 'cron' ? '定时任务' : tab === 'errors' ? '异常日志' : '产业链管理'}
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
          <NewsManager />
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

        {/* Cron */}
        {activeTab === 'cron' && <CronManager />}

        {/* Errors */}
        {activeTab === 'errors' && <ErrorLogManager />}
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

function NewsManager() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const runCrawler = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/crawler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: 'all' }),
      })
      const data = await res.json()
      if (res.ok) {
        const total = data.results?.reduce((s: number, r: any) => s + r.count, 0) || 0
        setMessage(`爬虫完成：共爬取 ${total} 条资讯 ✓`)
      } else {
        setMessage(`爬虫失败: ${data.error || '未知错误'}`)
      }
    } catch (e: any) {
      setMessage(`爬虫失败: ${e.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const seedData = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' })
      const data = await res.json()
      setMessage(data.message || '数据填充完成 ✓')
    } catch (e: any) {
      setMessage(`填充失败: ${e.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const runAIProcess = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/crawler/ai-process?batch=20', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage(`AI 摘要完成：处理 ${data.processed || 0}/${data.total || 0} 条 ✓`)
      } else {
        setMessage(`AI 摘要失败: ${data.error || '未知错误'}`)
      }
    } catch (e: any) {
      setMessage(`AI 摘要失败: ${e.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">资讯管理</h3>
      <p className="text-gray-500 mb-4">资讯通过爬虫自动抓取，或手动添加</p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={runCrawler}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '运行中...' : '运行爬虫'}
        </button>
        <button
          onClick={runAIProcess}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '运行中...' : '运行 AI 摘要'}
        </button>
        <button
          onClick={seedData}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          填充示例数据
        </button>
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

function CronManager() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/cron/config')
      const data = await res.json()
      setConfig(data.config || {
        enabled: true,
        morning_time: '08:00',
        evening_time: '20:00',
        sources: ['36kr','jiqizhixin','qbitai','cailian','ithome','leifeng','icviews','mydrivers','eastmoney','netease'],
        generate_report: true,
        send_email: false,
      })
    } catch {
      setConfig({
        enabled: true,
        morning_time: '08:00',
        evening_time: '20:00',
        sources: ['36kr','jiqizhixin','qbitai','cailian','ithome','leifeng','icviews','mydrivers','eastmoney','netease'],
        generate_report: true,
        send_email: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/cron/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setMessage('配置已保存 ✓')
      } else {
        setMessage('保存失败')
      }
    } catch {
      setMessage('保存失败')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const runNow = async () => {
    setRunning(true)
    setMessage('')
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token

      // Step 1: Run crawler
      setMessage('正在爬取资讯...')
      const crawlerRes = await fetch('/api/crawler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sources: 'all' }),
      })
      const crawlerData = await crawlerRes.json()
      const crawlerCount = crawlerData.results?.reduce((s: number, r: any) => s + r.count, 0) || 0

      // Step 2: Run AI summary (process unprocessed news)
      setMessage(`爬取完成: ${crawlerCount} 条，正在 AI 摘要...`)
      const aiRes = await fetch('/api/crawler/ai-process?batch=20', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const aiData = await aiRes.json()
      const aiCount = aiData.processed || 0

      // Step 3: Generate report
      setMessage(`AI 摘要完成: ${aiCount} 条，正在生成日报...`)
      const reportRes = await fetch('/api/cron/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ runCrawler: false, runReport: true }),
      })
      const reportData = await reportRes.json()

      setMessage(`全部完成：爬取 ${crawlerCount} 条，AI 处理 ${aiCount} 条，生成日报 ✓`)
    } catch (e: any) {
      setMessage(`执行失败: ${e.message}`)
    } finally {
      setRunning(false)
      setTimeout(() => setMessage(''), 8000)
    }
  }

  const allSources = [
    { key: '36kr', label: '36氪' },
    { key: 'jiqizhixin', label: '机器之心' },
    { key: 'qbitai', label: '量子位' },
    { key: 'cailian', label: '财联社' },
    { key: 'ithome', label: 'IT之家' },
    { key: 'leifeng', label: '雷锋网' },
    { key: 'icviews', label: '半导体行业观察' },
    { key: 'mydrivers', label: '快科技' },
    { key: 'eastmoney', label: '东方财富' },
    { key: 'netease', label: '网易科技' },
  ]

  if (loading) return <div className="bg-white rounded-xl p-6">加载中...</div>

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">定时任务配置</h3>
        <div className="flex gap-3">
          <button
            onClick={runNow}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {running ? '执行中...' : '立即执行爬虫+日报'}
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">启用定时任务</label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">早间执行时间</label>
            <input
              type="time"
              value={config.morning_time || '08:00'}
              onChange={(e) => setConfig({ ...config, morning_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">晚间执行时间</label>
            <input
              type="time"
              value={config.evening_time || '20:00'}
              onChange={(e) => setConfig({ ...config, evening_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">资讯源（勾选启用）</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {allSources.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(config.sources || []).includes(s.key)}
                  onChange={(e) => {
                    const sources = e.target.checked
                      ? [...(config.sources || []), s.key]
                      : (config.sources || []).filter((k: string) => k !== s.key)
                    setConfig({ ...config, sources })
                  }}
                  className="w-4 h-4"
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.generate_report}
              onChange={(e) => setConfig({ ...config, generate_report: e.target.checked })}
              className="w-4 h-4"
            />
            执行后生成日报
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.send_email}
              onChange={(e) => setConfig({ ...config, send_email: e.target.checked })}
              className="w-4 h-4"
            />
            发送邮件通知
          </label>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">定时任务说明</p>
          <p>• 爬虫和日报生成由外部 Cron 服务触发，调用 API: <code>/api/cron/execute?secret=CRON_SECRET</code></p>
          <p>• 可配置 Vercel Cron Jobs 或自建 cron 服务，每天早上 {config.morning_time || '08:00'} 和晚上 {config.evening_time || '20:00'} 执行</p>
          <p>• 环境变量 CRON_SECRET 用于验证请求来源</p>
        </div>
      </div>
    </div>
  )
}

function ErrorLogManager() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadLogs()
  }, [filter])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const url = filter !== 'all' ? `/api/log/list?source=${filter}` : '/api/log/list'
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setLogs(data.logs || [])
      } else {
        setMessage(`加载失败: ${data.error || '未知错误'}`)
      }
    } catch (e: any) {
      setMessage(`加载失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('确定清空所有异常日志？')) return
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/log/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setLogs([])
        setMessage('日志已清空 ✓')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('清空失败')
      }
    } catch {
      setMessage('清空失败')
    }
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString('zh-CN')
  }

  const truncate = (str: string, len: number) => {
    if (!str) return '-'
    return str.length > len ? str.slice(0, len) + '...' : str
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">异常日志</h3>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">全部来源</option>
            <option value="api">API</option>
            <option value="client">客户端</option>
            <option value="crawler">爬虫</option>
            <option value="report">日报</option>
            <option value="system">系统</option>
          </select>
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            刷新
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            清空
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无异常日志</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 w-32">时间</th>
                <th className="text-left py-2 w-20">来源</th>
                <th className="text-left py-2 w-40">位置</th>
                <th className="text-left py-2">错误信息</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 text-xs text-gray-500">{formatTime(log.created_at)}</td>
                  <td className="py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      log.source === 'api' ? 'bg-blue-100 text-blue-700' :
                      log.source === 'client' ? 'bg-purple-100 text-purple-700' :
                      log.source === 'crawler' ? 'bg-orange-100 text-orange-700' :
                      log.source === 'report' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.source}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-gray-600" title={log.endpoint}>
                    {truncate(log.endpoint, 30)}
                  </td>
                  <td className="py-2 text-xs text-red-600" title={log.error_message}>
                    {truncate(log.error_message, 80)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
