import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test'

export const E2E_USERS = {
  buyer: process.env.E2E_USERNAME || 'zhangsan',
  seller: process.env.E2E_SELLER_USERNAME || 'lisi',
  admin: process.env.E2E_ADMIN_USERNAME || 'admin'
}

export const E2E_PASSWORD = process.env.E2E_PASSWORD || '123456'
export const E2E_PRODUCTS = {
  smoke: Number(process.env.E2E_PRODUCT_ID || '0'),
  shipping: Number(process.env.E2E_SHIPPING_PRODUCT_ID || '0'),
  cancel: Number(process.env.E2E_CANCEL_PRODUCT_ID || '0'),
  priceAlert: Number(process.env.E2E_PRICE_ALERT_PRODUCT_ID || '0')
}

type Session = {
  token: string
  user: Record<string, unknown>
}

type ProductRecord = {
  id: number
  name?: string
  price?: number
  status?: number
  stock?: number
  sellerId?: number | null
  sellerName?: string | null
}

type ProductSelectionOptions = {
  explicitId?: number
  sellerUsername?: string
  excludeSellerUsername?: string
}

type PageReadyOptions = {
  testId?: string
  heading?: string | RegExp
}

const sessionCache = new Map<string, Session>()
const productSelectionCache = new Map<string, number>()

export async function neutralizeFloatingUi(page: Page) {
  await page
    .addInitScript(() => {
      const marker = '__E2E_HIDE_GLOBAL_MUSIC_PLAYER__'
      if ((window as Record<string, unknown>)[marker]) {
        return
      }
      ;(window as Record<string, unknown>)[marker] = true

      const hideMusicPlayer = () => {
        const elements = document.querySelectorAll<HTMLElement>('[data-testid="global-music-player"]')
        for (const element of elements) {
          element.style.setProperty('display', 'none', 'important')
          element.style.setProperty('visibility', 'hidden', 'important')
          element.style.setProperty('pointer-events', 'none', 'important')
        }
      }

      hideMusicPlayer()
      new MutationObserver(() => hideMusicPlayer()).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true
      })
    })
    .catch(() => {})

  await page.addStyleTag({
    content: `
      [data-testid="global-music-player"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      [data-testid="global-music-player"] * {
        pointer-events: none !important;
      }
    `
  }).catch(() => {})

  await page
    .locator('[data-testid="global-music-player"]')
    .evaluateAll((elements) => {
      for (const element of elements) {
        if (element instanceof HTMLElement) {
          element.style.setProperty('display', 'none', 'important')
          element.style.setProperty('visibility', 'hidden', 'important')
          element.style.setProperty('pointer-events', 'none', 'important')
        }
      }
    })
    .catch(() => {})
}

export function attachPageWatchers(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()
    if (status >= 400 && !url.includes('/favicon.ico')) {
      failedRequests.push(`${status} ${url}`)
    }
  })

  return {
    consoleErrors,
    failedRequests
  }
}

export function expectNoBlockingBrowserIssues(consoleErrors: string[], failedRequests: string[]) {
  const blockingResponses = failedRequests.filter((entry) => {
    if (entry.includes('/api/notifications/unread/count') && entry.startsWith('401 ')) {
      return false
    }
    if (entry.includes('/api/notifications/unread-count') && (entry.startsWith('401 ') || entry.startsWith('403 '))) {
      return false
    }
    if (entry.includes('/api/cart') && (entry.startsWith('401 ') || entry.startsWith('403 '))) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/auth/me')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/cart')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/categories')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/coupons')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/products?pageNo=0&pageSize=10&page=0&size=10&sort=newest')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/products?pageNo=0&pageSize=8&page=0&size=8&sort=sales')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/notifications/unread-count')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/api/music/enabled')) {
      return false
    }
    if (entry.includes('picsum.photos')) {
      return false
    }
    if (entry.startsWith('429 ') && entry.includes('/uploads/')) {
      return false
    }
    return true
  })

  const blockingConsoleErrors = consoleErrors.filter((entry) => {
    if (entry.startsWith('Failed to load resource:')) {
      return false
    }
    if (entry.includes('获取未读通知数失败: Error: 没有权限执行该操作')) {
      return false
    }
    if (entry.includes('获取购物车列表失败: Error: 没有权限执行该操作')) {
      return false
    }
    if (entry.includes('获取当前用户信息失败 Error:')) {
      return false
    }
    if (entry.includes('初始化用户信息失败 Error:')) {
      return false
    }
    if (entry.includes('加载音乐失败 Error:')) {
      return false
    }
    if (entry.includes('获取未读通知数失败: Error:')) {
      return false
    }
    if (entry.includes('获取购物车列表失败: Error:')) {
      return false
    }
    if (entry.includes('获取首页分类失败 Error:')) {
      return false
    }
    if (entry.includes('获取首页优惠券失败 Error:')) {
      return false
    }
    if (entry.includes('获取首页热销商品失败 Error:')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/auth/me')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/cart')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/categories')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/coupons')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/products?pageNo=0&pageSize=10&page=0&size=10&sort=newest')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/products?pageNo=0&pageSize=8&page=0&size=8&sort=sales')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/notifications/unread-count')) {
      return false
    }
    if (entry.includes('Failed to load resource: the server responded with a status of 429') && entry.includes('/api/music/enabled')) {
      return false
    }
    return true
  })

  expect(blockingResponses, `Unexpected failing requests:\n${blockingResponses.join('\n')}`).toEqual([])
  expect(blockingConsoleErrors, `Unexpected console errors:\n${blockingConsoleErrors.join('\n')}`).toEqual([])
}

