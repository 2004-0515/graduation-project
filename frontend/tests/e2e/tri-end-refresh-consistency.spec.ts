import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectMessageBoxCentered,
  expectNoBlockingBrowserIssues,
  getMessageBox,
  neutralizeFloatingUi
} from './helpers/session'

type Session = {
  token: string
  user: Record<string, unknown>
}

type ProductRecord = {
  id: number
  name: string
  price: number
  stock: number
  status: number
  mainImage?: string | null
}

type TriPages = {
  buyerContext: BrowserContext
  sellerContext: BrowserContext
  adminContext: BrowserContext
  buyerPage: Page
  sellerPage: Page
  adminPage: Page
  sharedContext: boolean
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')

const buyerBaseUrl = normalizeBaseUrl(
  process.env.TRI_AUDIT_BUYER_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5173'
)
const adminBaseUrl = normalizeBaseUrl(
  process.env.TRI_AUDIT_ADMIN_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5174'
)
const sellerBaseUrl = normalizeBaseUrl(
  process.env.TRI_AUDIT_SELLER_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5175'
)

async function newTriPages(browser: Browser): Promise<TriPages> {
  const uniqueOrigins = new Set([buyerBaseUrl, sellerBaseUrl, adminBaseUrl])
  if (uniqueOrigins.size === 3) {
    const context = await browser.newContext()
    return {
      buyerContext: context,
      sellerContext: context,
      adminContext: context,
      buyerPage: await context.newPage(),
      sellerPage: await context.newPage(),
      adminPage: await context.newPage(),
      sharedContext: true
    }
  }

  const buyerContext = await browser.newContext()
  const sellerContext = await browser.newContext()
  const adminContext = await browser.newContext()
  return {
    buyerContext,
    sellerContext,
    adminContext,
    buyerPage: await buyerContext.newPage(),
    sellerPage: await sellerContext.newPage(),
    adminPage: await adminContext.newPage(),
    sharedContext: false
  }
}

async function loginAt(page: Page, baseUrl: string, username: string, password: string): Promise<Session> {
  const response = await page.request.post(`${baseUrl}/api/auth/login`, {
    data: { username, password }
  })
  expect(response.ok(), `登录失败: ${username} ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const session = {
    token: payload.data.token,
    user: payload.data.user
  }

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
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

async function authedGet(page: Page, baseUrl: string, token: string, apiPath: string) {
  return page.request.get(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function authedPost(page: Page, baseUrl: string, token: string, apiPath: string, data?: unknown) {
  return page.request.post(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data
  })
}

async function authedPut(page: Page, baseUrl: string, token: string, apiPath: string, data?: unknown) {
  return page.request.put(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data
  })
}

async function authedDelete(page: Page, baseUrl: string, token: string, apiPath: string) {
  return page.request.delete(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function resolveCategoryId(page: Page, baseUrl: string): Promise<number> {
  const response = await page.request.get(`${baseUrl}/api/categories`)
  expect(response.ok(), `获取分类失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const categories = Array.isArray(payload?.data) ? payload.data : []
  expect(categories.length, '真实环境中至少需要一个分类供三端审计创建临时商品').toBeGreaterThan(0)
  return Number(categories[0].id)
}

async function resolveCatalogImage(page: Page, baseUrl: string): Promise<string> {
  const response = await page.request.get(`${baseUrl}/api/products?pageNo=0&pageSize=20&sort=newest`)
  expect(response.ok(), `获取商品图片失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  const products = Array.isArray(payload?.data?.content) ? payload.data.content : []
  const productWithImage = products.find((item: any) => String(item.mainImage || '').trim())
  return productWithImage?.mainImage || '/uploads/products/nordic-living-floor-lamp-01.jpg'
}

async function createApprovedSellerProduct(
  sellerPage: Page,
  adminPage: Page,
  sellerSession: Session,
  adminSession: Session,
  marker: string
): Promise<ProductRecord> {
  const categoryId = await resolveCategoryId(sellerPage, sellerBaseUrl)
  const mainImage = await resolveCatalogImage(sellerPage, sellerBaseUrl)
  const submitResponse = await authedPost(sellerPage, sellerBaseUrl, sellerSession.token, '/api/products/submit', {
    name: `${marker} 三端联动台灯`,
    description: '三端联动审计临时商品，验证买家、卖家、管理员刷新一致性。',
    price: '89.00',
    originalPrice: '119.00',
    stock: 8,
    categoryId,
    mainImage,
    images: [mainImage]
  })
  expect(submitResponse.ok(), `提交临时商品失败: ${submitResponse.status()} ${submitResponse.url()}`).toBeTruthy()

  const submitPayload = await submitResponse.json()
  expect(submitPayload?.code).toBe(200)
  const productId = Number(submitPayload?.data?.id || 0)
  expect(productId).toBeGreaterThan(0)

  const auditResponse = await authedPost(adminPage, adminBaseUrl, adminSession.token, `/api/products/${productId}/audit`, {
    auditStatus: 1,
    remark: 'tri-end audit approve'
  })
  expect(auditResponse.ok(), `审核临时商品失败: ${auditResponse.status()} ${auditResponse.url()}`).toBeTruthy()
  const auditPayload = await auditResponse.json()
  expect(auditPayload?.code).toBe(200)

  return {
    id: productId,
    name: String(auditPayload.data?.name || `${marker} 三端联动台灯`),
    price: Number(auditPayload.data?.price || 89),
    stock: Number(auditPayload.data?.stock || 8),
    status: Number(auditPayload.data?.status || 1),
    mainImage
  }
}

async function createPaidOrder(page: Page, baseUrl: string, product: ProductRecord, marker: string) {
  await page.goto(`${baseUrl}/product/${product.id}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('product-detail-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)

  await page.getByTestId('product-buy-now').click()
  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible({ timeout: 15_000 })
  await page.locator('textarea').fill(marker)

  const orderResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders') &&
    response.request().method() === 'POST'
  )
  await page.getByTestId('checkout-submit').click()
  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await continueSubmitButton.click()
  }
  const orderResponse = await orderResponsePromise
  expect(orderResponse.ok(), `创建订单失败: ${orderResponse.status()} ${orderResponse.url()}`).toBeTruthy()
  const orderPayload = await orderResponse.json()
  const orderId = Number(orderPayload?.data?.id || 0)
  expect(orderId).toBeGreaterThan(0)

  await page.waitForURL(/\/payment\/\d+/)
  await expect(page.getByTestId('payment-view')).toBeVisible({ timeout: 15_000 })
  const orderNoText = (await page.locator('.order-no').textContent()) || ''
  const orderNo = orderNoText.replace('订单号：', '').trim()
  expect(orderNo).toBeTruthy()

  const payResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders/') &&
    response.url().includes('/pay') &&
    response.request().method() === 'PUT'
  )
  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible({ timeout: 10_000 })
  await page.getByTestId('payment-simulate').click()
  const payResponse = await payResponsePromise
  expect(payResponse.ok(), `支付订单失败: ${payResponse.status()} ${payResponse.url()}`).toBeTruthy()
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })

  return { orderId, orderNo }
}

