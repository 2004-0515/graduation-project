import { useRouter, type RouteLocationNormalizedLoaded, type RouteLocationRaw, type Router } from 'vue-router'

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
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }

  return fallback
}

export const buildLoginLocation = (redirect: string): RouteLocationRaw => ({
  path: '/login',
  query: { redirect }
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
