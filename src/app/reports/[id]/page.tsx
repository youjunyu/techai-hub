'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then(r => r.json())
      .then(data => {
        setReport(data.report)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>
  if (!report) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">日报不存在</div>

  const content = report.content || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/reports" className="text-gray-600 hover:text-blue-600">← 返回</Link>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          </div>
          <p className="text-gray-500 mt-1">{report.report_date}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
          {/* Headline Summary */}
          {content.headline_summary && content.headline_summary.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                头条摘要
              </h2>
              <div className="space-y-3">
                {content.headline_summary.map((item: any, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{item.source}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.importance >= 4 ? 'bg-red-100 text-red-700' :
                        item.importance >= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.importance}级
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{item.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Industry Updates */}
          {content.industry_updates && content.industry_updates.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-600 rounded"></span>
                产业链动态
              </h2>
              <div className="space-y-4">
                {content.industry_updates.map((update: any, i: number) => (
                  <div key={i} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900">{update.chain_name}</h4>
                    <ul className="mt-2 space-y-1">
                      {update.updates?.map((u: string, j: number) => (
                        <li key={j} className="text-sm text-gray-600">• {u}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tag Analysis */}
          {content.tag_analysis && content.tag_analysis.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded"></span>
                标签分析
              </h2>
              <div className="space-y-4">
                {content.tag_analysis.map((tag: any, i: number) => (
                  <div key={i} className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">{tag.tag_name}</h4>
                    <p className="text-sm text-purple-700 mt-1">{tag.outlook}</p>
                    {tag.stocks && tag.stocks.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tag.stocks.map((s: any, j: number) => (
                          <div key={j} className="bg-white p-3 rounded-lg">
                            <div className="font-medium text-sm">{s.name} ({s.code})</div>
                            <div className="text-xs text-gray-600 mt-1">{s.analysis}</div>
                            <div className="text-xs text-red-600 mt-1">风险: {s.risk}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Investment Advice */}
          {content.investment_advice && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-600 rounded"></span>
                投资建议
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{content.investment_advice}</p>
              </div>
            </section>
          )}
        </div>

        <div className="mt-8 text-center">
          <span className={`px-3 py-1 rounded-full text-sm ${report.is_sent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {report.is_sent ? '已发送至邮箱' : '未发送'}
          </span>
        </div>
      </main>
    </div>
  )
}
