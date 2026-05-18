import { beforeEach, describe, expect, it, vi } from 'vitest'

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}))

vi.mock('@/utils/axios', () => ({
  default: axiosMock
}))

import contactApi from '@/api/contactApi'

describe('contactApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits contact message', async () => {
    const response = { code: 200 }
    const payload = { name: 'Alice', contact: 'alice@example.com', type: 'feedback', content: 'hello' }
    axiosMock.post.mockResolvedValue(response)

    await expect(contactApi.submitMessage(payload)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/contact-messages', payload)
  })
})
