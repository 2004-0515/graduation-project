import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
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
  sellerId?: number | null
  sellerName?: string | null
}

type AddressRecord = {
  id: number
}

const baseUrl = (process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '')

type ProductFilter = {
  sellerName?: string
  excludeSellerName?: string
  minStock?: number
}

async function loginAt(page: Page, username: string): Promise<Session> {
  const response = await page.request.post(`${baseUrl}/api/auth/login`, {
    data: { username, password: E2E_PASSWORD }
  })
  expect(response.ok(), `登录失败: ${username} ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code, `登录接口返回异常: ${username}`).toBe(200)
  return {
    token: String(payload.data.token || ''),
    user: payload.data.user || {}
  }
}

async function openWithSession(page: Page, session: Session, path = '/') {
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(user))
  }, session)
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' })
  await neutralizeFloatingUi(page)
}

async function authedGet(page: Page, token: string, apiPath: string) {
  return page.request.get(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function authedPost(page: Page, token: string, apiPath: string, data: unknown) {
  return page.request.post(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data
  })
}

async function authedPut(page: Page, token: string, apiPath: string, data?: unknown) {
  return page.request.put(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data
  })
}

async function authedDelete(page: Page, token: string, apiPath: string) {
  return page.request.delete(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function expectApiCode(response: Awaited<ReturnType<typeof authedGet>>, expectedCode: number, label: string) {
  const payload = await response.json().catch(() => null)
  expect(payload?.code ?? response.status(), `${label}: code/status 异常，HTTP ${response.status()} ${response.url()}`).toBe(expectedCode)
  return payload
}

async function expectDenied(response: Awaited<ReturnType<typeof authedGet>>, label: string) {
  const payload = await response.json().catch(() => null)
  const code = Number(payload?.code || response.status())
  expect([401, 403], `${label}: 应拒绝越权访问，HTTP ${response.status()} body=${JSON.stringify(payload)}`).toContain(code)
}

function formatLocalDateTime(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

async function resolveProduct(page: Page, filter: ProductFilter = {}): Promise<ProductRecord> {
  const response = await page.request.get(`${baseUrl}/api/products?page=0&size=100`)
  await expectApiCode(response, 200, '获取商品列表')
  const payload = await response.json()
  const products = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.content)
      ? payload.data.content
      : []

  const product = products
    .map((item: any) => ({
      id: Number(item.id || 0),
      name: String(item.name || ''),
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
      status: Number(item.status || 0),
      sellerId: item.sellerId == null ? null : Number(item.sellerId),
      sellerName: item.sellerName || null
    }))
    .find((item: ProductRecord) =>
      item.id > 0 &&
      item.status === 1 &&
      item.stock >= (filter.minStock || 2) &&
      item.price > 0 &&
      (!filter.sellerName || item.sellerName === filter.sellerName) &&
      (!filter.excludeSellerName || item.sellerName !== filter.excludeSellerName) &&
      item.sellerName !== E2E_USERS.buyer
    )

  expect(product, '没有找到可用于边界测试的上架商品').toBeTruthy()
  return product!
}

async function createActiveCoupon(page: Page, adminToken: string, marker: string) {
  const response = await authedPost(page, adminToken, '/api/coupons/admin', {
    name: marker,
    type: 1,
    discountAmount: 10,
    minAmount: 0,
    totalCount: 20,
    limitPerUser: 1,
    description: 'defense-edge-coupon',
    status: 1,
    startTime: formatLocalDateTime(-1),
    endTime: formatLocalDateTime(30)
  })
  await expectApiCode(response, 200, '创建边界测试优惠券')
  const payload = await response.json()
  const couponId = Number(payload?.data?.id || 0)
  expect(couponId, '创建优惠券未返回 ID').toBeGreaterThan(0)
  return couponId
}

async function resolveAddress(page: Page, token: string): Promise<AddressRecord> {
  const response = await authedGet(page, token, '/api/addresses')
  await expectApiCode(response, 200, '获取买家地址')
  const payload = await response.json()
  const addresses = Array.isArray(payload?.data) ? payload.data : []
  const address = addresses.find((item: any) => Number(item.id || 0) > 0)
  expect(address, '测试买家必须至少有一个收货地址').toBeTruthy()
  return { id: Number(address.id) }
}

async function createPendingOrder(page: Page, token: string, product: ProductRecord, address: AddressRecord, marker: string) {
  const response = await authedPost(page, token, '/api/orders', {
    addressId: address.id,
    paymentMethod: 1,
    remark: marker,
    items: [{ productId: product.id, quantity: 1 }]
  })
  await expectApiCode(response, 200, '创建待支付订单')
  const payload = await response.json()
  const orderId = Number(payload?.data?.id || 0)
  expect(orderId, '创建订单未返回 ID').toBeGreaterThan(0)
  return orderId
}

test('旧缓存伪装、越权直达和角色边界都不能绕过服务端事实', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const buyerSession = await loginAt(page, E2E_USERS.buyer)
  const sellerSession = await loginAt(page, E2E_USERS.seller)
  const adminSession = await loginAt(page, E2E_USERS.admin)

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ token }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify({
      id: 99999,
      username: 'admin',
      role: 'ADMIN',
      status: 1
    }))
  }, { token: buyerSession.token })

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' })
  await neutralizeFloatingUi(page)
  await expect(page, '买家 token 搭配伪造管理员缓存时不能进入后台').toHaveURL(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`), { timeout: 15_000 })
  await expect(page.getByTestId('home-view')).toBeVisible({ timeout: 15_000 })
  const storedUser = await page.evaluate(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
  expect(storedUser?.username, '路由守卫应以 /auth/me 刷新后的真实用户覆盖旧缓存').toBe(E2E_USERS.buyer)
  expect(storedUser?.role, '买家不能通过 localStorage 伪装 ADMIN').toBe('BUYER')

  await expectDenied(await authedGet(page, buyerSession.token, '/api/users?pageNo=0&pageSize=1'), '买家访问用户管理接口')
  await expectDenied(await authedGet(page, buyerSession.token, '/api/orders/admin?page=0&size=1'), '买家访问后台订单接口')
  await expectDenied(await authedGet(page, buyerSession.token, '/api/products/my'), '买家访问卖家商品接口')
  await expectDenied(await authedGet(page, buyerSession.token, '/api/orders/seller/items'), '买家访问卖家订单接口')
  await expectDenied(await authedGet(page, sellerSession.token, '/api/users?pageNo=0&pageSize=1'), '卖家访问用户管理接口')
  await expectDenied(await authedGet(page, sellerSession.token, '/api/orders/admin?page=0&size=1'), '卖家访问后台订单接口')
  await expectApiCode(await authedGet(page, adminSession.token, '/api/users?pageNo=0&pageSize=1'), 200, '管理员访问用户管理接口')

  const filteredFailures = failedRequests.filter((entry) => !/^403 .*\/api\/(users|orders\/admin|products\/my|orders\/seller\/items)/.test(entry))
  expectNoBlockingBrowserIssues(consoleErrors, filteredFailures)
})

