import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/userStore'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
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
    updateUserInfo: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn()
  }
}))

describe('useUserStore', () => {
  let userStore: ReturnType<typeof useUserStore>

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
})
