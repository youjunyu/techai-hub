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
  created_at: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetch(`/api/reports?userId=${session.user.id}`)
          .then(r => r.json())
          .then(data => {
            setReports(data.reports || [])
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">投资分析日报</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">请登录查看您的日报</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-800">登录</Link>
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
                <Link href={`/reports/${report.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                  查看详情 →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            暂无日报
          </div>
        )}
      </main>
    </div>
  )
}