test('订单和购物车数量边界：0/负数不能创建异常订单或反向改库存', async ({ page }) => {
  const buyerSession = await loginAt(page, E2E_USERS.buyer)
  const product = await resolveProduct(page)
  const address = await resolveAddress(page, buyerSession.token)

  for (const quantity of [0, -1]) {
    const cartResponse = await authedPost(page, buyerSession.token, '/api/cart', {
      productId: product.id,
      quantity
    })
    const cartPayload = await cartResponse.json().catch(() => null)
    expect([400, 422], `购物车数量 ${quantity} 应被拒绝: ${JSON.stringify(cartPayload)}`).toContain(Number(cartPayload?.code || cartResponse.status()))

    const orderResponse = await authedPost(page, buyerSession.token, '/api/orders', {
      addressId: address.id,
      paymentMethod: 1,
      remark: `edge-invalid-quantity-${quantity}`,
      items: [{ productId: product.id, quantity }]
    })
    const orderPayload = await orderResponse.json().catch(() => null)
    expect([400, 422], `订单数量 ${quantity} 应被拒绝: ${JSON.stringify(orderPayload)}`).toContain(Number(orderPayload?.code || orderResponse.status()))
  }
})

test('结算页双击提交只允许创建一个待支付订单，并且可正常清理', async ({ page }) => {
  test.setTimeout(120_000)
  const buyerSession = await loginAt(page, E2E_USERS.buyer)
  const product = await resolveProduct(page, { excludeSellerName: E2E_USERS.buyer })
  let orderId: number | null = null
  let createMutations = 0

  try {
    await openWithSession(page, buyerSession, `/checkout?productId=${product.id}&quantity=1`)
    await expect(page.getByTestId('checkout-view')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('checkout-submit')).toBeEnabled({ timeout: 15_000 })

    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/orders')) {
        createMutations += 1
      }
    })

    const orderResponsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/orders') &&
      response.request().method() === 'POST'
    )
    await page.getByTestId('checkout-submit').dblclick()
    const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
    if (await continueSubmitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await continueSubmitButton.click()
    }

    const orderResponse = await orderResponsePromise
    const orderPayload = await orderResponse.json().catch(() => null)
    expect(orderPayload?.code, `双击提交订单返回异常: ${JSON.stringify(orderPayload)}`).toBe(200)
    orderId = Number(orderPayload?.data?.id || 0)
    expect(orderId, '双击提交后未返回订单 ID').toBeGreaterThan(0)
    await expect(page).toHaveURL(/\/payment\/\d+/, { timeout: 15_000 })
    expect(createMutations, '双击提交不能发起两次创建订单请求').toBe(1)
  } finally {
    if (orderId) {
      await authedPut(page, buyerSession.token, `/api/orders/${orderId}/cancel`, {}).catch(() => {})
      await authedDelete(page, buyerSession.token, `/api/orders/${orderId}`).catch(() => {})
    }
  }
})

