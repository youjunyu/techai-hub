import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Seed initial data - tags and sample industry chain
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seed tags
    const tags = [
      { name: 'HBM存储', category: '硬件', description: '高带宽内存(HBM)相关标的' },
      { name: '光模块', category: '硬件', description: '光通信模块相关标的' },
      { name: '人形机器人', category: 'AI应用', description: '人形机器人产业链' },
      { name: '液冷技术', category: '基础设施', description: '数据中心液冷解决方案' },
      { name: 'AI Agent', category: '平台', description: 'AI智能体平台' },
      { name: '智能驾驶', category: 'AI应用', description: '自动驾驶技术' },
      { name: '大模型', category: '平台', description: '大语言模型' },
      { name: 'GPU/算力', category: '硬件', description: 'GPU及算力芯片' },
    ]

    const { data: insertedTags, error: tagError } = await supabaseAdmin
      .from('tai_tags')
      .insert(tags)
      .select()

    if (tagError) console.log('Tag insert error:', tagError)

    // Seed sample industry chain if none exists
    const { data: existingChains } = await supabaseAdmin
      .from('tai_industry_chains')
      .select('id')
      .limit(1)

    if (!existingChains || existingChains.length === 0) {
      const { data: chain, error: chainError } = await supabaseAdmin
        .from('tai_industry_chains')
        .insert({
          name: 'AI算力产业链',
          description: '从电力到应用层的完整AI算力产业链',
          is_public: true,
          creator_id: user.id
        })
        .select()
        .single()

      if (!chainError && chain) {
        const layers = [
          {
            chain_id: chain.id,
            layer_name: '能源层',
            layer_order: 1,
            description: '为数据中心提供电力供应',
            key_metrics: '电力消耗、PUE、绿电比例'
          },
          {
            chain_id: chain.id,
            layer_name: '基础设施层',
            layer_order: 2,
            description: '数据中心(IDC)建设与运维',
            key_metrics: '机柜数、上架率、带宽'
          },
          {
            chain_id: chain.id,
            layer_name: '硬件层',
            layer_order: 3,
            description: '芯片、服务器、存储等硬件设备',
            key_metrics: '算力、存储容量、吞吐量'
          },
          {
            chain_id: chain.id,
            layer_name: '平台层',
            layer_order: 4,
            description: '大模型、AI框架、云平台',
            key_metrics: '模型参数、API调用量、市场份额'
          },
          {
            chain_id: chain.id,
            layer_name: '应用层',
            layer_order: 5,
            description: 'AI应用产品与服务',
            key_metrics: '用户数、ARPU、营收'
          }
        ]

        const { data: insertedLayers } = await supabaseAdmin
          .from('tai_chain_layers')
          .insert(layers)
          .select()

        if (insertedLayers) {
          // Add sample nodes
          const nodesByLayer: Record<string, any[]> = {
            '能源层': [
              { node_name: '宁德时代', node_type: 'company', related_stocks: ['300750.SZ'] },
              { node_name: '比亚迪', node_type: 'company', related_stocks: ['002594.SZ'] },
            ],
            '基础设施层': [
              { node_name: '万国数据', node_type: 'company', related_stocks: ['GDS.US'] },
              { node_name: '世纪互联', node_type: 'company', related_stocks: ['VNET.US'] },
            ],
            '硬件层': [
              { node_name: '英伟达', node_type: 'company', related_stocks: ['NVDA.US'] },
              { node_name: 'AMD', node_type: 'company', related_stocks: ['AMD.US'] },
              { node_name: '海光信息', node_type: 'company', related_stocks: ['688041.SH'] },
              { node_name: '寒武纪', node_type: 'company', related_stocks: ['688256.SH'] },
            ],
            '平台层': [
              { node_name: 'OpenAI', node_type: 'company', related_stocks: ['MSFT.US'] },
              { node_name: '百度', node_type: 'company', related_stocks: ['09888.HK'] },
              { node_name: '阿里', node_type: 'company', related_stocks: ['09988.HK'] },
            ],
            '应用层': [
              { node_name: '科大讯飞', node_type: 'company', related_stocks: ['002230.SZ'] },
              { node_name: '商汤科技', node_type: 'company', related_stocks: ['00020.HK'] },
            ]
          }

          const allNodes: any[] = []
          for (const layer of insertedLayers) {
            const nodes = nodesByLayer[layer.layer_name] || []
            for (const node of nodes) {
              allNodes.push({ ...node, layer_id: layer.id })
            }
          }
          await supabaseAdmin.from('tai_chain_nodes').insert(allNodes)
        }
      }
    }

    return NextResponse.json({ 
      message: 'Seed data created',
      tags: insertedTags?.length || 0
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
