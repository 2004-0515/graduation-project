import { beforeEach, describe, expect, it, vi } from 'vitest'

const { debugError } = vi.hoisted(() => ({
  debugError: vi.fn()
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import { getAiResponse, getStoredApiKey, setApiKey, setExtraData } from '@/utils/aiChat'

describe('aiChat storage helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.setItem = vi.fn()
    vi.unstubAllGlobals()
    setExtraData({ categories: [], coupons: [] })
  })

  it('returns empty string and logs when reading api key throws', () => {
    window.localStorage.getItem = vi.fn(() => {
      throw new Error('storage unreadable')
    })

    expect(getStoredApiKey()).toBe('')
    expect(debugError).toHaveBeenCalledWith('读取 AI API Key 失败:', expect.any(Error))
  })

  it('logs when saving api key throws without crashing caller', () => {
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('storage blocked')
    })

    expect(() => setApiKey('sk-test')).not.toThrow()
    expect(debugError).toHaveBeenCalledWith('保存 AI API Key 失败:', expect.any(Error))
  })

  it('uses truthful local fallback for personal order questions when ai request fails', async () => {
    window.localStorage.getItem = vi.fn(() => 'sk-test')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const reply = await getAiResponse('帮我看看我的订单到哪了', [])

    expect(reply).toContain('不能读取你的个人订单或物流状态')
    expect(reply).toContain('我的订单')
    expect(reply).not.toContain('1-3 个工作日')
  })

  it('uses loaded real coupons instead of invented promotions in local fallback', async () => {
    window.localStorage.getItem = vi.fn(() => 'sk-test')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    setExtraData({
      coupons: [
        { name: '满199减20', type: 1, discountAmount: 20, minAmount: 199 }
      ]
    })

    const reply = await getAiResponse('现在有什么优惠券', [])

    expect(reply).toContain('满199减20')
    expect(reply).not.toContain('新人专享')
  })

  it('keeps after-sales fallback within current page boundaries', async () => {
    window.localStorage.getItem = vi.fn(() => 'sk-test')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const reply = await getAiResponse('这单能退货吗，售后规则是什么', [])

    expect(reply).toContain('不能确认具体订单的退款、换货或售后资格')
    expect(reply).toContain('订单详情')
    expect(reply).not.toContain('7天无理由')
  })
})
