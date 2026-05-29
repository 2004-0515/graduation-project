import { expect, test, type Browser, type Page } from '@playwright/test'
import path from 'node:path'
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
  sellerName?: string | null
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')

const userBaseUrl = normalizeBaseUrl(
  process.env.DUAL_AUDIT_USER_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5173'
)
const adminBaseUrl = normalizeBaseUrl(
  process.env.DUAL_AUDIT_ADMIN_BASE_URL ||
  (process.env.PLAYWRIGHT_BASE_URL ? process.env.PLAYWRIGHT_BASE_URL : 'http://127.0.0.1:5174')
)

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

async function authedDelete(page: Page, baseUrl: string, token: string, apiPath: string) {
  return page.request.delete(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function resolveProduct(page: Page, baseUrl: string): Promise<ProductRecord> {
  const response = await page.request.get(`${baseUrl}/api/products?page=0&size=100`)
  expect(response.ok(), `获取商品列表失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)

  const rawProducts = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.content)
      ? payload.data.content
      : []

  const product = rawProducts
    .map((item: any) => ({
      id: Number(item.id || 0),
      name: String(item.name || ''),
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
      status: Number(item.status || 0),
      sellerName: item.sellerName || null
    }))
    .find((item: ProductRecord) =>
      item.id > 0 &&
      item.status === 1 &&
      item.stock > 1 &&
      item.price > 0 &&
      item.sellerName !== E2E_USERS.buyer
    )

  expect(product, '没有找到可用于双端审计的上架商品').toBeTruthy()
  return product!
}

async function clearCart(page: Page, baseUrl: string, token: string) {
  const response = await authedDelete(page, baseUrl, token, '/api/cart/clear')
  expect(response.ok(), `清空购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
}

async function cleanupPriceAlert(page: Page, baseUrl: string, token: string, productId: number) {
  await authedDelete(page, baseUrl, token, `/api/price/alert/${productId}/record`).catch(() => {})
  await authedDelete(page, baseUrl, token, `/api/price/alert/${productId}`).catch(() => {})
}

async function cancelMessageBox(page: Page, label: string) {
  await expectMessageBoxCentered(page, label)
  await getMessageBox(page).getByRole('button', { name: '取消' }).click()
  await expect(page.locator('.el-message-box')).toHaveCount(0)
}

async function confirmMessageBox(page: Page, label: string, buttonName: string = '确定') {
  await expectMessageBoxCentered(page, label)
  await getMessageBox(page).getByRole('button', { name: buttonName }).click()
}

async function addAndDeleteCartItem(page: Page, baseUrl: string, token: string, product: ProductRecord) {
  await clearCart(page, baseUrl, token)

  await page.goto(`${baseUrl}/product/${product.id}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)

  const addResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/cart') &&
    response.request().method() === 'POST'
  )
  await page.getByTestId('product-add-to-cart').click()
  const addResponse = await addResponsePromise
  expect(addResponse.ok(), `加入购物车失败: ${addResponse.status()} ${addResponse.url()}`).toBeTruthy()

  await page.goto(`${baseUrl}/cart`)
  await expect(page.getByTestId('cart-view')).toBeVisible({ timeout: 15_000 })
  const cartItem = page.locator('[data-testid^="cart-item-"]').first()
  await expect(cartItem).toBeVisible({ timeout: 15_000 })

  let deleteRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'DELETE' && request.url().includes('/api/cart/')) {
      deleteRequests += 1
    }
  })

  await cartItem.locator('[data-testid^="cart-item-delete-"]').click()
  await cancelMessageBox(page, '双端审计：购物车删除取消')
  expect(deleteRequests).toBe(0)
  await expect(cartItem).toBeVisible()

  const deleteResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/cart/') &&
    response.request().method() === 'DELETE'
  )
  await cartItem.locator('[data-testid^="cart-item-delete-"]').click()
  await confirmMessageBox(page, '双端审计：购物车删除确认')
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.ok(), `删除购物车项失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
  await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(0)
}

async function createPriceAlertOnlyAfterConfirm(page: Page, baseUrl: string, token: string, product: ProductRecord) {
  await cleanupPriceAlert(page, baseUrl, token, product.id)

  await page.goto(`${baseUrl}/product/${product.id}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)

  let alertMutations = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/price/alert') && ['POST', 'PUT', 'DELETE'].includes(request.method())) {
      alertMutations += 1
    }
  })

  await page.getByTestId('product-price-alert-open').click()
  await expect(page.getByTestId('product-price-alert-input')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(500)
  expect(alertMutations).toBe(0)

  const targetPrice = Math.max(1, Math.floor(product.price * 0.8))
  const alertResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/price/alert') &&
    response.request().method() === 'POST'
  )
  await page.getByTestId('product-price-alert-input').fill(String(targetPrice))
  await page.getByTestId('product-price-alert-confirm').click()
  const alertResponse = await alertResponsePromise
  expect(alertResponse.ok(), `创建降价提醒失败: ${alertResponse.status()} ${alertResponse.url()}`).toBeTruthy()

  await cleanupPriceAlert(page, baseUrl, token, product.id)
}

async function createPaidOrder(page: Page, baseUrl: string, product: ProductRecord, remark: string) {
  await page.goto(`${baseUrl}/product/${product.id}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)

  await page.getByTestId('product-buy-now').click()
  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible({ timeout: 15_000 })
  await page.locator('textarea').fill(remark)

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

  return orderNo
}

async function requestCancelFromUser(page: Page, baseUrl: string, orderNo: string) {
  await page.goto(`${baseUrl}/orders`)
  await expect(page.getByTestId('orders-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)
  await page.getByTestId('orders-search-input').fill(orderNo)

  const orderCard = page.locator('.order-card', { hasText: orderNo }).first()
  await expect(orderCard).toBeVisible({ timeout: 15_000 })
  await expect(orderCard).toContainText('待发货')

  const cancelResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders/') &&
    response.url().includes('/request-cancel') &&
    response.request().method() === 'PUT'
  )
  await orderCard.getByRole('button', { name: '申请取消' }).click()
  const cancelResponse = await cancelResponsePromise
  expect(cancelResponse.ok(), `申请取消失败: ${cancelResponse.status()} ${cancelResponse.url()}`).toBeTruthy()
  await expect(orderCard).toContainText('申请取消中', { timeout: 15_000 })
}

async function adminReviewAndDeleteOrder(page: Page, baseUrl: string, orderNo: string) {
  await page.goto(`${baseUrl}/admin/orders`)
  await expect(page.getByTestId('admin-orders-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)
  await page.getByPlaceholder('搜索订单号').fill(orderNo)
  await page.getByRole('button', { name: '搜索' }).click()

  let orderRow = page.locator('.el-table__row', { hasText: orderNo }).first()
  await expect(orderRow).toBeVisible({ timeout: 15_000 })
  await expect(orderRow).toContainText('申请取消中')

  let reviewRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/orders/') && request.url().includes('/review-cancel')) {
      reviewRequests += 1
    }
  })

  await orderRow.getByRole('button', { name: '同意取消' }).click()
  await cancelMessageBox(page, '双端审计：管理员同意取消弹窗取消')
  expect(reviewRequests).toBe(0)
  await expect(orderRow).toContainText('申请取消中')

  const reviewResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders/') &&
    response.url().includes('/review-cancel') &&
    response.request().method() === 'PUT'
  )
  await orderRow.getByRole('button', { name: '同意取消' }).click()
  await confirmMessageBox(page, '双端审计：管理员同意取消确认')
  const reviewResponse = await reviewResponsePromise
  expect(reviewResponse.ok(), `管理员审核取消失败: ${reviewResponse.status()} ${reviewResponse.url()}`).toBeTruthy()

  orderRow = page.locator('.el-table__row', { hasText: orderNo }).first()
  await expect(orderRow).toContainText('已取消', { timeout: 15_000 })

  let deleteRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/orders/') && request.url().includes('/admin') && request.method() === 'DELETE') {
      deleteRequests += 1
    }
  })

  await orderRow.getByRole('button', { name: '删除' }).click()
  await cancelMessageBox(page, '双端审计：管理员删除订单取消')
  expect(deleteRequests).toBe(0)
  await expect(orderRow).toBeVisible()

  const deleteResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders/') &&
    response.url().includes('/admin') &&
    response.request().method() === 'DELETE'
  )
  await orderRow.getByRole('button', { name: '删除' }).click()
  await confirmMessageBox(page, '双端审计：管理员删除订单确认', '确定删除')
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.ok(), `管理员删除订单失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
  await expect(page.locator('.el-table__row', { hasText: orderNo })).toHaveCount(0)
}

async function assertReviewImageDoesNotSubmitOnSelect(page: Page, baseUrl: string) {
  const imagePath = path.resolve(process.cwd(), '..', 'uploads', 'screenshots', 'test-case-login.png')

  await page.goto(`${baseUrl}/orders?status=3`)
  await expect(page.getByTestId('orders-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)

  const reviewButton = page.getByRole('button', { name: '去评价' }).first()
  await expect(reviewButton).toBeVisible({ timeout: 15_000 })
  await reviewButton.click()
  await expect(page.getByTestId('review-dialog')).toBeVisible({ timeout: 10_000 })
  await page.locator('.review-dialog textarea').fill('双端审计评价草稿')

  let imageUploadRequests = 0
  let reviewSubmitRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/files/review')) {
      imageUploadRequests += 1
    }
    if (request.method() === 'POST' && request.url().includes('/api/reviews')) {
      reviewSubmitRequests += 1
    }
  })

  await page.locator('.review-upload input[type="file"]').setInputFiles(imagePath)
  await expect(page.locator('.review-image-card img')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(1_000)

  expect(imageUploadRequests).toBe(0)
  expect(reviewSubmitRequests).toBe(0)
  await expect(page.getByText('评价提交成功')).toHaveCount(0)
  await expect(page.getByTestId('review-submit')).toBeVisible()

  await page.getByTestId('review-dialog').getByRole('button', { name: '取消' }).click()
  await expect(page.getByTestId('review-dialog')).not.toBeVisible()
}

async function newDualPages(browser: Browser) {
  if (userBaseUrl === adminBaseUrl) {
    const userContext = await browser.newContext()
    const adminContext = await browser.newContext()
    return {
      userContext,
      adminContext,
      userPage: await userContext.newPage(),
      adminPage: await adminContext.newPage(),
      sharedContext: false
    }
  }

  const context = await browser.newContext()
  return {
    userContext: context,
    adminContext: context,
    userPage: await context.newPage(),
    adminPage: await context.newPage(),
    sharedContext: true
  }
}

test('双端演示反固定流程：不同端口登录隔离、负向动作不误提交、跨角色刷新可见', async ({ browser }) => {
  test.setTimeout(240_000)

  const pages = await newDualPages(browser)
  const userWatchers = attachPageWatchers(pages.userPage)
  const adminWatchers = attachPageWatchers(pages.adminPage)
  const marker = `DUAL-AUDIT-${Date.now()}`
  let buyerSession: Session | null = null
  let product: ProductRecord | null = null

  try {
    buyerSession = await loginAt(pages.userPage, userBaseUrl, E2E_USERS.buyer, E2E_PASSWORD)
    await loginAt(pages.adminPage, adminBaseUrl, E2E_USERS.admin, E2E_PASSWORD)

    if (pages.sharedContext) {
      const userInfo = await pages.userPage.evaluate(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
      const adminInfo = await pages.adminPage.evaluate(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
      expect(userInfo.username).toBe(E2E_USERS.buyer)
      expect(adminInfo.username).toBe(E2E_USERS.admin)

      await pages.userPage.reload({ waitUntil: 'domcontentloaded' })
      await pages.adminPage.reload({ waitUntil: 'domcontentloaded' })
      await expect(pages.userPage.getByTestId('home-view')).toBeVisible({ timeout: 15_000 })
      await expect(pages.adminPage.getByTestId('home-view')).toBeVisible({ timeout: 15_000 })
    }

    product = await resolveProduct(pages.userPage, userBaseUrl)

    await addAndDeleteCartItem(pages.userPage, userBaseUrl, buyerSession.token, product)
    await createPriceAlertOnlyAfterConfirm(pages.userPage, userBaseUrl, buyerSession.token, product)

    const orderNo = await createPaidOrder(pages.userPage, userBaseUrl, product, marker)
    await pages.adminPage.goto(`${adminBaseUrl}/admin/orders`)
    await expect(pages.adminPage.getByTestId('admin-orders-view')).toBeVisible({ timeout: 15_000 })
    await pages.adminPage.getByPlaceholder('搜索订单号').fill(orderNo)
    await pages.adminPage.getByRole('button', { name: '搜索' }).click()
    await expect(pages.adminPage.locator('.el-table__row', { hasText: orderNo }).first()).toBeVisible({ timeout: 15_000 })

    await requestCancelFromUser(pages.userPage, userBaseUrl, orderNo)
    await adminReviewAndDeleteOrder(pages.adminPage, adminBaseUrl, orderNo)
    await assertReviewImageDoesNotSubmitOnSelect(pages.userPage, userBaseUrl)

    expectNoBlockingBrowserIssues(userWatchers.consoleErrors, userWatchers.failedRequests)
    expectNoBlockingBrowserIssues(adminWatchers.consoleErrors, adminWatchers.failedRequests)
  } finally {
    if (buyerSession && product) {
      await clearCart(pages.userPage, userBaseUrl, buyerSession.token).catch(() => {})
      await cleanupPriceAlert(pages.userPage, userBaseUrl, buyerSession.token, product.id).catch(() => {})
    }
    await pages.userContext.close()
    if (pages.adminContext !== pages.userContext) {
      await pages.adminContext.close()
    }
  }
})
