import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi,
  resolveProductId
} from './helpers/session'

async function createUnpaidOrder(page: Page, productId: number) {
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

  return { orderId, orderNo }
}

test('买家可在订单页搜索待支付订单并取消', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const productId = await resolveProductId(page, 'orders-management', {
    explicitId: E2E_PRODUCTS.smoke,
    excludeSellerUsername: E2E_USERS.buyer
  })

  const { orderId, orderNo } = await createUnpaidOrder(page, productId)

  await page.goto('/orders')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('orders-view')).toBeVisible()

  const searchInput = page.getByTestId('orders-search-input')
  await searchInput.fill(orderNo)

  const orderCard = page.getByTestId(`order-card-${orderId}`)
  await expect(orderCard).toBeVisible({ timeout: 15_000 })
  await expect(orderCard).toContainText(orderNo)
  await expect(orderCard).toContainText('待支付')

  await page.getByTestId(`order-pay-${orderId}`).click()
  await page.waitForURL(new RegExp(`/payment/${orderId}$`))
  await expect(page.getByTestId('payment-view')).toBeVisible()

  await page.goto('/orders')
  await neutralizeFloatingUi(page)
  await searchInput.fill(orderNo)
  await expect(orderCard).toBeVisible({ timeout: 15_000 })

  const cancelResponse = page.waitForResponse((response) =>
    response.request().method() === 'PUT' &&
    response.url().includes(`/api/orders/${orderId}/cancel`)
  )
  await page.getByTestId(`order-cancel-${orderId}`).click()
  await cancelResponse

  await expect(orderCard).toContainText('已取消', { timeout: 15_000 })
  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
