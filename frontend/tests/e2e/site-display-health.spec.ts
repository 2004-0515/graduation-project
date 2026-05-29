import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

type RouteProbe = {
  name: string
  path: string
  ready: string
  allowEmptyMain?: boolean
}

type DynamicTargets = {
  productId: number
  couponId: number
  orderId: number
  paymentOrderId: number
}

async function waitForApiOk(page: Page, path: string) {
  return waitForAuthedApiOk(page, path)
}

async function waitForAuthedApiOk(page: Page, path: string, token?: string) {
  const response = await page.request.get(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })
  expect(response.ok(), `接口不可用: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code, `接口返回异常: ${path}`).toBe(200)
  return payload
}

async function resolveDynamicTargets(page: Page): Promise<DynamicTargets> {
  const productsPayload = await waitForApiOk(page, '/api/products?page=0&size=100')
  const productList = Array.isArray(productsPayload?.data)
    ? productsPayload.data
    : Array.isArray(productsPayload?.data?.content)
      ? productsPayload.data.content
      : []
  const product = productList.find((item: any) =>
    Number(item?.id || 0) > 0 &&
    Number(item?.status || 0) === 1 &&
    Number(item?.stock || 0) > 0 &&
    String(item?.sellerName || '') !== E2E_USERS.buyer
  )
  expect(product, '没有可用于页面审计的上架商品').toBeTruthy()

  const couponsPayload = await waitForApiOk(page, '/api/coupons')
  const couponList = Array.isArray(couponsPayload?.data) ? couponsPayload.data : []
  const coupon = couponList.find((item: any) => Number(item?.id || 0) > 0)
  expect(coupon, '没有可用于页面审计的优惠券').toBeTruthy()

  const buyerSession = await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const ordersPayload = await waitForAuthedApiOk(page, '/api/orders?page=0&size=50', buyerSession.token)
  const orderList = Array.isArray(ordersPayload?.data)
    ? ordersPayload.data
    : Array.isArray(ordersPayload?.data?.content)
      ? ordersPayload.data.content
      : []
  const order = orderList.find((item: any) => Number(item?.id || 0) > 0)
  const paymentOrder = orderList.find((item: any) =>
    Number(item?.id || 0) > 0 &&
    Number(item?.orderStatus ?? -1) === 0
  )
  expect(order, '没有可用于页面审计的买家订单').toBeTruthy()
  expect(paymentOrder, '没有可用于支付页审计的待支付订单').toBeTruthy()

  return {
    productId: Number(product.id),
    couponId: Number(coupon.id),
    orderId: Number(order.id),
    paymentOrderId: Number(paymentOrder.id)
  }
}

async function visibleRoot(page: Page, ready: string): Promise<Locator> {
  if (ready.startsWith('css=')) {
    return page.locator(ready.slice(4))
  }
  return page.getByTestId(ready)
}

async function assertPageHealthy(page: Page, route: RouteProbe) {
  await page.goto(route.path)
  await neutralizeFloatingUi(page)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(450)

  const root = await visibleRoot(page, route.ready)
  await expect(root, `${route.name}: 主页面容器不可见`).toBeVisible({ timeout: 15_000 })

  const checkpoints = ['top', 'middle', 'bottom'] as const
  for (const checkpoint of checkpoints) {
    await page.evaluate((position) => {
      const top =
        position === 'top'
          ? 0
          : position === 'middle'
            ? Math.max(0, document.documentElement.scrollHeight / 2 - window.innerHeight / 2)
            : document.documentElement.scrollHeight
      window.scrollTo(0, top)
    }, checkpoint)
    await page.waitForTimeout(120)

    const result = await page.evaluate(() => {
      const app = document.querySelector('#app')
      const bodyText = document.body.innerText || ''
      const viewportWidth = document.documentElement.clientWidth
      const scrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth
      )
      const main = document.querySelector('main') || document.querySelector('[data-testid$="-view"]') || document.body
      const mainBox = main.getBoundingClientRect()
      const visibleImages = Array.from(document.images).filter((img) => {
        const box = img.getBoundingClientRect()
        const style = window.getComputedStyle(img)
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          box.width > 2 &&
          box.height > 2 &&
          box.bottom >= 0 &&
          box.right >= 0 &&
          box.top <= window.innerHeight &&
          box.left <= window.innerWidth
        )
      })
      const brokenImages = visibleImages
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute('src') || img.currentSrc || img.alt || 'unknown')
      const visibleMessageBoxes = Array.from(document.querySelectorAll<HTMLElement>('.el-message-box'))
        .filter((item) => {
          const box = item.getBoundingClientRect()
          const style = window.getComputedStyle(item)
          return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
        })
        .length
      const visibleErrorToasts = Array.from(document.querySelectorAll<HTMLElement>('.el-message--error'))
        .filter((item) => {
          const box = item.getBoundingClientRect()
          const style = window.getComputedStyle(item)
          return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
        })
        .map((item) => item.innerText.trim())
      const badTextMatches = bodyText.match(/NaN|undefined|null|\\[object Object\\]|Internal Server Error|Whitelabel Error Page|Cannot read properties|TypeError|ReferenceError/g) || []

      return {
        appChildren: app?.childElementCount || 0,
        bodyLength: bodyText.trim().length,
        scrollWidth,
        viewportWidth,
        mainWidth: mainBox.width,
        mainHeight: mainBox.height,
        brokenImages,
        visibleMessageBoxes,
        visibleErrorToasts,
        badTextMatches: Array.from(new Set(badTextMatches))
      }
    })

    expect(result.appChildren, `${route.name} ${checkpoint}: Vue 应用未挂载`).toBeGreaterThan(0)
    expect(result.bodyLength, `${route.name} ${checkpoint}: 页面文本为空`).toBeGreaterThan(route.allowEmptyMain ? 10 : 40)
    expect(result.mainWidth, `${route.name} ${checkpoint}: 主体区域宽度异常`).toBeGreaterThan(240)
    expect(result.mainHeight, `${route.name} ${checkpoint}: 主体区域高度异常`).toBeGreaterThan(route.allowEmptyMain ? 80 : 160)
    expect(
      result.scrollWidth,
      `${route.name} ${checkpoint}: 页面发生横向溢出 ${result.scrollWidth} > ${result.viewportWidth}`
    ).toBeLessThanOrEqual(result.viewportWidth + 8)
    expect(result.brokenImages, `${route.name} ${checkpoint}: 可视区域存在破图`).toEqual([])
    expect(result.visibleMessageBoxes, `${route.name} ${checkpoint}: 遗留确认框未关闭`).toBe(0)
    expect(result.visibleErrorToasts, `${route.name} ${checkpoint}: 出现错误提示`).toEqual([])
    expect(result.badTextMatches, `${route.name} ${checkpoint}: 页面出现异常文本`).toEqual([])
  }

  await page.evaluate(() => window.scrollTo(0, 0))
}

function buildRoutes(targets: DynamicTargets) {
  const publicRoutes: RouteProbe[] = [
    { name: '首页', path: '/', ready: 'home-view' },
    { name: '登录页', path: '/login', ready: 'login-form' },
    { name: '注册页', path: '/register', ready: 'register-form' },
    { name: '分类页', path: '/category', ready: 'category-view' },
    { name: '搜索结果页', path: '/category?keyword=机械键盘', ready: 'category-view' },
    { name: '热销页', path: '/hot', ready: 'hot-products-view' },
    { name: '促销列表', path: '/promotions', ready: 'promotions-view' },
    { name: '促销详情', path: `/promotion/${targets.couponId}`, ready: 'promotion-detail-view' },
    { name: '优惠券详情', path: `/coupon/${targets.couponId}`, ready: 'coupon-detail-view' },
    { name: '商品详情', path: `/product/${targets.productId}`, ready: 'product-detail-view' },
    { name: 'AI助手', path: '/ai-recommend', ready: 'css=.ai-recommend-page' },
    { name: '帮助中心', path: '/help', ready: 'css=.help-page' },
    { name: '联系我们', path: '/contact', ready: 'contact-view' },
    { name: '服务条款', path: '/terms', ready: 'css=.terms-page' }
  ]

  const buyerRoutes: RouteProbe[] = [
    { name: '个人中心', path: '/profile', ready: 'profile-view' },
    { name: '订单列表', path: '/orders', ready: 'orders-view' },
    { name: '订单详情', path: `/order/${targets.orderId}`, ready: 'order-detail-view' },
    { name: '支付页', path: `/payment/${targets.paymentOrderId}`, ready: 'payment-view' },
    { name: '结算页', path: `/checkout?productId=${targets.productId}&quantity=1`, ready: 'checkout-view' },
    { name: '地址管理', path: '/address', ready: 'address-view' },
    { name: '设置页', path: '/settings', ready: 'settings-view' },
    { name: '通知页', path: '/notifications', ready: 'notifications-view' },
    { name: '购物车', path: '/cart', ready: 'cart-view' },
    { name: '降价提醒', path: '/price-alerts', ready: 'price-alerts-view' },
    { name: '理性消费助手', path: '/rational-consumption', ready: 'rational-consumption-view' }
  ]

  const sellerRoutes: RouteProbe[] = [
    { name: '商家商品管理', path: '/my-products', ready: 'my-products-view' },
    { name: '商家发货', path: '/seller-orders', ready: 'seller-orders-view' }
  ]

  const adminRoutes: RouteProbe[] = [
    { name: '管理员数据看板', path: '/admin', ready: 'css=.dashboard' },
    { name: '管理员商品管理', path: '/admin/products', ready: 'admin-products-view' },
    { name: '管理员分类管理', path: '/admin/categories', ready: 'admin-categories-view' },
    { name: '管理员订单管理', path: '/admin/orders', ready: 'admin-orders-view' },
    { name: '管理员用户管理', path: '/admin/users', ready: 'admin-users-view' },
    { name: '管理员文件审核', path: '/admin/files', ready: 'admin-files-view' },
    { name: '管理员展示管理', path: '/admin/showcase', ready: 'css=.showcase-manage' },
    { name: '管理员通知管理', path: '/admin/notifications', ready: 'admin-notifications-view' },
    { name: '管理员留言管理', path: '/admin/contact-messages', ready: 'admin-contact-messages-view' },
    { name: '管理员优惠券管理', path: '/admin/coupons', ready: 'admin-coupons-view' },
    { name: '管理员音乐管理', path: '/admin/music', ready: 'admin-music-view' },
    { name: '管理员价格管理', path: '/admin/price', ready: 'admin-price-view' },
    { name: '管理员理性消费管理', path: '/admin/rational', ready: 'admin-rational-view' }
  ]

  return { publicRoutes, buyerRoutes, sellerRoutes, adminRoutes }
}

test('全站页面显示健康审计：公开、用户、商家、管理员页面都不应空白、破图、溢出或报错', async ({ page }) => {
  test.setTimeout(240_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const targets = await resolveDynamicTargets(page)
  const routes = buildRoutes(targets)

  for (const route of routes.publicRoutes) {
    await assertPageHealthy(page, route)
  }

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  for (const route of routes.buyerRoutes) {
    await assertPageHealthy(page, route)
  }

  await login(page, E2E_USERS.seller, E2E_PASSWORD)
  for (const route of routes.sellerRoutes) {
    await assertPageHealthy(page, route)
  }

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  for (const route of routes.adminRoutes) {
    await assertPageHealthy(page, route)
  }

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})

test('移动端核心页面显示健康审计：窄屏不应出现全局横向溢出或空白主区域', async ({ page }) => {
  test.setTimeout(160_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const targets = await resolveDynamicTargets(page)
  const routes = buildRoutes(targets)

  for (const route of [
    routes.publicRoutes.find((item) => item.name === '首页')!,
    routes.publicRoutes.find((item) => item.name === '商品详情')!,
    routes.publicRoutes.find((item) => item.name === '分类页')!,
    routes.buyerRoutes.find((item) => item.name === '购物车')!,
    routes.buyerRoutes.find((item) => item.name === '订单列表')!,
    routes.buyerRoutes.find((item) => item.name === '理性消费助手')!,
    routes.adminRoutes.find((item) => item.name === '管理员商品管理')!
  ]) {
    if (route.path.startsWith('/admin')) {
      await login(page, E2E_USERS.admin, E2E_PASSWORD)
    } else if (routes.buyerRoutes.includes(route)) {
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    }
    await assertPageHealthy(page, route)
  }

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
