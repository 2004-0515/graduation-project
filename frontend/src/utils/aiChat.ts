import { debugError } from '@/utils/debug'

/**
 * AI 聊天助手 - 接入硅基流动 (SiliconFlow) API
 * 默认使用 Qwen 免费模型。
 */

export const quickQuestions = [
  '有什么热销商品',
  '100元以下推荐',
  '有什么优惠活动',
  '怎么查看订单',
  '如何退换货'
]

const API_CONFIG = {
  baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  model: 'Qwen/Qwen3-8B'
}

const readApiKeyFromStorage = (): string => {
  try {
    return localStorage.getItem('ai_api_key') || ''
  } catch (error) {
    debugError('读取 AI API Key 失败:', error)
    return ''
  }
}

const writeApiKeyToStorage = (key: string): void => {
  try {
    localStorage.setItem('ai_api_key', key)
  } catch (error) {
    debugError('保存 AI API Key 失败:', error)
  }
}

function getApiKey(): string {
  const envKey = import.meta.env.VITE_AI_API_KEY
  if (envKey) return envKey
  return readApiKeyFromStorage()
}

export function setApiKey(key: string): void {
  writeApiKeyToStorage(key)
}

export function getStoredApiKey(): string {
  return readApiKeyFromStorage()
}

let cachedCategories: any[] = []
let cachedCoupons: any[] = []

export function setExtraData(data: { categories?: any[]; coupons?: any[] }) {
  if (data.categories) cachedCategories = data.categories
  if (data.coupons) cachedCoupons = data.coupons
}

function buildSystemPrompt(products: any[]): string {
  const hotProducts = [...products]
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 20)

  const productDetails = hotProducts
    .map((p) => {
      const info = [`${p.name}`, `¥${p.price}`]
      if (p.sales) info.push(`已售${p.sales}件`)
      if (p.categoryName) info.push(`分类：${p.categoryName}`)
      return info.join('，')
    })
    .join('\n')

  const priceRanges = {
    under50: products.filter((p) => p.price < 50).slice(0, 5),
    under100: products.filter((p) => p.price >= 50 && p.price < 100).slice(0, 5),
    under200: products.filter((p) => p.price >= 100 && p.price < 200).slice(0, 5),
    above200: products.filter((p) => p.price >= 200).slice(0, 5)
  }

  const categoryInfo =
    cachedCategories.length > 0
      ? `商品分类：${cachedCategories.map((c) => c.name).join('、')}`
      : ''

  const couponInfo =
    cachedCoupons.length > 0
      ? `可领优惠券：${cachedCoupons
          .slice(0, 5)
          .map((c) => {
            if (c.type === 2) {
              return `${c.name}（${(c.discountRate * 10).toFixed(0)}折${
                c.minAmount > 0 ? `，满${c.minAmount}可用` : ''
              }）`
            }
            return `${c.name}（减${c.discountAmount}${
              c.minAmount > 0 ? `，满${c.minAmount}可用` : ''
            }）`
          })
          .join('、')}`
      : ''

  return `你是“雅集商城”的 AI 购物助手“小雅”。请用简洁、友好的中文回答用户问题。

你的职责：
1. 根据用户需求推荐合适商品
2. 解答购物流程、订单、支付、售后等问题
3. 介绍当前优惠活动和优惠券信息

===== 商城数据 =====

【热销商品 TOP20】
${productDetails || '暂无商品数据'}

【价格区间商品】
50元以下：${priceRanges.under50.map((p) => `${p.name}(¥${p.price})`).join('、') || '无'}
50-100元：${priceRanges.under100.map((p) => `${p.name}(¥${p.price})`).join('、') || '无'}
100-200元：${priceRanges.under200.map((p) => `${p.name}(¥${p.price})`).join('、') || '无'}
200元以上：${priceRanges.above200.map((p) => `${p.name}(¥${p.price})`).join('、') || '无'}

${categoryInfo}
${couponInfo}

===== 回复要求 =====
- 控制在 200 字以内
- 不使用 emoji
- 推荐商品时必须带价格
- 只推荐数据中已有的商品，不编造商品
- 如果用户问到不存在的商品，直接说明暂无相关商品
- 可根据预算推荐不同价位商品
- 如涉及优惠券，优先介绍可领取和可使用条件`
}

