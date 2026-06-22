'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              TechAI Hub
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/news" className="text-gray-600 hover:text-gray-900 text-sm">资讯</Link>
              <Link href="/chains" className="text-gray-600 hover:text-gray-900 text-sm">产业链</Link>
              <Link href="/tags" className="text-gray-600 hover:text-gray-900 text-sm">标签</Link>
              <Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm">日报</Link>
              {user && (
                <Link href="/watchlist" className="text-gray-600 hover:text-gray-900 text-sm">⭐ 自选</Link>
              )}
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">个人中心</Link>
                <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">登录</Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  注册
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <Link href="/news" className="text-gray-600 hover:text-gray-900">资讯</Link>
              <Link href="/chains" className="text-gray-600 hover:text-gray-900">产业链</Link>
              <Link href="/tags" className="text-gray-600 hover:text-gray-900">标签</Link>
              <Link href="/reports" className="text-gray-600 hover:text-gray-900">日报</Link>
              {user && (
                <>
                  <Link href="/watchlist" className="text-gray-600 hover:text-gray-900">⭐ 自选</Link>
                  <Link href="/profile" className="text-gray-600 hover:text-gray-900">个人中心</Link>
                  <button onClick={handleLogout} className="text-left text-red-600">退出</button>
                </>
              )}
              {!user && (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900">登录</Link>
                  <Link href="/register" className="text-blue-600">注册</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
