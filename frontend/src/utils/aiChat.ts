/**
 * AI聊天助手 - 接入硅基流动(SiliconFlow) API
 * 使用 DeepSeek 或 Qwen 模型
 */

// 快捷问题
export const quickQuestions = [
  '有什么热销商品',
  '100元以下推荐',
  '有什么优惠活动',
  '怎么查看订单',
  '如何退换货'
]

// API配置 - 硅基流动 (SiliconFlow)
const API_CONFIG = {
  baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  model: 'Qwen/Qwen3-8B', // 免费模型
}

// 从环境变量或localStorage获取API Key
function getApiKey(): string {
  // 优先从环境变量读取
  const envKey = import.meta.env.VITE_AI_API_KEY
  if (envKey) return envKey
  
  // 其次从localStorage读取（用户可在设置中配置）
  return localStorage.getItem('ai_api_key') || ''
}

// 设置API Key（供设置页面调用）
export function setApiKey(key: string): void {
  localStorage.setItem('ai_api_key', key)
}

// 获取当前API Key（供设置页面显示）
export function getStoredApiKey(): string {
  return localStorage.getItem('ai_api_key') || ''
}

// 额外数据缓存
let cachedCategories: any[] = []
let cachedCoupons: any[] = []

// 设置额外数据（供外部调用）
export function setExtraData(data: { categories?: any[], coupons?: any[] }) {
  if (data.categories) cachedCategories = data.categories
  if (data.coupons) cachedCoupons = data.coupons
}

// 构建系统提示词
function buildSystemPrompt(products: any[]): string {
  // 按销量排序，取热销商品
  const hotProducts = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 20)
  
  // 构建详细商品信息
  const productDetails = hotProducts.map(p => {
    const info = [`${p.name}`, `¥${p.price}`]
    if (p.sales) info.push(`已售${p.sales}件`)
    if (p.categoryName) info.push(`分类:${p.categoryName}`)
    return info.join(',')
  }).join('\n')

  // 按价格区间分类
  const priceRanges = {
    under50: products.filter(p => p.price < 50).slice(0, 5),
    under100: products.filter(p => p.price >= 50 && p.price < 100).slice(0, 5),
    under200: products.filter(p => p.price >= 100 && p.price < 200).slice(0, 5),
    above200: products.filter(p => p.price >= 200).slice(0, 5)
  }

  // 分类信息
  const categoryInfo = cachedCategories.length > 0 
    ? `商品分类：${cachedCategories.map(c => c.name).join('、')}`
    : ''

  // 优惠券信息
  const couponInfo = cachedCoupons.length > 0
    ? `可领优惠券：${cachedCoupons.slice(0, 5).map(c => {
        if (c.type === 2) {
          return `${c.name}(${(c.discountRate * 10).toFixed(0)}折${c.minAmount > 0 ? ',满' + c.minAmount + '可用' : ''})`
        }
        return `${c.name}(减¥${c.discountAmount}${c.minAmount > 0 ? ',满' + c.minAmount + '可用' : ''})`
      }).join('、')}`
    : ''

  return `你是"雅集商城"的AI购物助手"小雅"。请用简洁友好的中文回答用户问题。

你的职责：
1. 推荐商品 - 根据用户需求从商品库中推荐合适的商品
2. 解答购物问题 - 订单、支付、退换货等
3. 介绍优惠活动 - 优惠券信息等

===== 商城数据 =====

【热销商品TOP20】
${productDetails || '暂无商品'}

【价格区间商品】
50元以下：${priceRanges.under50.map(p => `${p.name}(¥${p.price})`).join('、') || '无'}
50-100元：${priceRanges.under100.map(p => `${p.name}(¥${p.price})`).join('、') || '无'}
100-200元：${priceRanges.under200.map(p => `${p.name}(¥${p.price})`).join('、') || '无'}
200元以上：${priceRanges.above200.map(p => `${p.name}(¥${p.price})`).join('、') || '无'}

${categoryInfo}
${couponInfo}

===== 回复要求 =====
- 简洁明了，控制在200字以内
- 不要使用emoji表情
- 推荐商品时必须说明具体价格
- 只推荐上面列出的商品，不要编造
- 如果用户问的商品不在列表中，告知暂无该类商品
- 可以根据用户预算推荐合适价位的商品
- 如果用户问优惠券，介绍可领取的优惠券`
}

