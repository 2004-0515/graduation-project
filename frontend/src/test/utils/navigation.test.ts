import { describe, expect, it } from 'vitest'
import {
  buildLoggedOutLoginLocation,
  buildLoginLocation,
  resolveDefaultPostLoginTarget,
  resolvePostLoginTarget,
  resolveRedirectTarget
} from '@/utils/navigation'

describe('navigation auth helpers', () => {
  it('preserves a safe in-app redirect for login-required flows', () => {
    expect(resolveRedirectTarget({ query: { redirect: '/orders?status=1' } } as any, '/')).toBe('/orders?status=1')
    expect(buildLoginLocation('/checkout')).toEqual({
      path: '/login',
      query: { redirect: '/checkout' },
      replace: true
    })
  })

  it('rejects auth pages and external redirects', () => {
    expect(resolveRedirectTarget({ query: { redirect: '//evil.example' } } as any, '/')).toBe('/')
    expect(resolveRedirectTarget({ query: { redirect: '/login?redirect=/orders' } } as any, '/')).toBe('/')
    expect(buildLoginLocation('/login')).toEqual({
      path: '/login',
      query: undefined,
      replace: true
    })
  })

  it('ignores stale redirect after explicit logout', () => {
    expect(resolvePostLoginTarget({ query: { redirect: '/admin/music', loggedOut: '1' } } as any, { role: 'ADMIN' })).toBe('/admin')
    expect(buildLoggedOutLoginLocation()).toEqual({
      path: '/login',
      query: { loggedOut: '1' },
      replace: true
    })
  })

  it('uses role-aware defaults when there is no redirect', () => {
    expect(resolveDefaultPostLoginTarget({ role: 'ADMIN' })).toBe('/admin')
    expect(resolveDefaultPostLoginTarget({ role: 'SELLER' })).toBe('/my-products')
    expect(resolveDefaultPostLoginTarget({ role: 'BUYER' })).toBe('/')
  })
})
