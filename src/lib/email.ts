/**
 * Email Service
 * Sends daily reports via nodemailer
 */

import nodemailer from 'nodemailer'

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.qq.com'
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587')
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })
  }
  return transporter
}

interface ReportContent {
  headline_summary: { title: string; source: string; importance: number; summary: string }[]
  industry_updates: { chain_name: string; updates: string[] }[]
  tag_analysis: { tag_name: string; outlook: string; stocks: { code: string; name: string; analysis: string; risk: string }[] }[]
  investment_advice: string
}

export async function sendReportEmail(
  to: string,
  reportTitle: string,
  reportDate: string,
  content: ReportContent
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter()

    // Build HTML email
    const headlineHtml = (content.headline_summary || []).map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; color: #1a1a1a;">${item.title}</div>
          <div style="font-size: 13px; color: #666; margin-top: 4px;">${item.summary}</div>
          <div style="font-size: 12px; color: #999; margin-top: 4px;">${item.source} | 重要性: ${'★'.repeat(item.importance)}</div>
        </td>
      </tr>
    `).join('')

    const industryHtml = (content.industry_updates || []).map((update) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; color: #1a1a1a;">${update.chain_name}</div>
          <ul style="margin: 8px 0 0 16px; padding: 0; font-size: 14px; color: #444;">
            ${(update.updates || []).map((u: string) => `<li>${u}</li>`).join('')}
          </ul>
        </td>
      </tr>
    `).join('')

    const tagHtml = (content.tag_analysis || []).map((tag) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; color: #1a1a1a;">${tag.tag_name}</div>
          <div style="font-size: 14px; color: #444; margin-top: 4px;">${tag.outlook}</div>
          ${(tag.stocks || []).length > 0 ? `
            <table style="width: 100%; margin-top: 8px; font-size: 13px;">
              ${(tag.stocks || []).map((s: any) => `
                <tr>
                  <td style="padding: 4px 8px; background: #f5f5f5;">${s.name} (${s.code})</td>
                  <td style="padding: 4px 8px;">${s.analysis}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
        </td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">TechAI Hub</h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">AI科技趋势与投资研究</p>
                    <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">${reportDate}</p>
                  </td>
                </tr>

                <!-- Headline Summary -->
                <tr>
                  <td style="padding: 24px 30px 0 30px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a; border-left: 4px solid #667eea; padding-left: 12px;">📰 头条摘要</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${headlineHtml || '<tr><td style="padding: 12px; color: #999;">暂无资讯</td></tr>'}
                    </table>
                  </td>
                </tr>

                <!-- Industry Updates -->
                <tr>
                  <td style="padding: 24px 30px 0 30px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a; border-left: 4px solid #48bb78; padding-left: 12px;">🔗 产业链动态</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${industryHtml || '<tr><td style="padding: 12px; color: #999;">暂无动态</td></tr>'}
                    </table>
                  </td>
                </tr>

                <!-- Tag Analysis -->
                <tr>
                  <td style="padding: 24px 30px 0 30px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a; border-left: 4px solid #9f7aea; padding-left: 12px;">🏷️ 标签分析</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${tagHtml || '<tr><td style="padding: 12px; color: #999;">暂无分析</td></tr>'}
                    </table>
                  </td>
                </tr>

                <!-- Investment Advice -->
                <tr>
                  <td style="padding: 24px 30px 30px 30px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a; border-left: 4px solid #ed8936; padding-left: 12px;">💡 投资建议</h2>
                    <div style="background: #fffaf0; border-radius: 8px; padding: 16px; font-size: 14px; color: #444; line-height: 1.8; white-space: pre-wrap;">${content.investment_advice || '暂无建议'}</div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f7f7f7; padding: 16px 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; font-size: 12px; color: #999;">© 2026 TechAI Hub | AI科技趋势与投资研究平台</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #bbb;">本报告由 AI 自动生成，仅供参考，不构成投资建议</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const info = await transporter.sendMail({
      from: `"TechAI Hub" <${EMAIL_FROM}>`,
      to,
      subject: reportTitle,
      html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true }
  } catch (e: any) {
    console.error('Email send error:', e)
    return { success: false, error: e.message }
  }
}
