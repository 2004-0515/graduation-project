import { describe, expect, it } from 'vitest'
import fileApi from '@/api/fileApi'

describe('fileApi.getImageUrl', () => {
  it('returns empty string for empty path', () => {
    expect(fileApi.getImageUrl('')).toBe('')
    expect(fileApi.getImageUrl(null)).toBe('')
    expect(fileApi.getImageUrl(undefined)).toBe('')
  })

  it('keeps absolute urls unchanged', () => {
    expect(fileApi.getImageUrl('http://example.com/a.png')).toBe('http://example.com/a.png')
    expect(fileApi.getImageUrl('https://example.com/a.png')).toBe('https://example.com/a.png')
  })

  it('keeps data urls unchanged', () => {
    expect(fileApi.getImageUrl('data:image/svg+xml,abc')).toBe('data:image/svg+xml,abc')
  })

  it('normalizes local upload paths to same-origin relative path', () => {
    expect(fileApi.getImageUrl('/uploads/a.png')).toBe('/uploads/a.png')
    expect(fileApi.getImageUrl('uploads/a.png')).toBe('/uploads/a.png')
  })
})
