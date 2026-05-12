import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
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

test('用户可在支付页切换支付方式并完成支付后跳回订单列表', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const productId = await resolveProductId(page, 'payment-management', {
    excludeSellerUsername: E2E_USERS.buyer
  })

  const { orderId, orderNo } = await createUnpaidOrder(page, productId)

  await expect(page.getByTestId('payment-total-amount')).toBeVisible()
  await page.getByTestId('payment-method-2').click()

  await page.getByTestId('payment-open').click()
  await expect(page.getByRole('heading', { name: '支付宝' })).toBeVisible()

  const payResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/orders/${orderId}/pay`) &&
    response.request().method() === 'PUT'
  )
  await page.getByTestId('payment-simulate').click()
  await payResponse

  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('支付方式：支付宝')).toBeVisible()
  await page.getByTestId('payment-view-orders').click()

  await page.waitForURL(/\/orders/)
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await page.getByTestId('orders-search-input').fill(orderNo)

  const orderCard = page.getByTestId(`order-card-${orderId}`)
  await expect(orderCard).toBeVisible({ timeout: 15_000 })
  await expect(orderCard).toContainText('待发货')

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
