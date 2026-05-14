import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { debugError, matchMediaRemoveListener } = vi.hoisted(() => ({
  debugError: vi.fn(),
  matchMediaRemoveListener: vi.fn()
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import App from '@/App.vue'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem = vi.fn(() => null)
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: matchMediaRemoveListener
    })) as typeof window.matchMedia
    document.documentElement.classList.remove('dark-theme')
    document.documentElement.style.removeProperty('--base-font-size')
  })

  const mountView = () =>
    mount(App, {
      global: {
        stubs: {
          RouterView: true,
          MusicPlayer: true,
          ElConfigProvider: {
            template: '<div><slot /></div>'
          }
        }
      }
  })

  it('keeps app mount working when reading appearance storage throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'fontSize' || key === 'theme') {
        throw new Error(`${key} unreadable`)
      }
      return null
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('#app').exists()).toBe(true)
    expect(debugError).toHaveBeenCalledWith('读取字体大小设置失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('读取主题设置失败:', expect.any(Error))
  })

  it('removes system theme listener on unmount', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.unmount()

    expect(matchMediaRemoveListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
