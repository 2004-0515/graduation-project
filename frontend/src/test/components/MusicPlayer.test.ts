import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { musicApi, debugError, debugLog } = vi.hoisted(() => ({
  musicApi: {
    getEnabledMusic: vi.fn()
  },
  debugError: vi.fn(),
  debugLog: vi.fn()
}))

vi.mock('@/api/musicApi', () => ({
  default: musicApi
}))

vi.mock('@/utils/debug', () => ({
  debugError,
  debugLog
}))

import MusicPlayer from '@/components/MusicPlayer.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('MusicPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'requestIdleCallback', {
      value: undefined,
      configurable: true
    })
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.setItem = vi.fn()
    window.localStorage.removeItem = vi.fn()
  })

  const mountView = () => mount(MusicPlayer)

  it('loads enabled music list successfully', async () => {
    musicApi.getEnabledMusic.mockResolvedValue({
      code: 200,
      data: [
        { id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '/a.jpg' }
      ]
    })

    const wrapper = mountView()
    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    expect((wrapper.vm as any).musicList).toHaveLength(1)
    expect((wrapper.vm as any).loadError).toBe(false)
  })

  it('marks load error and logs backend message when enabled music returns non-200', async () => {
    musicApi.getEnabledMusic.mockResolvedValue({
      code: 500,
      message: '音乐列表读取失败'
    })

    const wrapper = mountView()
    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    expect((wrapper.vm as any).loadError).toBe(true)
    expect(debugError).toHaveBeenCalledWith('加载音乐失败', expect.any(Error))
    expect((debugError as any).mock.calls[0][1].message).toBe('音乐列表读取失败')
  })

  it('retryLoad resets retry count before reloading', async () => {
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })
    const wrapper = mountView()
    ;(wrapper.vm as any).retryCount = 2

    await (wrapper.vm as any).retryLoad()
    await flushPromises()

    expect((wrapper.vm as any).retryCount).toBe(0)
    expect(musicApi.getEnabledMusic).toHaveBeenCalled()
  })

  it('keeps newer music list when older load resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    musicApi.getEnabledMusic
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()
    const vm = wrapper.vm as any

    vm.loadMusic()
    vm.loadMusic()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 2, title: '新歌曲', artist: '新歌手', url: '/new.mp3', cover: '/new.jpg' }]
    })
    await flushPromises()

    expect(vm.musicList).toEqual([
      { id: 2, title: '新歌曲', artist: '新歌手', url: '/new.mp3', cover: '/new.jpg' }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 1, title: '旧歌曲', artist: '旧歌手', url: '/old.mp3', cover: '/old.jpg' }]
    })
    await flushPromises()

    expect(vm.musicList).toEqual([
      { id: 2, title: '新歌曲', artist: '新歌手', url: '/new.mp3', cover: '/new.jpg' }
    ])
  })

  it('clears broken saved player state and falls back to defaults', async () => {
    window.localStorage.getItem = vi.fn((key: string) =>
      key === 'musicPlayerState' ? '{broken-json' : null
    )
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    expect((wrapper.vm as any).volume).toBe(80)
    expect((wrapper.vm as any).isMuted).toBe(false)
    expect((wrapper.vm as any).loopMode).toBe('list')
    expect(debugError).toHaveBeenCalledWith('恢复播放状态失败', expect.any(Error))
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('musicPlayerState')
  })

  it('keeps fallback defaults when clearing broken player state throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) =>
      key === 'musicPlayerState' ? '{broken-json' : null
    )
    window.localStorage.removeItem = vi.fn(() => {
      throw new Error('remove blocked')
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    expect((wrapper.vm as any).volume).toBe(80)
    expect(debugError).toHaveBeenCalledWith('恢复播放状态失败', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('清理播放状态失败', expect.any(Error))
  })

  it('keeps defaults when reading saved player state throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'musicPlayerState') {
        throw new Error('state unreadable')
      }
      return null
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    expect((wrapper.vm as any).volume).toBe(80)
    expect((wrapper.vm as any).isMuted).toBe(false)
    expect((wrapper.vm as any).loopMode).toBe('list')
    expect(debugError).toHaveBeenCalledWith('读取播放状态失败', expect.any(Error))
  })

  it('clears broken saved player position and falls back to a valid default position', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'musicPlayerPosition') {
        return '{broken-position'
      }
      return null
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    expect(vm.position.x).toBeTypeOf('number')
    expect(vm.position.y).toBeTypeOf('number')
    expect(debugError).toHaveBeenCalledWith('恢复播放器位置失败', expect.any(Error))
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('musicPlayerPosition')
  })

  it('keeps fallback position when clearing broken player position throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'musicPlayerPosition') {
        return '{broken-position'
      }
      return null
    })
    window.localStorage.removeItem = vi.fn(() => {
      throw new Error('remove blocked')
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    expect(vm.position.x).toBeTypeOf('number')
    expect(vm.position.y).toBeTypeOf('number')
    expect(debugError).toHaveBeenCalledWith('恢复播放器位置失败', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('清理播放器位置失败', expect.any(Error))
  })

  it('keeps fallback position when reading saved player position throws', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'musicPlayerPosition') {
        throw new Error('position unreadable')
      }
      return null
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    expect(vm.position.x).toBeTypeOf('number')
    expect(vm.position.y).toBeTypeOf('number')
    expect(debugError).toHaveBeenCalledWith('读取播放器位置失败', expect.any(Error))
  })

  it('falls back when saved player position shape is invalid', async () => {
    window.localStorage.getItem = vi.fn((key: string) => {
      if (key === 'musicPlayerPosition') {
        return JSON.stringify({ left: 120, top: 240 })
      }
      return null
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    expect(vm.position.x).toBeTypeOf('number')
    expect(vm.position.y).toBeTypeOf('number')
    expect(debugError).toHaveBeenCalledWith('恢复播放器位置失败', expect.any(Error))
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('musicPlayerPosition')
  })

  it('logs and keeps current player state when saving playback state fails', async () => {
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('state unwritable')
    })
    musicApi.getEnabledMusic.mockResolvedValue({
      code: 200,
      data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '/a.jpg' }]
    })

    const wrapper = mountView()
    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.volume = 66
    vm.currentIndex = 0
    vm.savePlayerState()

    expect(vm.volume).toBe(66)
    expect(debugError).toHaveBeenCalledWith('保存播放状态失败', expect.any(Error))
  })

  it('logs and keeps drag result when saving player position fails', async () => {
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('position unwritable')
    })
    musicApi.getEnabledMusic.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.position.x = 120
    vm.position.y = 220
    vm.isDragging = true
    vm.stopDrag()

    expect(vm.position.x).toBe(120)
    expect(vm.position.y).toBe(220)
    expect(vm.isDragging).toBe(false)
    expect(debugError).toHaveBeenCalledWith('保存播放器位置失败', expect.any(Error))
  })
})