async function expectUserOrderStatus(page: Page, baseUrl: string, orderNo: string, statusText: string) {
  await page.goto(`${baseUrl}/orders`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('orders-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('orders-view')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('orders-search-input').fill(orderNo)

  const orderCard = page.locator('.order-card', { hasText: orderNo }).first()
  await expect(orderCard).toBeVisible({ timeout: 15_000 })
  await expect(orderCard).toContainText(statusText, { timeout: 15_000 })
  return orderCard
}

async function expectSellerOrderStatus(page: Page, baseUrl: string, orderNo: string, statusText: string) {
  await page.goto(`${baseUrl}/seller-orders`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('seller-orders-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('seller-orders-view')).toBeVisible({ timeout: 15_000 })

  const orderCard = page.locator('.order-card', { hasText: orderNo }).first()
  await expect(orderCard).toBeVisible({ timeout: 15_000 })
  await expect(orderCard).toContainText(statusText, { timeout: 15_000 })
  return orderCard
}

async function expectAdminOrderStatus(page: Page, baseUrl: string, orderNo: string, statusText: string) {
  await page.goto(`${baseUrl}/admin/orders`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('admin-orders-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('admin-orders-view')).toBeVisible({ timeout: 15_000 })
  await page.getByPlaceholder('搜索订单号').fill(orderNo)
  await page.getByRole('button', { name: '搜索' }).click()

  const orderRow = page.locator('.el-table__row', { hasText: orderNo }).first()
  await expect(orderRow).toBeVisible({ timeout: 15_000 })
  await expect(orderRow).toContainText(statusText, { timeout: 15_000 })
  return orderRow
}

async function cancelMessageBox(page: Page, label: string) {
  await expectMessageBoxCentered(page, label)
  await getMessageBox(page).getByRole('button', { name: '取消' }).click()
  await expect(page.locator('.el-message-box')).toHaveCount(0)
}

async function confirmMessageBox(page: Page, label: string, buttonName: string) {
  await expectMessageBoxCentered(page, label)
  await getMessageBox(page).getByRole('button', { name: buttonName }).click()
}

async function assertOriginSessionsStayIsolated(pages: TriPages) {
  if (!pages.sharedContext) {
    return
  }

  const readUsername = (page: Page) =>
    page.evaluate(() => JSON.parse(localStorage.getItem('userInfo') || '{}').username)

  expect(await readUsername(pages.buyerPage)).toBe(E2E_USERS.buyer)
  expect(await readUsername(pages.sellerPage)).toBe(E2E_USERS.seller)
  expect(await readUsername(pages.adminPage)).toBe(E2E_USERS.admin)

  await pages.buyerPage.reload({ waitUntil: 'domcontentloaded' })
  await pages.sellerPage.reload({ waitUntil: 'domcontentloaded' })
  await pages.adminPage.reload({ waitUntil: 'domcontentloaded' })

  expect(await readUsername(pages.buyerPage)).toBe(E2E_USERS.buyer)
  expect(await readUsername(pages.sellerPage)).toBe(E2E_USERS.seller)
  expect(await readUsername(pages.adminPage)).toBe(E2E_USERS.admin)
}

test('三端演示一致性：买家下单、卖家发货、管理员刷新后看到同一真实状态', async ({ browser }) => {
  test.setTimeout(300_000)

  const pages = await newTriPages(browser)
  const buyerWatchers = attachPageWatchers(pages.buyerPage)
  const sellerWatchers = attachPageWatchers(pages.sellerPage)
  const adminWatchers = attachPageWatchers(pages.adminPage)
  const marker = `TRI-AUDIT-${Date.now()}`

  let buyerSession: Session | null = null
  let sellerSession: Session | null = null
  let adminSession: Session | null = null
  let productId: number | null = null
  let orderId: number | null = null
  let orderDeleted = false
  let productDeleted = false

  try {
    buyerSession = await loginAt(pages.buyerPage, buyerBaseUrl, E2E_USERS.buyer, E2E_PASSWORD)
    sellerSession = await loginAt(pages.sellerPage, sellerBaseUrl, E2E_USERS.seller, E2E_PASSWORD)
    adminSession = await loginAt(pages.adminPage, adminBaseUrl, E2E_USERS.admin, E2E_PASSWORD)
    await assertOriginSessionsStayIsolated(pages)

    const product = await createApprovedSellerProduct(
      pages.sellerPage,
      pages.adminPage,
      sellerSession,
      adminSession,
      marker
    )
    productId = product.id

    const order = await createPaidOrder(pages.buyerPage, buyerBaseUrl, product, marker)
    orderId = order.orderId

    await expectUserOrderStatus(pages.buyerPage, buyerBaseUrl, order.orderNo, '待发货')
    const sellerPendingCard = await expectSellerOrderStatus(pages.sellerPage, sellerBaseUrl, order.orderNo, '待发货')
    await expectAdminOrderStatus(pages.adminPage, adminBaseUrl, order.orderNo, '待发货')

    let shipMutations = 0
    pages.sellerPage.on('request', (request) => {
      if (request.method() === 'PUT' && request.url().includes('/api/orders/seller/items/')) {
        shipMutations += 1
      }
    })

    await sellerPendingCard.getByRole('button', { name: '发货' }).click()
    await cancelMessageBox(pages.sellerPage, '三端审计：卖家发货取消')
    expect(shipMutations).toBe(0)
    await expectSellerOrderStatus(pages.sellerPage, sellerBaseUrl, order.orderNo, '待发货')
    await expectUserOrderStatus(pages.buyerPage, buyerBaseUrl, order.orderNo, '待发货')

    const shipResponsePromise = pages.sellerPage.waitForResponse((response) =>
      response.url().includes('/api/orders/seller/items/') &&
      response.request().method() === 'PUT'
    )
    const sellerCardForConfirm = await expectSellerOrderStatus(pages.sellerPage, sellerBaseUrl, order.orderNo, '待发货')
    await sellerCardForConfirm.getByRole('button', { name: '发货' }).click()
    await confirmMessageBox(pages.sellerPage, '三端审计：卖家发货确认', '确定发货')
    const shipResponse = await shipResponsePromise
    expect(shipResponse.ok(), `卖家发货失败: ${shipResponse.status()} ${shipResponse.url()}`).toBeTruthy()

    await expectSellerOrderStatus(pages.sellerPage, sellerBaseUrl, order.orderNo, '已发货')
    const userPendingReceiptCard = await expectUserOrderStatus(pages.buyerPage, buyerBaseUrl, order.orderNo, '待收货')
    await expectAdminOrderStatus(pages.adminPage, adminBaseUrl, order.orderNo, '待收货')

    const confirmReceiptResponsePromise = pages.buyerPage.waitForResponse((response) =>
      response.url().includes('/api/orders/') &&
      response.url().includes('/confirm') &&
      response.request().method() === 'PUT'
    )
    await userPendingReceiptCard.getByRole('button', { name: '确认收货' }).click()
    const confirmReceiptResponse = await confirmReceiptResponsePromise
    expect(confirmReceiptResponse.ok(), `确认收货失败: ${confirmReceiptResponse.status()} ${confirmReceiptResponse.url()}`).toBeTruthy()

    await expectUserOrderStatus(pages.buyerPage, buyerBaseUrl, order.orderNo, '已完成')
    const adminCompletedRow = await expectAdminOrderStatus(pages.adminPage, adminBaseUrl, order.orderNo, '已完成')

    const deleteOrderResponsePromise = pages.adminPage.waitForResponse((response) =>
      response.url().includes('/api/orders/') &&
      response.url().includes('/admin') &&
      response.request().method() === 'DELETE'
    )
    await adminCompletedRow.getByRole('button', { name: '删除' }).click()
    await confirmMessageBox(pages.adminPage, '三端审计：管理员删除临时订单', '确定删除')
    const deleteOrderResponse = await deleteOrderResponsePromise
    expect(deleteOrderResponse.ok(), `管理员删除临时订单失败: ${deleteOrderResponse.status()} ${deleteOrderResponse.url()}`).toBeTruthy()
    orderDeleted = true

    const deleteProductResponse = await authedDelete(
      pages.adminPage,
      adminBaseUrl,
      adminSession.token,
      `/api/products/${product.id}`
    )
    expect(deleteProductResponse.ok(), `管理员删除临时商品失败: ${deleteProductResponse.status()} ${deleteProductResponse.url()}`).toBeTruthy()
    productDeleted = true

    expectNoBlockingBrowserIssues(buyerWatchers.consoleErrors, buyerWatchers.failedRequests)
    expectNoBlockingBrowserIssues(sellerWatchers.consoleErrors, sellerWatchers.failedRequests)
    expectNoBlockingBrowserIssues(adminWatchers.consoleErrors, adminWatchers.failedRequests)
  } finally {
    if (!orderDeleted && orderId && adminSession) {
      await authedPut(pages.adminPage, adminBaseUrl, adminSession.token, `/api/orders/${orderId}/status`, { status: 4 }).catch(() => {})
      await authedDelete(pages.adminPage, adminBaseUrl, adminSession.token, `/api/orders/${orderId}/admin`).catch(() => {})
    }
    if (!productDeleted && productId && adminSession) {
      await authedDelete(pages.adminPage, adminBaseUrl, adminSession.token, `/api/products/${productId}`).catch(() => {})
    }
    if (buyerSession) {
      await authedDelete(pages.buyerPage, buyerBaseUrl, buyerSession.token, '/api/cart/clear').catch(() => {})
    }
    await pages.buyerContext.close()
    if (pages.sellerContext !== pages.buyerContext) {
      await pages.sellerContext.close()
    }
    if (pages.adminContext !== pages.buyerContext && pages.adminContext !== pages.sellerContext) {
      await pages.adminContext.close()
    }
  }
})
