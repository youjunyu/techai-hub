import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SAMPLE_TAGS = [
  { name: 'HBM存储', category: 'AI算力', description: '高带宽内存，AI芯片关键组件', color: '#8b5cf6' },
  { name: '光模块', category: 'AI算力', description: '数据中心光通信模块', color: '#3b82f6' },
  { name: '人形机器人', category: 'AI应用', description: '具身智能与人形机器人', color: '#10b981' },
  { name: 'AI芯片', category: 'AI算力', description: 'GPU/TPU/NPU等AI专用芯片', color: '#f59e0b' },
  { name: '自动驾驶', category: 'AI应用', description: 'L2+/L3/L4自动驾驶技术', color: '#ef4444' },
  { name: '半导体设备', category: '半导体', description: '晶圆制造设备与材料', color: '#6366f1' },
  { name: '碳化硅', category: '半导体', description: 'SiC功率器件', color: '#14b8a6' },
  { name: '钙钛矿', category: '新能源', description: '下一代光伏技术', color: '#f97316' },
  { name: '固态电池', category: '新能源', description: '全固态/半固态电池', color: '#eab308' },
  { name: 'CPO', category: 'AI算力', description: '共封装光学技术', color: '#06b6d4' },
  { name: '铜连接', category: 'AI算力', description: '高速铜互连方案', color: '#78716c' },
  { name: 'AI Agent', category: 'AI应用', description: 'AI智能体与自动化', color: '#a855f7' },
]

const SAMPLE_STOCKS = [
  // HBM存储
  { name: '深科技', code: '000021.SZ', market: 'A股', sector: '存储', core_logic: 'HBM封装测试龙头，受益存储周期上行', tags: ['HBM存储'] },
  { name: '长电科技', code: '600584.SH', market: 'A股', sector: '封测', core_logic: '全球第三大封测厂，HBM封装核心标的', tags: ['HBM存储'] },
  { name: '通富微电', code: '002156.SZ', market: 'A股', sector: '封测', core_logic: '深度绑定AMD，HBM封装重要玩家', tags: ['HBM存储'] },
  { name: '太极实业', code: '600667.SH', market: 'A股', sector: '封测', core_logic: 'DRAM/HBM存储模组封装', tags: ['HBM存储'] },
  // 光模块
  { name: '中际旭创', code: '300308.SZ', market: 'A股', sector: '光模块', core_logic: '全球光模块龙头，800G/1.6T核心供应商', tags: ['光模块', 'CPO'] },
  { name: '新易盛', code: '300502.SZ', market: 'A股', sector: '光模块', core_logic: '高速光模块领先企业，业绩弹性大', tags: ['光模块'] },
  { name: '天孚通信', code: '300394.SZ', market: 'A股', sector: '光器件', core_logic: '光器件龙头，壁垒深厚', tags: ['光模块'] },
  { name: '光迅科技', code: '002281.SZ', market: 'A股', sector: '光模块', core_logic: '光模块国家队，数据中心+电信双轮驱动', tags: ['光模块'] },
  // 人形机器人
  { name: '拓普集团', code: '601689.SH', market: 'A股', sector: '汽车零部件', core_logic: '人形机器人执行器核心供应商', tags: ['人形机器人'] },
  { name: '三花智控', code: '002050.SZ', market: 'A股', sector: '汽车零部件', core_logic: '热管理龙头，机器人执行器第二曲线', tags: ['人形机器人'] },
  { name: '鸣志电器', code: '603728.SH', market: 'A股', sector: '电机', core_logic: '空心杯电机龙头，机器人核心零部件', tags: ['人形机器人'] },
  { name: '绿的谐波', code: '688017.SH', market: 'A股', sector: '减速器', core_logic: '谐波减速器龙头，机器人精密传动', tags: ['人形机器人'] },
  // AI芯片
  { name: '寒武纪', code: '688256.SH', market: 'A股', sector: 'AI芯片', core_logic: '国产AI芯片龙头，思元系列', tags: ['AI芯片'] },
  { name: '海光信息', code: '688041.SH', market: 'A股', sector: 'CPU/DCU', core_logic: '国产x86+DCU双轮驱动', tags: ['AI芯片'] },
  { name: '中科曙光', code: '603019.SH', market: 'A股', sector: '服务器', core_logic: '国产算力服务器龙头', tags: ['AI芯片'] },
  // 半导体设备
  { name: '北方华创', code: '002371.SZ', market: 'A股', sector: '半导体设备', core_logic: '国产半导体设备平台型龙头', tags: ['半导体设备'] },
  { name: '中微公司', code: '688012.SH', market: 'A股', sector: '刻蚀设备', core_logic: '半导体刻蚀设备龙头', tags: ['半导体设备'] },
  { name: '拓荆科技', code: '688072.SH', market: 'A股', sector: '薄膜设备', core_logic: '半导体薄膜沉积设备', tags: ['半导体设备'] },
  // 自动驾驶
  { name: '德赛西威', code: '002920.SZ', market: 'A股', sector: '汽车电子', core_logic: '智能驾驶域控制器龙头', tags: ['自动驾驶'] },
  { name: '伯特利', code: '603596.SH', market: 'A股', sector: '汽车零部件', core_logic: '线控制动龙头', tags: ['自动驾驶'] },
  // 新能源
  { name: '宁德时代', code: '300750.SZ', market: 'A股', sector: '电池', core_logic: '全球动力电池龙头，固态电池布局领先', tags: ['固态电池'] },
  { name: '隆基绿能', code: '601012.SH', market: 'A股', sector: '光伏', core_logic: '光伏龙头，HPBC+钙钛矿技术路线', tags: ['钙钛矿'] },
]