export async function getSession(page: Page, username: string, password: string) {
  let session = sessionCache.get(username)
  if (session) {
    const validationResponse = await page.request.get('/api/cart/count', {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    })
    if (!validationResponse.ok()) {
      sessionCache.delete(username)
      session = undefined
    }
  }
  if (!session) {
    let loginResponse
    for (let attempt = 0; attempt < 3; attempt++) {
      loginResponse = await page.request.post('/api/auth/login', {
        data: {
          username,
          password
        }
      })
      if (loginResponse.ok()) {
        break
      }
      if (loginResponse.status() !== 429 || attempt === 2) {
        break
      }
      await page.waitForTimeout(1_500)
    }
    expect(loginResponse?.ok(), `登录失败: ${loginResponse?.status()} ${loginResponse?.url()}`).toBeTruthy()

    const payload = await loginResponse!.json()
    expect(payload?.code).toBe(200)

    session = {
      token: payload.data.token,
      user: payload.data.user
    }
    sessionCache.set(username, session)
  }
  return session
}

export async function login(page: Page, username: string, password: string) {
  const session = await getSession(page, username, password)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(user))
  }, session)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const appRoot = document.querySelector('#app')
    return !!appRoot && appRoot.childElementCount > 0
  })
  await neutralizeFloatingUi(page)
  return session
}

export async function logout(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
}

async function expectPageReady(page: Page, options: PageReadyOptions = {}) {
  if (options.testId) {
    await expect(page.getByTestId(options.testId)).toBeVisible({ timeout: 15_000 })
  }

  if (options.heading) {
    await expect(page.getByRole('heading', { name: options.heading })).toBeVisible({ timeout: 15_000 })
  }
}

export async function openPageAs(
  page: Page,
  username: string,
  password: string,
  path: string,
  ready: PageReadyOptions = {}
) {
  await login(page, username, password)
  await page.goto(path)
  await neutralizeFloatingUi(page)
  await expectPageReady(page, ready)
}

export async function openAdminPage(page: Page, path: string, ready: PageReadyOptions = {}) {
  await openPageAs(page, E2E_USERS.admin, E2E_PASSWORD, path, ready)
}

export function getMessageBox(page: Page): Locator {
  return page
    .locator('.el-overlay-message-box, .el-message-box__wrapper')
    .filter({ has: page.locator('.el-message-box') })
    .last()
}

