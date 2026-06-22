import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TechAI Hub - AI科技趋势与投资研究',
  description: 'AI科技趋势分析、产业链研究、投资分析日报平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