export async function POST() {
  try {
    const results = { tags: 0, stocks: 0, errors: [] as string[] }

    // 1. Insert tags
    for (const tag of SAMPLE_TAGS) {
      const { error } = await supabaseAdmin()
        .from('tai_tags')
        .upsert(tag, { onConflict: 'name' })
      if (error) {
        results.errors.push(`Tag ${tag.name}: ${error.message}`)
      } else {
        results.tags++
      }
    }

    // 2. Get tag IDs for linking
    const { data: allTags } = await supabaseAdmin()
      .from('tai_tags')
      .select('id, name')
    
    const tagMap = new Map((allTags || []).map((t: any) => [t.name, t.id]))

    // 3. Insert stocks with tag links
    for (const stock of SAMPLE_STOCKS) {
      const { data: existingStock } = await supabaseAdmin()
        .from('tai_stocks')
        .select('id')
        .eq('code', stock.code)
        .single()

      let stockId: string
      if (existingStock) {
        stockId = existingStock.id
        await supabaseAdmin()
          .from('tai_stocks')
          .update({ name: stock.name, market: stock.market, sector: stock.sector, core_logic: stock.core_logic, tags: stock.tags })
          .eq('id', stockId)
      } else {
        const { data: newStock, error } = await supabaseAdmin()
          .from('tai_stocks')
          .insert({
            name: stock.name,
            code: stock.code,
            market: stock.market,
            sector: stock.sector,
            core_logic: stock.core_logic,
            tags: stock.tags,
          })
          .select('id')
          .single()
        
        if (error) {
          results.errors.push(`Stock ${stock.name}: ${error.message}`)
          continue
        }
        stockId = newStock!.id
      }

      // Link tags
      const stockTags = stock.tags.filter((t) => tagMap.has(t))
      if (stockTags.length > 0) {
        // Remove old links
        await supabaseAdmin()
          .from('tai_tag_stocks')
          .delete()
          .eq('stock_id', stockId)

        // Add new links
        const links = stockTags.map((tagName) => ({
          tag_id: tagMap.get(tagName)!,
          stock_id: stockId,
        }))
        const { error: linkError } = await supabaseAdmin()
          .from('tai_tag_stocks')
          .upsert(links, { onConflict: 'tag_id,stock_id' })
        
        if (linkError) results.errors.push(`Link ${stock.name}: ${linkError.message}`)
      }

      results.stocks++
    }

    return NextResponse.json({
      message: 'Seed completed',
      ...results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