export async function expectMessageBoxCentered(page: Page, label: string = '确认框') {
  const viewport = page.viewportSize()
  expect(viewport, `${label}: 无法获取浏览器视口`).toBeTruthy()

  const overlay = getMessageBox(page)
  await expect(overlay, `${label}: 遮罩层未显示`).toBeVisible({ timeout: 10_000 })

  const messageBox = page.locator('.el-message-box').last()
  await expect(messageBox, `${label}: 弹窗主体未显示`).toBeVisible({ timeout: 10_000 })

  const box = await messageBox.boundingBox()
  expect(box, `${label}: 无法读取弹窗位置`).toBeTruthy()

  const view = viewport!
  const centerX = box!.x + box!.width / 2
  const centerY = box!.y + box!.height / 2

  expect(box!.width, `${label}: 弹窗宽度异常`).toBeGreaterThan(Math.min(260, view.width * 0.65))
  expect(box!.height, `${label}: 弹窗高度异常`).toBeGreaterThan(110)
  expect(box!.x, `${label}: 弹窗贴到左侧`).toBeGreaterThanOrEqual(12)
  expect(box!.y, `${label}: 弹窗贴到顶部`).toBeGreaterThanOrEqual(12)
  expect(centerX, `${label}: 弹窗未水平居中`).toBeGreaterThan(view.width * 0.25)
  expect(centerX, `${label}: 弹窗未水平居中`).toBeLessThan(view.width * 0.75)
  expect(centerY, `${label}: 弹窗未垂直居中`).toBeGreaterThan(view.height * 0.2)
  expect(centerY, `${label}: 弹窗未垂直居中`).toBeLessThan(view.height * 0.8)

  const overlayBox = await page.locator('.el-overlay').last().boundingBox()
  expect(overlayBox, `${label}: 无法读取遮罩层位置`).toBeTruthy()
  expect(overlayBox!.width, `${label}: 遮罩层宽度异常`).toBeGreaterThan(view.width * 0.9)
  expect(overlayBox!.height, `${label}: 遮罩层高度异常`).toBeGreaterThan(view.height * 0.9)
}

export async function confirmMessageBox(page: Page, buttonName: string = '确定') {
  const dialog = getMessageBox(page)
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  await dialog.getByRole('button', { name: buttonName }).press('Enter')
  return dialog
}

export async function authedGet(request: APIRequestContext, token: string, url: string) {
  return request.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export async function authedPost(request: APIRequestContext, token: string, url: string, data?: unknown) {
  return request.post(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data
  })
}

export async function authedPut(request: APIRequestContext, token: string, url: string, data?: unknown) {
  return request.put(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data
  })
}

export async function authedDelete(request: APIRequestContext, token: string, url: string) {
  return request.delete(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

async function fetchPublicProducts(page: Page): Promise<ProductRecord[]> {
  let response
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await page.request.get('/api/products?page=0&size=100')
    if (response.ok()) {
      break
    }
    if (response.status() !== 429 || attempt === 2) {
      break
    }
    await page.waitForTimeout(1_500)
  }
  expect(response.ok(), `获取商品列表失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)

  const data = payload?.data
  const rawProducts = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : []

  return rawProducts
    .map((item: any) => ({
      id: Number(item.id || 0),
      name: item.name,
      price: Number(item.price ?? 0),
      status: Number(item.status ?? 0),
      stock: Number(item.stock ?? 0),
      sellerId: item.sellerId != null ? Number(item.sellerId) : null,
      sellerName: item.sellerName ?? null
    }))
    .filter((item) => item.id > 0)
}

export async function resolveProduct(page: Page, cacheKey: string, options: ProductSelectionOptions = {}) {
  if (options.explicitId && options.explicitId > 0) {
    const products = await fetchPublicProducts(page)
    const explicitProduct = products.find((product) => product.id === options.explicitId)
    expect(explicitProduct, `未找到指定商品 ID: ${options.explicitId}`).toBeTruthy()
    productSelectionCache.set(cacheKey, options.explicitId)
    return explicitProduct!
  }

  const cachedId = productSelectionCache.get(cacheKey)
  if (cachedId) {
    const products = await fetchPublicProducts(page)
    const cachedProduct = products.find((product) => product.id === cachedId)
    expect(cachedProduct, `缓存商品 ID 已失效: ${cachedId}`).toBeTruthy()
    return cachedProduct!
  }

  const products = await fetchPublicProducts(page)
  const selected = products.find((product) => {
    if (product.status !== 1 || product.stock <= 0) {
      return false
    }
    if (options.sellerUsername && product.sellerName !== options.sellerUsername) {
      return false
    }
    if (options.excludeSellerUsername && product.sellerName === options.excludeSellerUsername) {
      return false
    }
    return true
  })

  expect(
    selected,
    `未找到符合条件的商品: seller=${options.sellerUsername || '任意'}, excludeSeller=${options.excludeSellerUsername || '无'}`
  ).toBeTruthy()

  const selectedId = Number(selected!.id)
  productSelectionCache.set(cacheKey, selectedId)
  return selected!
}

export async function resolveProductId(page: Page, cacheKey: string, options: ProductSelectionOptions = {}) {
  const product = await resolveProduct(page, cacheKey, options)
  return Number(product.id)
}
