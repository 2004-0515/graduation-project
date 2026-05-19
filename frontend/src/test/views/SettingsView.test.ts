import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRoute, mockRouter, settingsApi, messageBox, messages, mockUserStore, debugError, matchMediaRemoveListener } =
  vi.hoisted(() => ({
    mockRoute: {
      query: {
        section: 'privacy'
      }
    },
    mockRouter: {
      push: vi.fn()
    },
    settingsApi: {
      getNotificationSettings: vi.fn(),
      updateNotificationSettings: vi.fn(),
      getPrivacySettings: vi.fn(),
      updatePrivacySettings: vi.fn()
    },
    messageBox: {
      confirm: vi.fn(),
      prompt: vi.fn()
    },
    messages: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    mockUserStore: {
      userInfo: {
        id: 1,
        username: 'buyer',
        email: 'buyer@example.com',
        phone: '13800138000'
      },
      updateUserInfo: vi.fn(),
      changePassword: vi.fn(),
      deleteAccount: vi.fn(),
      logout: vi.fn()
    },
    debugError: vi.fn(),
    matchMediaRemoveListener: vi.fn()
  }))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => mockUserStore
}))

vi.mock('@/api/settingsApi', () => ({
  default: settingsApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import SettingsView from '@/views/SettingsView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const createWrapper = () =>
  mount(SettingsView, {
    global: {
      stubs: {
        Navbar: true,
        Footer: true,
        ElDialog: {
          template: '<div><slot /><slot name="footer" /></div>'
        },
        ElForm: {
          template: '<form><slot /></form>'
        },
        ElFormItem: {
          template: '<div><slot /></div>'
        },
        ElInput: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template:
            '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
        },
        ElButton: {
          template: '<button type="button" @click="$emit(\'click\')"><slot /></button>'
        },
        ElSwitch: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template:
            '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
        },
        ElSelect: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template:
            '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
        },
        ElOption: {
          props: ['label', 'value'],
          template: '<option :value="value">{{ label }}</option>'
        }
      }
    }
  })

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.setItem = vi.fn()
    window.localStorage.removeItem = vi.fn()
    mockUserStore.updateUserInfo.mockResolvedValue({
      id: 1,
      username: 'buyer',
      email: 'buyer@example.com',
      phone: '13800138000'
    })
    mockUserStore.changePassword.mockResolvedValue('密码修改成功')
    mockUserStore.deleteAccount.mockResolvedValue(undefined)
    settingsApi.getNotificationSettings.mockResolvedValue({ code: 200, data: {} })
    settingsApi.getPrivacySettings.mockResolvedValue({
      code: 200,
      data: { profileVisibility: 'friends' }
    })
    settingsApi.updateNotificationSettings.mockResolvedValue({ code: 200 })
    settingsApi.updatePrivacySettings.mockResolvedValue({ code: 200 })
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: matchMediaRemoveListener
    })) as typeof window.matchMedia
  })

  it('shows only server-backed privacy settings', async () => {
    const wrapper = createWrapper()

    await flushPromises()

    expect(wrapper.text()).toContain('个人资料可见性')
    expect(wrapper.text()).not.toContain('购买记录')
    expect(wrapper.text()).not.toContain('个性化推荐')
    expect(wrapper.text()).toContain('当前服务器已接入的隐私项只有资料可见性')
  })

  it('marks appearance settings as browser-local only', async () => {
    mockRoute.query.section = 'appearance'

    const wrapper = createWrapper()
    await flushPromises()

    const appearanceSection = wrapper.get('[data-testid="settings-section-appearance"]')
    expect(appearanceSection.text()).toContain('仅在当前浏览器保存和生效')
    expect(appearanceSection.text()).toContain('仅当前浏览器')
  })

  it('does not show unsupported comment notification toggle', async () => {
    mockRoute.query.section = 'notification'

    const wrapper = createWrapper()

    await flushPromises()

    expect(wrapper.text()).toContain('订单通知')
    expect(wrapper.text()).not.toContain('评论回复')
  })

  it('describes account deletion constraints instead of promising unconditional removal', async () => {
    mockRoute.query.section = 'account'

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('仅当账号没有订单、卖家商品、卖家订单项或评价时才可注销')
    expect(wrapper.text()).not.toContain('永久删除您的账户和所有数据')
  })

  it('does not save notification or privacy settings during initial load', async () => {
    mockRoute.query.section = 'privacy'

    createWrapper()

    await flushPromises()

    expect(settingsApi.updateNotificationSettings).not.toHaveBeenCalled()
    expect(settingsApi.updatePrivacySettings).not.toHaveBeenCalled()
  })

  it('keeps defaults and logs when initial settings payload is non-200', async () => {
    settingsApi.getNotificationSettings.mockResolvedValue({ code: 500, message: '通知设置异常' })
    settingsApi.getPrivacySettings.mockResolvedValue({ code: 500, message: '隐私设置异常' })

    const wrapper = createWrapper()

    await flushPromises()

    expect(wrapper.text()).toContain('当前服务器已接入的隐私项只有资料可见性')
    expect(settingsApi.updateNotificationSettings).not.toHaveBeenCalled()
    expect(settingsApi.updatePrivacySettings).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取通知设置失败:', '通知设置异常')
    expect(debugError).toHaveBeenCalledWith('获取隐私设置失败:', '隐私设置异常')
  })

  it('clears invalid appearance cache and falls back to defaults', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'fontSize') return 'huge'
      if (key === 'theme') return 'sepia'
      return null
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect((wrapper.vm as any).appearanceSettings.fontSize).toBe('medium')
    expect((wrapper.vm as any).currentTheme).toBe('light')
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('fontSize')
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('theme')
    expect(debugError).toHaveBeenCalledWith('读取字体大小设置失败:', 'invalid fontSize: huge')
    expect(debugError).toHaveBeenCalledWith('读取主题设置失败:', 'invalid theme: sepia')
  })

  it('keeps default appearance when clearing invalid cache throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'fontSize') return 'huge'
      if (key === 'theme') return 'sepia'
      return null
    })
    window.localStorage.removeItem = vi.fn(() => {
      throw new Error('remove blocked')
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect((wrapper.vm as any).appearanceSettings.fontSize).toBe('medium')
    expect((wrapper.vm as any).currentTheme).toBe('light')
    expect(debugError).toHaveBeenCalledWith('读取字体大小设置失败:', 'invalid fontSize: huge')
    expect(debugError).toHaveBeenCalledWith('清理字体大小设置失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('读取主题设置失败:', 'invalid theme: sepia')
    expect(debugError).toHaveBeenCalledWith('清理主题设置失败:', expect.any(Error))
  })

  it('keeps appearance defaults when localStorage read throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'fontSize' || key === 'theme') {
        throw new Error(`${key} unreadable`)
      }
      return null
    })

    const wrapper = createWrapper()
    await flushPromises()

    expect((wrapper.vm as any).appearanceSettings.fontSize).toBe('medium')
    expect((wrapper.vm as any).currentTheme).toBe('light')
    expect(debugError).toHaveBeenCalledWith('读取字体大小设置失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('读取主题设置失败:', expect.any(Error))
  })

  it('logs and keeps working when saving appearance settings to localStorage throws', async () => {
    window.localStorage.setItem = vi.fn((key: string) => {
      if (key === 'fontSize' || key === 'theme') {
        throw new Error(`${key} unwritable`)
      }
    })

    const wrapper = createWrapper()
    await flushPromises()

    ;(wrapper.vm as any).appearanceSettings.fontSize = 'large'
    await flushPromises()
    ;(wrapper.vm as any).currentTheme = 'dark'
    await flushPromises()

    expect(document.documentElement.style.getPropertyValue('--base-font-size')).toBe('18px')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
    expect(debugError).toHaveBeenCalledWith('保存字体大小设置失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('保存主题设置失败:', expect.any(Error))
  })

  it('cleans up system theme listener on unmount', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    wrapper.unmount()

    expect(matchMediaRemoveListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('shows backend message when saving notification settings returns non-200 payload', async () => {
    mockRoute.query.section = 'notification'
    settingsApi.updateNotificationSettings.mockResolvedValue({ code: 500, message: '通知设置保存失败' })

    const wrapper = createWrapper()
    await flushPromises()

    const toggle = wrapper.find('input[type="checkbox"]')
    await toggle.setValue(false)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('通知设置保存失败')
  })

  it('shows notification autosave states and rolls back after failure', async () => {
    mockRoute.query.section = 'notification'
    settingsApi.getNotificationSettings.mockResolvedValue({
      code: 200,
      data: {
        orderStatusEnabled: true,
        promotionsEnabled: true,
        systemEnabled: true,
        deliveryEnabled: true
      }
    })
    const pendingSave = deferred<any>()
    settingsApi.updateNotificationSettings.mockReturnValueOnce(pendingSave.promise)

    const wrapper = createWrapper()
    await flushPromises()

    const toggle = wrapper.find('input[type="checkbox"]')
    expect((toggle.element as HTMLInputElement).checked).toBe(true)

    await toggle.setValue(false)
    await flushPromises()

    expect(wrapper.text()).toContain('保存中')
    expect((toggle.element as HTMLInputElement).checked).toBe(false)

    pendingSave.resolve({ code: 500, message: '通知设置保存失败' })
    await flushPromises()

    expect(wrapper.text()).toContain('保存失败并回退')
    expect((toggle.element as HTMLInputElement).checked).toBe(true)
    expect(messages.error).toHaveBeenCalledWith('通知设置保存失败')
  })

  it('shows backend message when saving privacy settings returns non-200 payload', async () => {
    mockRoute.query.section = 'privacy'
    settingsApi.updatePrivacySettings.mockResolvedValue({ code: 500, message: '隐私设置保存失败' })

    const wrapper = createWrapper()
    await flushPromises()

    const select = wrapper.find('select')
    await select.setValue('private')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('隐私设置保存失败')
  })

  it('shows privacy autosave states and rolls back after failure', async () => {
    mockRoute.query.section = 'privacy'
    settingsApi.getPrivacySettings.mockResolvedValue({
      code: 200,
      data: { profileVisibility: 'friends' }
    })
    const pendingSave = deferred<any>()
    settingsApi.updatePrivacySettings.mockReturnValueOnce(pendingSave.promise)

    const wrapper = createWrapper()
    await flushPromises()

    const select = wrapper.find('select')
    expect((select.element as HTMLSelectElement).value).toBe('friends')

    await select.setValue('private')
    await flushPromises()

    expect(wrapper.text()).toContain('保存中')
    expect((select.element as HTMLSelectElement).value).toBe('private')

    pendingSave.resolve({ code: 500, message: '隐私设置保存失败' })
    await flushPromises()

    expect(wrapper.text()).toContain('保存失败并回退')
    expect((select.element as HTMLSelectElement).value).toBe('friends')
    expect(messages.error).toHaveBeenCalledWith('隐私设置保存失败')
  })

  it('does not leave fake phone update state when saving phone fails', async () => {
    mockUserStore.updateUserInfo.mockRejectedValue(new Error('手机号保存失败'))

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '更换')?.trigger('click')
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('13900139000')
    await wrapper.findAll('button').find((button) => button.text() === '确定')?.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('手机号保存失败')
    expect(mockUserStore.userInfo.phone).toBe('13800138000')
    expect(debugError).toHaveBeenCalledWith('保存手机号失败:', expect.any(Error))
  })

  it('logs failure when saving email throws', async () => {
    mockRoute.query.section = 'security'
    mockUserStore.updateUserInfo.mockRejectedValue(new Error('邮箱保存失败'))

    const wrapper = createWrapper()
    await flushPromises()

    ;(wrapper.vm as any).openEmailDialog()
    ;(wrapper.vm as any).emailForm.email = 'new@example.com'
    await (wrapper.vm as any).saveEmail()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('邮箱保存失败')
    expect(debugError).toHaveBeenCalledWith('保存邮箱失败:', expect.any(Error))
  })

  it('clears phone and email dialog state after saving succeeds', async () => {
    mockUserStore.updateUserInfo.mockResolvedValue(undefined)

    const wrapper = createWrapper()
    await flushPromises()

    ;(wrapper.vm as any).openPhoneDialog()
    ;(wrapper.vm as any).phoneForm.phone = '13900139000'
    await (wrapper.vm as any).savePhone()
    await flushPromises()

    expect((wrapper.vm as any).phoneDialogVisible).toBe(false)
    expect((wrapper.vm as any).phoneForm.phone).toBe('')

    ;(wrapper.vm as any).openEmailDialog()
    ;(wrapper.vm as any).emailForm.email = 'new@example.com'
    await (wrapper.vm as any).saveEmail()
    await flushPromises()

    expect((wrapper.vm as any).emailDialogVisible).toBe(false)
    expect((wrapper.vm as any).emailForm.email).toBe('')
  })

  it('shows backend message when changing password returns non-200 payload', async () => {
    mockRoute.query.section = 'security'
    mockUserStore.changePassword.mockRejectedValue(new Error('当前密码不正确'))

    const wrapper = createWrapper()
    await flushPromises()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('old-pass')
    await inputs[1].setValue('new-pass-1')
    await inputs[2].setValue('new-pass-1')
    await wrapper.get('button.primary-btn').trigger('click')
    await flushPromises()

    expect(mockUserStore.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass',
      newPassword: 'new-pass-1',
      confirmPassword: 'new-pass-1'
    })
    expect(messages.error).toHaveBeenCalledWith('当前密码不正确')
    expect(debugError).toHaveBeenCalledWith('密码修改失败:', expect.any(Error))
  })

  it('shows thrown message when changing password request fails', async () => {
    mockRoute.query.section = 'security'
    mockUserStore.changePassword.mockRejectedValue({ response: { data: { message: '密码服务暂时不可用' } } })

    const wrapper = createWrapper()
    await flushPromises()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('old-pass')
    await inputs[1].setValue('new-pass-1')
    await inputs[2].setValue('new-pass-1')
    await wrapper.get('button.primary-btn').trigger('click')
    await flushPromises()

    expect(mockUserStore.changePassword).toHaveBeenCalled()
    expect(messages.error).toHaveBeenCalledWith('密码服务暂时不可用')
    expect(debugError).toHaveBeenCalledWith('密码修改失败:', expect.any(Object))
  })

  it('does not show an error when user cancels deleting account', async () => {
    messageBox.confirm.mockRejectedValue('cancel')

    const wrapper = createWrapper()
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '注销账户')
    await deleteButton?.trigger('click')
    await flushPromises()

    expect(mockUserStore.deleteAccount).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('does not log out when user cancels logout', async () => {
    messageBox.confirm.mockRejectedValue('cancel')

    const wrapper = createWrapper()
    await flushPromises()

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === '退出登录')
    await logoutButton?.trigger('click')
    await flushPromises()

    expect(mockUserStore.logout).not.toHaveBeenCalled()
    expect(messages.success).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('logs out and redirects when logout is confirmed', async () => {
    messageBox.confirm.mockResolvedValue(undefined)
    mockUserStore.logout.mockResolvedValue(undefined)

    const wrapper = createWrapper()
    await flushPromises()

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === '退出登录')
    await logoutButton?.trigger('click')
    await flushPromises()

    expect(mockUserStore.logout).toHaveBeenCalled()
    expect(messages.success).toHaveBeenCalledWith('已退出登录')
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('waits for user store account deletion before redirecting', async () => {
    messageBox.confirm.mockResolvedValue(undefined)

    let resolveDeleteAccount: (() => void) | undefined
    mockUserStore.deleteAccount.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveDeleteAccount = resolve
      })
    )

    const wrapper = createWrapper()
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '注销账户')
    await deleteButton?.trigger('click')
    await flushPromises()

    expect(mockUserStore.deleteAccount).toHaveBeenCalled()
    expect(messages.success).not.toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()

    resolveDeleteAccount?.()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('账户已注销')
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('redirects after user store account deletion succeeds', async () => {
    messageBox.confirm.mockResolvedValue(undefined)
    mockUserStore.deleteAccount.mockResolvedValue(undefined)

    const wrapper = createWrapper()
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '注销账户')
    await deleteButton?.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('账户已注销')
    expect(messages.error).not.toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('shows backend message when deleting account fails', async () => {
    messageBox.confirm.mockResolvedValue(undefined)
    mockUserStore.deleteAccount.mockRejectedValue({ response: { data: { message: '账户注销失败' } } })

    const wrapper = createWrapper()
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '注销账户')
    await deleteButton?.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('账户注销失败')
    expect(debugError).toHaveBeenCalledWith('注销账户失败:', expect.any(Object))
  })

  it('shows thrown message when deleting account store rejects with validation error', async () => {
    messageBox.confirm.mockResolvedValue(undefined)
    mockUserStore.deleteAccount.mockRejectedValue(new Error('账户仍有关联订单，无法注销'))

    const wrapper = createWrapper()
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '注销账户')
    await deleteButton?.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('账户仍有关联订单，无法注销')
    expect(debugError).toHaveBeenCalledWith('注销账户失败:', expect.any(Error))
    expect(mockUserStore.deleteAccount).toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('keeps newer notification settings when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    settingsApi.getNotificationSettings
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    settingsApi.getPrivacySettings.mockResolvedValue({ code: 200, data: { profileVisibility: 'public' } })

    const wrapper = createWrapper()
    await flushPromises()

    const vm = wrapper.vm as any
    const secondLoad = vm.loadNotificationSettings()
    await flushPromises()

    second.resolve({
      code: 200,
      data: {
        orderStatusEnabled: false,
        promotionsEnabled: false,
        systemEnabled: true,
        deliveryEnabled: false
      }
    })
    await secondLoad
    await flushPromises()

    expect(vm.notifySettings.order).toBe(false)
    expect(vm.notifySettings.promotion).toBe(false)

    first.resolve({
      code: 200,
      data: {
        orderStatusEnabled: true,
        promotionsEnabled: true,
        systemEnabled: false,
        deliveryEnabled: true
      }
    })
    await flushPromises()

    expect(vm.notifySettings.order).toBe(false)
    expect(vm.notifySettings.promotion).toBe(false)
  })
})
