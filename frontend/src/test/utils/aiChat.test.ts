import { beforeEach, describe, expect, it, vi } from 'vitest'

const { debugError } = vi.hoisted(() => ({
  debugError: vi.fn()
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import { getAiResponse, getStoredApiKey, quickQuestions, setApiKey } from '@/utils/aiChat'

describe('aiChat storage helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.setItem = vi.fn()
    vi.stubGlobal('fetch', vi.fn())
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

  it('does not offer unsupported return workflow in quick questions', () => {
    expect(quickQuestions).toContain('订单问题怎么处理')
    expect(quickQuestions).not.toContain('如何退换货')
  })

  it('falls back to contact guidance instead of refund-entry claims for after-sales questions', async () => {
    window.localStorage.getItem = vi.fn(() => 'sk-test')
    vi.mocked(fetch).mockRejectedValue(new Error('network unavailable'))

    const response = await getAiResponse('怎么退货或者申请售后？', [])

    expect(response).toContain('当前版本没有独立的退换货自动化入口')
    expect(response).toContain('前往“联系我们”页面留言')
    expect(response).not.toContain('申请退款')
  })
})