test('优惠券双击领取只允许一次请求，二次领取必须由服务端拒绝', async ({ page }) => {
  test.setTimeout(120_000)
  const buyerSession = await loginAt(page, E2E_USERS.buyer)
  const adminSession = await loginAt(page, E2E_USERS.admin)
  const couponId = await createActiveCoupon(page, adminSession.token, `DEFENSE-EDGE-COUPON-${Date.now()}`)
  let claimMutations = 0

  try {
    await authedPost(page, adminSession.token, '/api/coupons/admin/reset-user-coupon', {
      userId: Number((buyerSession.user as { id?: number }).id || 0),
      couponId
    })

    await openWithSession(page, buyerSession, `/coupon/${couponId}`)
    await expect(page.getByTestId('coupon-detail-view')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('coupon-detail-claim')).toBeEnabled({ timeout: 15_000 })

    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes(`/api/coupons/${couponId}/claim`)) {
        claimMutations += 1
      }
    })

    const claimResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`/api/coupons/${couponId}/claim`) &&
      response.request().method() === 'POST'
    )
    await page.getByTestId('coupon-detail-claim').dblclick()
    const claimResponse = await claimResponsePromise
    const claimPayload = await claimResponse.json().catch(() => null)
    expect(claimPayload?.code, `双击领取优惠券返回异常: ${JSON.stringify(claimPayload)}`).toBe(200)
    await expect(page.getByTestId('coupon-detail-claim')).toBeDisabled({ timeout: 15_000 })
    expect(claimMutations, '双击领取不能发起两次领取请求').toBe(1)

    const secondClaim = await authedPost(page, buyerSession.token, `/api/coupons/${couponId}/claim`, {})
    const secondPayload = await secondClaim.json().catch(() => null)
    expect(Number(secondPayload?.code || secondClaim.status()), `重复领取应失败: ${JSON.stringify(secondPayload)}`).toBe(422)
  } finally {
    await authedDelete(page, adminSession.token, `/api/coupons/admin/${couponId}`).catch(() => {})
  }
})

