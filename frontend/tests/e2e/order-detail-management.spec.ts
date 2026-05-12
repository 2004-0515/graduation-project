import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  login,
  logout,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function createPaidOrder(page: Page, productId: number) {
  await page.goto(`/product/${productId}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible()
  await neutralizeFloatingUi(page)

  await page.getByTestId('product-buy-now').click()
  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible()

  const createOrderResponse = page.waitForResponse((response) =>
    response.url().includes('/api/orders') &&
    response.request().method() === 'POST'
  )
  await page.getByTestId('checkout-submit').click()

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

  const orderIdMatch = page.url().match(/\/payment\/(\d+)/)
  const orderId = Number(orderIdMatch?.[1] || 0)
  expect(orderId).toBeGreaterThan(0)

  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible()
  await page.getByTestId('payment-simulate').click()
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })

  return { orderId, orderNo }
}

test('买家可在订单详情页确认收货并看到真实状态刷新', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const shippingProduct = await resolveProduct(page, 'order-detail-shipping', {
    explicitId: E2E_PRODUCTS.shipping,
    sellerUsername: process.env.E2E_SELLER_USERNAME || undefined
  })
  const productId = Number(shippingProduct.id)
  const sellerUsername = shippingProduct.sellerName || E2E_USERS.seller

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const { orderId, orderNo } = await createPaidOrder(page, productId)

  await logout(page)

  await login(page, sellerUsername, E2E_PASSWORD)
  await page.goto('/seller-orders')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('seller-orders-view')).toBeVisible()

  const sellerOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(sellerOrderCard).toBeVisible({ timeout: 15_000 })
  const shipResponse = page.waitForResponse((response) =>
    response.url().includes('/api/orders/seller/items/') &&
    response.request().method() === 'PUT'
  )
  await sellerOrderCard.getByRole('button', { name: '发货' }).click()
  await page.getByRole('button', { name: '确定发货' }).click()
  await shipResponse
  await expect(page.getByText('发货成功')).toBeVisible()

  await logout(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto(`/order/${orderId}`)
  await neutralizeFloatingUi(page)

  await expect(page.getByTestId('order-detail-view')).toBeVisible()
  await expect(page.getByTestId('order-detail-order-no')).toContainText(orderNo)
  await expect(page.getByTestId('order-detail-status')).toContainText('待收货')

  const confirmResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/orders/${orderId}/confirm`) &&
    response.request().method() === 'PUT'
  )
  await page.getByTestId('order-detail-confirm').click()
  await confirmResponse

  await expect(page.getByTestId('order-detail-status')).toContainText('已完成', { timeout: 15_000 })
  await expect(page.getByText('已确认收货')).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
