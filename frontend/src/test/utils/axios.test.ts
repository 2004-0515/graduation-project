import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP_STATUS, STORAGE_KEYS } from '@/constants'

const useRequest = vi.fn()
const useResponse = vi.fn()
const debugError = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: useRequest },
        response: { use: useResponse }
      }
    }))
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

describe('axios storage guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.removeItem = vi.fn()
  })

  it('request interceptor logs and keeps request flowing when token read throws', async () => {
    window.localStorage.getItem = vi.fn(() => {
      throw new Error('token unreadable')
    })

    await import('@/utils/axios')
    const requestInterceptor = useRequest.mock.calls[0][0]
    const config: { headers: Record<string, string> } = { headers: {} }

    expect(requestInterceptor(config)).toBe(config)
    expect(debugError).toHaveBeenCalledWith(`读取本地存储失败(${STORAGE_KEYS.TOKEN})`, expect.any(Error))
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('response interceptor logs storage cleanup failures but still rejects unauthorized error', async () => {
    window.localStorage.removeItem = vi.fn(() => {
      throw new Error('remove failed')
    })
    window.history.replaceState({}, '', '/login')

    await import('@/utils/axios')
    const responseErrorHandler = useResponse.mock.calls[0][1]
    const error = {
      response: {
        status: HTTP_STATUS.UNAUTHORIZED,
        data: 'unauthorized'
      }
    }

    await expect(responseErrorHandler(error)).rejects.toMatchObject({
      message: '登录状态已失效，请重新登录'
    })
    expect(debugError).toHaveBeenCalledWith(`删除本地存储失败(${STORAGE_KEYS.TOKEN})`, expect.any(Error))
    expect(debugError).toHaveBeenCalledWith(`删除本地存储失败(${STORAGE_KEYS.USER_INFO})`, expect.any(Error))
  })
})