test('待支付期间商品下架后不能继续支付，也不能扣减库存', async ({ page }) => {
  const buyerSession = await loginAt(page, E2E_USERS.buyer)
  const adminSession = await loginAt(page, E2E_USERS.admin)
  const product = await resolveProduct(page, { excludeSellerName: E2E_USERS.buyer })
  const address = await resolveAddress(page, buyerSession.token)
  const orderId = await createPendingOrder(page, buyerSession.token, product, address, `edge-off-shelf-pay-${Date.now()}`)

  try {
    await expectApiCode(
      await authedPut(page, adminSession.token, `/api/products/${product.id}`, { status: 0 }),
      200,
      '管理员临时下架商品'
    )

    const payResponse = await authedPut(page, buyerSession.token, `/api/orders/${orderId}/pay`, { paymentMethod: 1 })
    const payPayload = await payResponse.json().catch(() => null)
    expect(Number(payPayload?.code || payResponse.status()), `下架商品不应继续支付: ${JSON.stringify(payPayload)}`).toBe(422)
    expect(String(payPayload?.message || ''), '支付失败原因应明确提示下架').toContain('下架')

    const productAfterPay = await authedGet(page, adminSession.token, `/api/products/${product.id}`)
    await expectApiCode(productAfterPay, 200, '读取下架支付后的商品')
    const productPayload = await productAfterPay.json()
    expect(Number(productPayload?.data?.stock), '下架后失败支付不应扣减库存').toBe(product.stock)
  } finally {
    await authedPut(page, adminSession.token, `/api/products/${product.id}`, { status: product.status }).catch(() => {})
    await authedPut(page, buyerSession.token, `/api/orders/${orderId}/cancel`, {}).catch(() => {})
    await authedDelete(page, buyerSession.token, `/api/orders/${orderId}`).catch(() => {})
  }
})

test('卖家不能通过直接订单接口购买自己的商品', async ({ page }) => {
  const sellerSession = await loginAt(page, E2E_USERS.seller)
  const ownProduct = await resolveProduct(page, { sellerName: E2E_USERS.seller })
  const address = await resolveAddress(page, sellerSession.token)

  const response = await authedPost(page, sellerSession.token, '/api/orders', {
    addressId: address.id,
    paymentMethod: 1,
    remark: `edge-own-product-${Date.now()}`,
    items: [{ productId: ownProduct.id, quantity: 1 }]
  })
  const payload = await response.json().catch(() => null)
  expect(Number(payload?.code || response.status()), `卖家自购应被拒绝: ${JSON.stringify(payload)}`).toBe(422)
  expect(String(payload?.message || ''), '自购失败原因应明确').toContain('自己')
})

test('管理员不能误禁用、降级或删除当前登录的自己', async ({ page }) => {
  const adminSession = await loginAt(page, E2E_USERS.admin)
  const adminUserId = Number((adminSession.user as { id?: number }).id || 0)
  expect(adminUserId, '管理员会话未返回用户 ID').toBeGreaterThan(0)

  await openWithSession(page, adminSession, '/admin/users')
  await expect(page.getByTestId('admin-users-view')).toBeVisible({ timeout: 15_000 })
  await page.getByPlaceholder('搜索用户名/邮箱').fill(E2E_USERS.admin)
  await page.getByRole('button', { name: '搜索' }).click()

  const adminRow = page.locator('.el-table__row', { hasText: E2E_USERS.admin }).first()
  await expect(adminRow, '用户管理页必须能定位当前管理员行').toBeVisible({ timeout: 15_000 })
  await expect(adminRow.getByRole('button', { name: '本人' }), '当前管理员行应显示自保护状态').toBeVisible()
  await expect(adminRow.getByRole('button', { name: '本人' })).toBeDisabled()
  await expect(adminRow.getByRole('button', { name: '角色' }), '当前管理员角色按钮应禁用').toBeDisabled()
  await expect(adminRow.getByRole('button', { name: '禁用' }), '当前管理员行不应出现可点击禁用按钮').toHaveCount(0)

  const selfDisable = await authedPut(page, adminSession.token, `/api/users/${adminUserId}/status`, { status: 0 })
  const selfDisablePayload = await selfDisable.json().catch(() => null)
  expect(Number(selfDisablePayload?.code || selfDisable.status()), `管理员禁用自己应被拒绝: ${JSON.stringify(selfDisablePayload)}`).toBe(422)

  const selfDowngrade = await authedPut(page, adminSession.token, `/api/users/${adminUserId}/role`, { role: 'BUYER' })
  const selfDowngradePayload = await selfDowngrade.json().catch(() => null)
  expect(Number(selfDowngradePayload?.code || selfDowngrade.status()), `管理员降级自己应被拒绝: ${JSON.stringify(selfDowngradePayload)}`).toBe(422)

  const selfDelete = await authedDelete(page, adminSession.token, `/api/users/${adminUserId}`)
  const selfDeletePayload = await selfDelete.json().catch(() => null)
  expect(Number(selfDeletePayload?.code || selfDelete.status()), `管理员删除自己应被拒绝: ${JSON.stringify(selfDeletePayload)}`).toBe(422)

  const stillAdmin = await authedGet(page, adminSession.token, '/api/auth/me')
  await expectApiCode(stillAdmin, 200, '自保护拒绝后管理员 token 仍应有效')
  const stillAdminPayload = await stillAdmin.json()
  expect(stillAdminPayload?.data?.username).toBe(E2E_USERS.admin)
  expect(stillAdminPayload?.data?.role).toBe('ADMIN')
  expect(Number(stillAdminPayload?.data?.status)).toBe(1)
})

