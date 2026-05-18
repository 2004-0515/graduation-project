import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import authApi from '@/api/authApi'
import { STORAGE_KEYS } from '@/constants'
import { debugError } from '@/utils/debug'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((_: string) => null as string | null),
  setItem: vi.fn((_: string, __: string) => undefined),
  removeItem: vi.fn((_: string) => undefined),
  clear: vi.fn(() => undefined)
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock authApi
vi.mock('@/api/authApi', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    deleteCurrentUser: vi.fn(),
    updateUserInfo: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn()
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError: vi.fn()
}))

describe('useUserStore', () => {
  let userStore: ReturnType<typeof useUserStore>
  const mockedAuthApi = vi.mocked(authApi)

  const createDeferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    setActivePinia(createPinia())
    userStore = useUserStore()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(userStore.userInfo).toBeNull()
      expect(userStore.token).toBeNull()
      expect(userStore.loading).toBe(false)
      expect(userStore.error).toBeNull()
    })

    it('should compute isLoggedIn correctly', () => {
      expect(userStore.isLoggedIn).toBe(false)

      userStore.token = 'test-token'
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('should return currentUser', () => {
      expect(userStore.currentUser).toBeNull()

      const testUser = { id: 1, username: 'test' } as any
      userStore.userInfo = testUser
      expect(userStore.currentUser).toEqual(testUser)
    })
  })

  describe('clearError', () => {
    it('should clear error message', () => {
      userStore.error = 'Test error'
      userStore.clearError()
      expect(userStore.error).toBeNull()
    })
  })

  describe('initUser', () => {
    it('should restore stored user info before refreshing current user', async () => {
      userStore.token = 'token'
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) {
          return JSON.stringify({ id: 1, username: 'buyer', nickname: '缓存昵称' })
        }
        return null
      })
      mockedAuthApi.getCurrentUser.mockResolvedValue({
        code: 200,
        data: { id: 1, username: 'buyer', nickname: '服务端昵称' }
      } as any)

      await userStore.initUser()

      expect(userStore.userInfo).toMatchObject({ nickname: '服务端昵称' })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_INFO,
        expect.stringContaining('"nickname":"服务端昵称"')
      )
    })

    it('should clear invalid session when refreshing current user fails', async () => {
      userStore.token = 'token'
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) {
          return JSON.stringify({ id: 1, username: 'buyer', nickname: '缓存昵称' })
        }
        return null
      })
      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('token expired'))

      await userStore.initUser()

      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.TOKEN)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO)
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('初始化用户信息失败', expect.any(Error))
    })

    it('should clear broken stored user info json before refreshing', async () => {
      userStore.token = 'token'
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) {
          return '{broken-json'
        }
        return null
      })
      mockedAuthApi.getCurrentUser.mockResolvedValue({
        code: 200,
        data: { id: 1, username: 'buyer', nickname: '恢复后昵称' }
      } as any)

      await userStore.initUser()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO)
      expect(userStore.userInfo).toMatchObject({ nickname: '恢复后昵称' })
    })

    it('should keep initializing when storage read/remove throws during local restore', async () => {
      userStore.token = 'token'
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) {
          return '{broken-json'
        }
        throw new Error('token unreadable')
      })
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('remove failed')
      })
      mockedAuthApi.getCurrentUser.mockResolvedValue({
        code: 200,
        data: { id: 1, username: 'buyer', nickname: '服务端恢复昵称' }
      } as any)

      await userStore.initUser()

      expect(userStore.userInfo).toMatchObject({ nickname: '服务端恢复昵称' })
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('解析本地用户信息失败', expect.any(Error))
      expect(vi.mocked(debugError)).toHaveBeenCalledWith(
        `删除本地存储失败(${STORAGE_KEYS.USER_INFO})`,
        expect.any(Error)
      )
    })
  })

  describe('updateUserInfo', () => {
    beforeEach(() => {
      userStore.userInfo = {
        id: 1,
        username: 'buyer',
        nickname: '旧昵称',
        email: 'old@example.com',
        phone: '13800138000'
      } as any
      const storedUserInfo = JSON.stringify(userStore.userInfo)
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) {
          return storedUserInfo
        }
        return null
      })
    })

    it('should persist backend user data when update succeeds', async () => {
      mockedAuthApi.updateUserInfo.mockResolvedValue({
        code: 200,
        success: true,
        data: {
          id: 1,
          username: 'buyer',
          nickname: '新昵称',
          email: 'new@example.com',
          phone: '13900139000'
        }
      } as any)

      const result = await userStore.updateUserInfo({ nickname: '新昵称' } as any)

      expect(result).toMatchObject({ nickname: '新昵称', email: 'new@example.com' })
      expect(userStore.userInfo).toMatchObject({ nickname: '新昵称', email: 'new@example.com' })
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        STORAGE_KEYS.USER_INFO,
        expect.stringContaining('"nickname":"新昵称"')
      )
    })

    it('should rollback optimistic user info when api returns non-success payload', async () => {
      mockedAuthApi.updateUserInfo.mockResolvedValue({
        success: false,
        message: '更新失败'
      } as any)

      await expect(userStore.updateUserInfo({ nickname: '失败昵称' } as any)).rejects.toThrow('更新失败')

      expect(userStore.userInfo).toMatchObject({ nickname: '旧昵称', email: 'old@example.com' })
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        STORAGE_KEYS.USER_INFO,
        expect.stringContaining('"nickname":"旧昵称"')
      )
      expect(userStore.error).toBe('更新失败')
    })

    it('should rollback optimistic user info when api throws', async () => {
      mockedAuthApi.updateUserInfo.mockRejectedValue(new Error('网络异常'))

      await expect(userStore.updateUserInfo({ email: 'bad@example.com' } as any)).rejects.toThrow('网络异常')

      expect(userStore.userInfo).toMatchObject({ nickname: '旧昵称', email: 'old@example.com' })
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        STORAGE_KEYS.USER_INFO,
        expect.stringContaining('"email":"old@example.com"')
      )
      expect(userStore.error).toBe('网络异常')
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('更新用户信息失败', expect.any(Error))
    })
  })

  describe('auth flows', () => {
    it('should still login successfully when local storage writes throw', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      mockedAuthApi.login.mockResolvedValue({
        code: 200,
        data: {
          token: 'token-1',
          user: { id: 1, username: 'buyer', nickname: '昵称' }
        }
      } as any)

      const result = await userStore.login({ username: 'buyer', password: 'ok' } as any)

      expect(result.token).toBe('token-1')
      expect(userStore.token).toBe('token-1')
      expect(userStore.userInfo).toMatchObject({ nickname: '昵称' })
      expect(vi.mocked(debugError)).toHaveBeenCalledWith(
        `写入本地存储失败(${STORAGE_KEYS.TOKEN})`,
        expect.any(Error)
      )
      expect(vi.mocked(debugError)).toHaveBeenCalledWith(
        `写入本地存储失败(${STORAGE_KEYS.USER_INFO})`,
        expect.any(Error)
      )
    })

    it('should still logout locally when storage removal throws', async () => {
      userStore.token = 'token'
      userStore.userInfo = { id: 1, username: 'buyer' } as any
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('remove blocked')
      })
      mockedAuthApi.logout.mockResolvedValue({} as any)

      await userStore.logout()

      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(vi.mocked(debugError)).toHaveBeenCalledWith(
        `删除本地存储失败(${STORAGE_KEYS.TOKEN})`,
        expect.any(Error)
      )
      expect(vi.mocked(debugError)).toHaveBeenCalledWith(
        `删除本地存储失败(${STORAGE_KEYS.USER_INFO})`,
        expect.any(Error)
      )
    })

    it('should clear local session and notify logout endpoint after account deletion succeeds', async () => {
      userStore.token = 'token'
      userStore.userInfo = { id: 1, username: 'buyer' } as any
      mockedAuthApi.deleteCurrentUser.mockResolvedValue({
        code: 200,
        message: '账号删除成功'
      } as any)
      mockedAuthApi.logout.mockResolvedValue({} as any)

      await userStore.deleteAccount()

      expect(mockedAuthApi.deleteCurrentUser).toHaveBeenCalled()
      expect(mockedAuthApi.logout).toHaveBeenCalled()
      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.TOKEN)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO)
      expect(userStore.error).toBeNull()
    })

    it('should keep account deletion successful when logout cleanup call fails', async () => {
      userStore.token = 'token'
      userStore.userInfo = { id: 1, username: 'buyer' } as any
      mockedAuthApi.deleteCurrentUser.mockResolvedValue({
        code: 200,
        message: '账号删除成功'
      } as any)
      mockedAuthApi.logout.mockRejectedValue(new Error('logout cleanup failed'))

      await userStore.deleteAccount()

      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(vi.mocked(debugError)).toHaveBeenCalledWith(
        '账户注销成功后清理本地登录态失败:',
        expect.any(Error)
      )
    })

    it('should keep session when account deletion returns validation failure', async () => {
      userStore.token = 'token'
      userStore.userInfo = { id: 1, username: 'buyer' } as any
      mockedAuthApi.deleteCurrentUser.mockResolvedValue({
        code: 422,
        message: '账户仍有关联订单，无法注销'
      } as any)

      await expect(userStore.deleteAccount()).rejects.toThrow('账户仍有关联订单，无法注销')

      expect(mockedAuthApi.logout).not.toHaveBeenCalled()
      expect(userStore.token).toBe('token')
      expect(userStore.userInfo).toMatchObject({ username: 'buyer' })
      expect(userStore.error).toBe('账户仍有关联订单，无法注销')
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('注销账户失败', expect.any(Error))
    })

    it('should return success message when password change succeeds', async () => {
      mockedAuthApi.changePassword.mockResolvedValue({
        code: 200,
        message: '密码修改成功'
      } as any)

      const result = await userStore.changePassword({
        currentPassword: 'old-pass',
        newPassword: 'new-pass-1',
        confirmPassword: 'new-pass-1'
      })

      expect(result).toBe('密码修改成功')
      expect(userStore.error).toBeNull()
    })

    it('should expose backend message when password change returns non-200 payload', async () => {
      mockedAuthApi.changePassword.mockResolvedValue({
        code: 500,
        message: '当前密码不正确'
      } as any)

      await expect(
        userStore.changePassword({
          currentPassword: 'old-pass',
          newPassword: 'new-pass-1',
          confirmPassword: 'new-pass-1'
        })
      ).rejects.toThrow('当前密码不正确')

      expect(userStore.error).toBe('当前密码不正确')
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('修改密码失败', expect.any(Error))
    })

    it('should not treat success flag without 200 code as login success', async () => {
      mockedAuthApi.login.mockResolvedValue({
        code: 500,
        success: true,
        message: '登录失败'
      } as any)

      await expect(userStore.login({ username: 'buyer', password: 'bad' } as any)).rejects.toThrow('登录失败')

      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(userStore.error).toBe('登录失败')
    })

    it('should log when login fails', async () => {
      mockedAuthApi.login.mockRejectedValue(new Error('登录异常'))

      await expect(userStore.login({ username: 'buyer', password: 'bad' } as any)).rejects.toThrow('登录异常')

      expect(userStore.error).toBe('登录异常')
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('登录失败', expect.any(Error))
    })

    it('should log when register returns non-success payload', async () => {
      mockedAuthApi.register.mockResolvedValue({
        success: false,
        message: '注册失败'
      } as any)

      await expect(userStore.register({ username: 'buyer' } as any)).rejects.toThrow('注册失败')

      expect(userStore.error).toBe('注册失败')
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('注册失败', expect.any(Error))
    })

    it('should not treat success flag without 200 code as register success', async () => {
      mockedAuthApi.register.mockResolvedValue({
        code: 500,
        success: true,
        message: '注册失败'
      } as any)

      await expect(userStore.register({ username: 'buyer' } as any)).rejects.toThrow('注册失败')

      expect(userStore.error).toBe('注册失败')
    })

    it('should log when fetchCurrentUser returns non-success payload', async () => {
      userStore.token = 'token'
      mockedAuthApi.getCurrentUser.mockResolvedValue({
        success: false,
        message: '用户信息失效'
      } as any)

      await expect(userStore.fetchCurrentUser()).rejects.toThrow('用户信息失效')

      expect(userStore.error).toBe('用户信息失效')
      expect(vi.mocked(debugError)).toHaveBeenCalledWith('获取当前用户信息失败', expect.any(Error))
    })

    it('should not treat success flag without 200 code as current-user success', async () => {
      userStore.token = 'token'
      mockedAuthApi.getCurrentUser.mockResolvedValue({
        code: 500,
        success: true,
        message: '用户信息失效',
        data: { id: 1, username: 'buyer', nickname: '假资料' }
      } as any)

      await expect(userStore.fetchCurrentUser()).rejects.toThrow('用户信息失效')

      expect(userStore.userInfo).toBeNull()
      expect(userStore.error).toBe('用户信息失效')
    })

    it('should ignore stale current-user success response and keep latest user info', async () => {
      userStore.token = 'token'
      const firstRequest = createDeferred<any>()
      const secondRequest = createDeferred<any>()

      mockedAuthApi.getCurrentUser
        .mockImplementationOnce(() => firstRequest.promise)
        .mockImplementationOnce(() => secondRequest.promise)

      const firstLoad = userStore.fetchCurrentUser()
      const secondLoad = userStore.fetchCurrentUser()

      secondRequest.resolve({
        code: 200,
        success: true,
        data: { id: 1, username: 'buyer', nickname: '最新昵称' }
      })
      await secondLoad

      expect(userStore.userInfo).toMatchObject({ nickname: '最新昵称' })

      firstRequest.resolve({
        code: 200,
        success: true,
        data: { id: 1, username: 'buyer', nickname: '旧昵称' }
      })
      await firstLoad

      expect(userStore.userInfo).toMatchObject({ nickname: '最新昵称' })
    })

    it('should ignore stale current-user failure and keep latest user info', async () => {
      userStore.token = 'token'
      const firstRequest = createDeferred<any>()
      const secondRequest = createDeferred<any>()

      mockedAuthApi.getCurrentUser
        .mockImplementationOnce(() => firstRequest.promise)
        .mockImplementationOnce(() => secondRequest.promise)

      const firstLoad = userStore.fetchCurrentUser()
      const secondLoad = userStore.fetchCurrentUser()

      secondRequest.resolve({
        code: 200,
        success: true,
        data: { id: 1, username: 'buyer', nickname: '保留昵称' }
      })
      await secondLoad

      firstRequest.reject(new Error('旧请求失败'))
      await firstLoad

      expect(userStore.userInfo).toMatchObject({ nickname: '保留昵称' })
      expect(userStore.error).toBeNull()
    })

    it('should not let an in-flight current-user request restore session after logout', async () => {
      userStore.token = 'token'
      userStore.userInfo = { id: 1, username: 'buyer', nickname: '退出前昵称' } as any
      const pendingRequest = createDeferred<any>()

      mockedAuthApi.getCurrentUser.mockImplementationOnce(() => pendingRequest.promise)
      mockedAuthApi.logout.mockResolvedValue({} as any)

      const loadPromise = userStore.fetchCurrentUser()
      await userStore.logout()

      pendingRequest.resolve({
        code: 200,
        success: true,
        data: { id: 1, username: 'buyer', nickname: '旧请求昵称' }
      })
      await loadPromise

      expect(userStore.token).toBeNull()
      expect(userStore.userInfo).toBeNull()
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_KEYS.USER_INFO,
        expect.stringContaining('"nickname":"旧请求昵称"')
      )
    })

    it('should not let an in-flight current-user request overwrite optimistic user update', async () => {
      userStore.token = 'token'
      userStore.userInfo = {
        id: 1,
        username: 'buyer',
        nickname: '旧昵称',
        email: 'old@example.com'
      } as any
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.USER_INFO) {
          return JSON.stringify(userStore.userInfo)
        }
        return null
      })
      const pendingRequest = createDeferred<any>()

      mockedAuthApi.getCurrentUser.mockImplementationOnce(() => pendingRequest.promise)
      mockedAuthApi.updateUserInfo.mockResolvedValue({
        code: 200,
        success: true,
        data: {
          id: 1,
          username: 'buyer',
          nickname: '新昵称',
          email: 'new@example.com'
        }
      } as any)

      const loadPromise = userStore.fetchCurrentUser()
      await userStore.updateUserInfo({ nickname: '新昵称', email: 'new@example.com' } as any)

      pendingRequest.resolve({
        code: 200,
        success: true,
        data: {
          id: 1,
          username: 'buyer',
          nickname: '旧请求昵称',
          email: 'stale@example.com'
        }
      })
      await loadPromise

      expect(userStore.userInfo).toMatchObject({ nickname: '新昵称', email: 'new@example.com' })
    })
  })
})
