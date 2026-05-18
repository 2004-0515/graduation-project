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

import musicApi from '@/api/musicApi'

describe('musicApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets enabled music list', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(musicApi.getEnabledMusic()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/music/enabled')
  })

  it('gets all music', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(musicApi.getAllMusic()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/music')
  })

  it('adds music metadata', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { title: 'Song', artist: 'OpenAI' }
    axiosMock.post.mockResolvedValue(response)

    await expect(musicApi.addMusic(payload)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/music', payload)
  })

  it('updates music metadata', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { title: 'Song 2' }
    axiosMock.put.mockResolvedValue(response)

    await expect(musicApi.updateMusic(1, payload)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/music/1', payload)
  })

  it('deletes music', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(musicApi.deleteMusic(1)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/music/1')
  })

  it('updates music status', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(musicApi.updateStatus(1, 0)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/music/1/status', { status: 0 })
  })

  it('uploads music file as form data', async () => {
    const response = { code: 200, data: '/music/song.mp3' }
    const file = new File(['abc'], 'song.mp3', { type: 'audio/mpeg' })
    axiosMock.post.mockResolvedValue(response)

    await expect(musicApi.uploadMusic(file)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith(
      '/music/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  })

  it('uploads cover file as form data', async () => {
    const response = { code: 200, data: '/music/cover.png' }
    const file = new File(['abc'], 'cover.png', { type: 'image/png' })
    axiosMock.post.mockResolvedValue(response)

    await expect(musicApi.uploadCover(file)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith(
      '/music/upload-cover',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  })
})