async function callAiApi(userMessage: string, products: any[]): Promise<string> {
  const apiKey = getApiKey()

  if (!apiKey) {
    return `抱歉，AI 服务尚未配置。

请按以下步骤开启 AI 功能：
1. 访问 https://cloud.siliconflow.cn 注册账号
2. 新用户可获得免费额度
3. 在“API 密钥”页面创建密钥
4. 将密钥填写到本页设置中

或者在项目的 frontend/.env 文件中添加：
VITE_AI_API_KEY=你的密钥`
  }

  try {
    const response = await fetch(API_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 401) {
        return '抱歉，API 密钥无效或已过期，请检查设置。'
      }
      if (response.status === 429) {
        return '抱歉，请求过于频繁，请稍后再试。'
      }
      if (response.status === 402) {
        return '抱歉，API 额度已用完，请充值或更换密钥。'
      }

      return `API 请求失败（${response.status}）：${
        errorData.message || errorData.error?.message || '未知错误'
      }`
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return '抱歉，AI 返回了空内容，请重试。'
    }

    return content.trim()
  } catch (error: any) {
    debugError('AI 调用失败:', error.message, error)

    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return `网络请求失败，可能是跨域或网络连接问题。

错误信息：${error.message}

建议打开浏览器控制台（F12）查看详细错误。`
    }

    return getLocalFallbackResponse(userMessage, products)
  }
}

function getLocalFallbackResponse(text: string, products: any[]): string {
  const lowerText = text.toLowerCase()

  if (lowerText.includes('优惠') || lowerText.includes('活动') || lowerText.includes('折扣')) {
    return `目前商城有以下优惠：
1. 新人专享：首单立减 10 元
2. 满减活动：满 199 减 20，满 399 减 50
3. 限时特惠：部分商品低至 5 折

你可以在“促销活动”页面查看更多详情。`
  }

  if (lowerText.includes('订单') || lowerText.includes('物流') || lowerText.includes('快递')) {
    return `查看订单的方法：
1. 点击右上角头像
2. 进入“我的订单”
3. 可按状态筛选订单

如果有更具体的问题，可以继续问我。`
  }

  if (lowerText.includes('退') || lowerText.includes('换货') || lowerText.includes('售后')) {
    return `退换货流程：
1. 在“我的订单”中找到对应订单
2. 点击“申请退款”或相关售后入口
3. 填写原因并提交
4. 等待审核，通常 1-3 个工作日完成

商品签收 7 天内通常可申请退换。`
  }

  if (lowerText.includes('热销') || lowerText.includes('推荐') || lowerText.includes('热门')) {
    if (products.length > 0) {
      const hot = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3)
      let reply = '为您推荐以下热销商品：\n\n'
      hot.forEach((p, i) => {
        reply += `${i + 1}. ${p.name} - ¥${p.price}\n`
      })
      return reply
    }
  }

  return `当前网络连接不稳定，暂时无法获取 AI 回复。

你可以尝试：
- 刷新页面后重试
- 检查网络连接
- 稍后再试

也可以先直接浏览商品列表进行选购。`
}

export async function getAiResponse(userMessage: string, products: any[]): Promise<string> {
  if (!userMessage || userMessage.trim() === '') {
    return '请输入你想咨询的问题，我会尽力帮你解答。'
  }

  return callAiApi(userMessage.trim(), products)
}

export function getTypingDelay(_response: string): number {
  return 300
}

export function isApiConfigured(): boolean {
  return !!getApiKey()
}
