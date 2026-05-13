import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedPost,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

async function resolveCategoryId(page: Page) {
  const response = await page.request.get('/api/categories')
  expect(response.ok(), `获取分类失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const categories = Array.isArray(payload?.data) ? payload.data : []
  expect(categories.length, '真实环境中至少需要一个分类供商品提交流程使用').toBeGreaterThan(0)
  return Number(categories[0].id)
}

async function createApprovedSellerProduct(page: Page) {
  const categoryId = await resolveCategoryId(page)
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E-SELLER-ORDER-${Date.now()}`

  const submitResponse = await authedPost(page.request, sellerSession.token, '/api/products/submit', {
    name: uniqueName,
    description: 'real-browser-seller-orders',
    price: '88.00',
    stock: 5,
    categoryId
  })
  expect(submitResponse.ok(), `提交商品失败: ${submitResponse.status()} ${submitResponse.url()}`).toBeTruthy()

  const submitPayload = await submitResponse.json()
  expect(submitPayload?.code).toBe(200)
  const productId = Number(submitPayload?.data?.id || 0)
  expect(productId).toBeGreaterThan(0)

  const auditResponse = await authedPost(page.request, adminSession.token, `/api/products/${productId}/audit`, {
    auditStatus: 1,
    remark: 'e2e auto approve'
  })
  expect(auditResponse.ok(), `审核商品失败: ${auditResponse.status()} ${auditResponse.url()}`).toBeTruthy()

  const auditPayload = await auditResponse.json()
  expect(auditPayload?.code).toBe(200)

  return productId
}

async function createPaidOrder(page: Page, productId: number, remark: string) {
  await page.goto(`/product/${productId}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible()
  await neutralizeFloatingUi(page)

  await page.getByTestId('product-buy-now').click()
  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible()

  const submitButton = page.getByTestId('checkout-submit')
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()

  const createOrderResponse = page.waitForResponse((response) =>
    response.url().includes('/api/orders') &&
    response.request().method() === 'POST'
  )
  await submitButton.click()

  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await continueSubmitButton.click()
  }
  await createOrderResponse

  await page.waitForURL(/\/payment\/\d+/)
  await expect(page.getByTestId('payment-view')).toBeVisible()

  const orderNoText = (await page.locator('.order-no').textContent()) || ''
  const orderNo = orderNoText.replace('订单号：', '').trim()
  expect(orderNo).toBeTruthy()

  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible()
  await page.getByTestId('payment-simulate').click()
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })

  return orderNo
}

test('卖家可在发货页查看待发货订单、切换筛选并完成发货', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const remark = `E2E-SELLER-ORDERS-${Date.now()}`
  const productId = await createApprovedSellerProduct(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const orderNo = await createPaidOrder(page, productId, remark)

  await logout(page)

  await login(page, E2E_USERS.seller, E2E_PASSWORD)
  await page.goto('/seller-orders')
  await neutralizeFloatingUi(page)

  await expect(page.getByTestId('seller-orders-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: '卖家发货' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /待发货/ })).toBeVisible()

  const pendingOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(pendingOrderCard).toBeVisible({ timeout: 15_000 })
  await expect(pendingOrderCard).toContainText('待发货')

  const shipResponse = page.waitForResponse((response) =>
    response.url().includes('/api/orders/seller/items/') &&
    response.request().method() === 'PUT'
  )
  await pendingOrderCard.getByRole('button', { name: '发货' }).click()
  await page.getByRole('button', { name: '确定发货' }).click()
  await shipResponse
  await expect(page.getByText('发货成功')).toBeVisible()
  await expect(pendingOrderCard).toContainText('已发货')

  await page.locator('.toolbar').getByText('已发货', { exact: true }).click()
  await expect(page.locator('.order-card', { hasText: orderNo })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.order-card', { hasText: orderNo })).toContainText('已发货')

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