test('支付页双击模拟支付只允许一次真实支付请求，重复支付必须被拒绝', async ({ page }) => {
  test.setTimeout(120_000)
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const buyerSession = await loginAt(page, E2E_USERS.buyer)
  const product = await resolveProduct(page)
  const address = await resolveAddress(page, buyerSession.token)
  const orderId = await createPendingOrder(page, buyerSession.token, product, address, `edge-pay-dblclick-${Date.now()}`)

  await openWithSession(page, buyerSession, `/payment/${orderId}`)
  await expect(page.getByTestId('payment-view')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('payment-open')).toBeEnabled({ timeout: 10_000 })

  let payMutations = 0
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().includes(`/api/orders/${orderId}/pay`)) {
      payMutations += 1
    }
  })

  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible({ timeout: 10_000 })
  await page.getByTestId('payment-simulate').dblclick()
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(800)
  expect(payMutations, '双击模拟支付不能发起两次支付请求').toBe(1)

  const secondPay = await authedPut(page, buyerSession.token, `/api/orders/${orderId}/pay`, { paymentMethod: 1 })
  const payload = await secondPay.json().catch(() => null)
  expect(Number(payload?.code || secondPay.status()), `已支付订单重复支付应被拒绝: ${JSON.stringify(payload)}`).toBe(422)

  const filteredFailures = failedRequests.filter((entry) => !entry.includes(`/api/orders/${orderId}/pay`))
  expectNoBlockingBrowserIssues(consoleErrors, filteredFailures)
})

test('同一买家多标签页刷新后购物车必须读取同一份后端数据', async ({ browser }) => {
  const context = await browser.newContext()
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  const session = await loginAt(tabA, E2E_USERS.buyer)
  const product = await resolveProduct(tabA)

  try {
    await authedDelete(tabA, session.token, '/api/cart/clear')

    await openWithSession(tabA, session, `/product/${product.id}`)
    await openWithSession(tabB, session, '/cart')
    await expect(tabB.getByTestId('cart-empty'), '清空后第二标签页应显示空购物车').toBeVisible({ timeout: 15_000 })

    const addResponsePromise = tabA.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes('/api/cart')
    )
    await tabA.getByTestId('product-add-to-cart').click()
    const addResponse = await addResponsePromise
    expect(addResponse.ok(), `加入购物车失败: ${addResponse.status()} ${addResponse.url()}`).toBeTruthy()

    await tabB.reload({ waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(tabB)
    await expect(tabB.getByTestId('cart-list'), '第二标签页刷新后应看到第一标签页加入的商品').toBeVisible({ timeout: 15_000 })
    await expect(tabB.locator('[data-testid^="cart-item-"]').first()).toContainText(product.name, { timeout: 15_000 })
  } finally {
    await authedDelete(tabA, session.token, '/api/cart/clear').catch(() => {})
    await context.close()
  }
})
