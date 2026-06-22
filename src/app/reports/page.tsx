'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'

interface Report {
  id: string
  user_id: string
  report_date: string
  title: string
  content: any
  is_sent: boolean
  sent_at: string | null
  created_at: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadReports(session.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const loadReports = async (userId: string) => {
    const res = await fetch(`/api/reports?userId=${userId}`)
    const data = await res.json()
    setReports(data.reports || [])
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!user) return
    setGenerating(true)
    setMessage('')

    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || '生成失败')
      } else {
        setMessage('日报生成成功！')
        loadReports(user.id)
      }
    } catch (e) {
      setMessage('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleSend = async (reportId: string) => {
    setMessage('')
    try {
      const token = (await supabaseClient.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/reports/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || '发送失败')
      } else {
        setMessage('邮件发送成功！')
        loadReports(user.id)
      }
    } catch (e) {
      setMessage('发送失败，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">投资分析日报</h1>
            {user && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? '生成中...' : '生成今日日报'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {!user ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">请登录查看您的日报</p>
            <a href="/login" className="text-blue-600 hover:text-blue-800">登录</a>
          </div>
        ) : loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : reports.length > 0 ? (
          <div className="space-y-6">
            {reports.map((report: Report) => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500">{report.report_date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${report.is_sent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {report.is_sent ? '已发送' : '未发送'}
                  </span>
                </div>

                {report.content?.headline_summary && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">头条摘要</h4>
                    <ul className="space-y-1">
                      {report.content.headline_summary.slice(0, 3).map((item: any, i: number) => (
                        <li key={i} className="text-sm text-gray-600">• {item.title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.content?.investment_advice && (
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800 line-clamp-2">{report.content.investment_advice.slice(0, 150)}...</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <a
                    href={`/reports/${report.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    查看详情 →
                  </a>
                  {!report.is_sent && (
                    <button
                      onClick={() => handleSend(report.id)}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      发送邮件 →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">暂无日报</p>
            {user && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? '生成中...' : '生成今日日报'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