// 调用AI API
async function callAiApi(userMessage: string, products: any[]): Promise<string> {
  const apiKey = getApiKey()
  
  console.log('API Key存在:', !!apiKey, apiKey ? `(${apiKey.substring(0, 8)}...)` : '')
  
  if (!apiKey) {
    return `抱歉，AI服务尚未配置。

请按以下步骤开启AI功能：
1. 访问 https://cloud.siliconflow.cn 注册账号
2. 新用户可获得14元免费额度
3. 在"API密钥"页面创建密钥
4. 将密钥填入下方设置

或者在项目 frontend/.env 文件中添加：
VITE_AI_API_KEY=你的密钥`
  }

  try {
    console.log('正在调用AI API...', API_CONFIG.baseUrl)
    
    const response = await fetch(API_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(products) },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      })
    })

    console.log('API响应状态:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('AI API Error:', response.status, errorData)
      
      if (response.status === 401) {
        return '抱歉，API密钥无效或已过期，请检查您的密钥设置。'
      }
      if (response.status === 429) {
        return '抱歉，请求太频繁了，请稍后再试。'
      }
      if (response.status === 402) {
        return '抱歉，API额度已用完，请充值或更换密钥。'
      }
      
      return `API请求失败(${response.status})：${errorData.message || errorData.error?.message || '未知错误'}`
    }

    const data = await response.json()
    console.log('AI API返回:', data)
    
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      console.error('AI返回内容为空:', data)
      return '抱歉，AI返回了空内容，请重试。'
    }

    return content.trim()
  } catch (error: any) {
    console.error('AI调用失败:', error.message, error)
    
    // 检查是否是CORS错误
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return `网络请求失败，可能是跨域限制。

错误信息: ${error.message}

建议：请打开浏览器控制台(F12)查看详细错误信息。`
    }
    
    // 网络错误时使用本地回复
    return getLocalFallbackResponse(userMessage, products)
  }
}

// 本地备用回复（网络失败时使用）
function getLocalFallbackResponse(text: string, products: any[]): string {
  const lowerText = text.toLowerCase()
  
  // 优惠相关
  if (lowerText.includes('优惠') || lowerText.includes('活动') || lowerText.includes('折扣')) {
    return `目前商城有以下优惠：
1. 新人专享 - 首单立减10元
2. 满减活动 - 满199减20，满399减50
3. 限时特惠 - 部分商品低至5折

您可以在"促销活动"页面查看详情。`
  }
  
  // 订单相关
  if (lowerText.includes('订单') || lowerText.includes('物流') || lowerText.includes('快递')) {
    return `查看订单方法：
1. 点击右上角头像
2. 进入"我的订单"
3. 可按状态筛选订单

有具体问题可以继续问我。`
  }
  
  // 退换货
  if (lowerText.includes('退') || lowerText.includes('换货') || lowerText.includes('售后')) {
    return `退换货流程：
1. 在"我的订单"找到订单
2. 点击"申请退款"
3. 填写原因并提交
4. 等待审核(1-3个工作日)

商品签收7天内可申请退换。`
  }
  
  // 热销/推荐
  if (lowerText.includes('热销') || lowerText.includes('推荐') || lowerText.includes('热门')) {
    if (products.length > 0) {
      const hot = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3)
      let reply = '为您推荐热销商品：\n\n'
      hot.forEach((p, i) => {
        reply += `${i + 1}. ${p.name} - ¥${p.price}\n`
      })
      return reply
    }
  }
  
  // 默认回复
  return `网络连接不稳定，暂时无法获取AI回复。

您可以尝试：
- 刷新页面重试
- 检查网络连接
- 稍后再试

或者直接浏览商品列表选购。`
}

// 主函数：获取AI回复
export async function getAiResponse(userMessage: string, products: any[]): Promise<string> {
  if (!userMessage || userMessage.trim() === '') {
    return '请输入您想咨询的问题，我会尽力帮您解答。'
  }
  
  return await callAiApi(userMessage.trim(), products)
}

// 计算打字延迟（API调用时不需要模拟延迟）
export function getTypingDelay(_response: string): number {
  // API已经有网络延迟，这里只加少量延迟让体验更自然
  return 300
}

// 检查API是否已配置
export function isApiConfigured(): boolean {
  return !!getApiKey()
}
