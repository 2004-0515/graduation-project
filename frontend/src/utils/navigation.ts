import { useRouter, type RouteLocationNormalizedLoaded, type RouteLocationRaw, type Router } from 'vue-router'
import type { User } from '@/types'
import { isAdminUser, isSellerUser } from '@/utils/roles'

const firstQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined
  }
  return typeof value === 'string' ? value : undefined
}

const isAuthPagePath = (path: string): boolean =>
  path === '/login' ||
  path === '/register' ||
  path.startsWith('/login?') ||
  path.startsWith('/register?')

const isSafeAppRedirect = (path: unknown): path is string =>
  typeof path === 'string' &&
  path.startsWith('/') &&
  !path.startsWith('//') &&
  !isAuthPagePath(path)

const isAfterExplicitLogout = (route: Pick<RouteLocationNormalizedLoaded, 'query'>): boolean =>
  firstQueryValue(route.query.loggedOut) === '1'

const hasBrowserHistory = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.history.length > 1
}

export const goBackOr = (router: Router, fallback: RouteLocationRaw) => {
  if (hasBrowserHistory()) {
    router.back()
    return
  }

  router.push(fallback)
}

export const resolveRedirectTarget = (
  route: Pick<RouteLocationNormalizedLoaded, 'query'>,
  fallback: RouteLocationRaw = '/'
) => {
  const redirect = firstQueryValue(route.query.redirect)
  if (!isAfterExplicitLogout(route) && isSafeAppRedirect(redirect)) {
    return redirect
  }

  return fallback
}

export const resolveDefaultPostLoginTarget = (user?: Pick<User, 'role'> | null): RouteLocationRaw => {
  if (isAdminUser(user)) {
    return '/admin'
  }
  if (isSellerUser(user)) {
    return '/my-products'
  }
  return '/'
}

export const resolvePostLoginTarget = (
  route: Pick<RouteLocationNormalizedLoaded, 'query'>,
  user?: Pick<User, 'role'> | null
): RouteLocationRaw => resolveRedirectTarget(route, resolveDefaultPostLoginTarget(user))

export const buildLoginLocation = (redirect: string): RouteLocationRaw => {
  const query = isSafeAppRedirect(redirect) ? { redirect } : undefined
  return {
    path: '/login',
    query,
    replace: true
  }
}

export const buildLoggedOutLoginLocation = (): RouteLocationRaw => ({
  path: '/login',
  query: { loggedOut: '1' },
  replace: true
})

export const navigateTo = (
  path: RouteLocationRaw,
  options: {
    scrollToTop?: boolean
    replace?: boolean
  } = {}
) => {
  const router = useRouter()
  const { scrollToTop = true, replace = false } = options

  if (replace) {
    router.replace(path)
  } else {
    router.push(path)
  }

  if (scrollToTop && typeof window !== 'undefined') {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }, 100)
  }
}

export const refreshPage = (scrollToTop = true) => {
  const router = useRouter()
  router.go(0)

  if (scrollToTop && typeof window !== 'undefined') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

export const goBack = (scrollToTop = false) => {
  const router = useRouter()
  router.back()

  if (scrollToTop && typeof window !== 'undefined') {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }, 100)
  }
}
