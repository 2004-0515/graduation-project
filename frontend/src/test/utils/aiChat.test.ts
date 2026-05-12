import { beforeEach, describe, expect, it, vi } from 'vitest'

const { debugError } = vi.hoisted(() => ({
  debugError: vi.fn()
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import { getStoredApiKey, setApiKey } from '@/utils/aiChat'

describe('aiChat storage helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.setItem = vi.fn()
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
})
