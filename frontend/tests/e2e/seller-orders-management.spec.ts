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
  const shippingProduct = await resolveProduct(page, 'seller-orders-shipping', {
    explicitId: E2E_PRODUCTS.shipping,
    sellerUsername: process.env.E2E_SELLER_USERNAME || undefined
  })
  const productId = Number(shippingProduct.id)
  const sellerUsername = shippingProduct.sellerName || E2E_USERS.seller

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const orderNo = await createPaidOrder(page, productId, remark)

  await logout(page)

  await login(page, sellerUsername, E2E_PASSWORD)
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
