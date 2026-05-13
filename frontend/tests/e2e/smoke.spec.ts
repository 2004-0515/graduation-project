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

async function enterCheckoutFromProduct(page: Page, productId: number) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`/product/${productId}`)
    await page.waitForURL(new RegExp(`/product/${productId}$`))
    await expect(page.getByTestId('product-detail-view')).toBeVisible()
    await expect(page.getByTestId('global-music-player')).toBeVisible()

    const buyNowButton = page.getByTestId('product-buy-now')
    await expect(buyNowButton).toBeVisible()
    await buyNowButton.click()

    const checkoutView = page.getByTestId('checkout-view')
    const checkoutHeading = page.getByRole('heading', { name: '确认订单' })
    const reachedCheckout = await Promise.all([
      checkoutView
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false),
      checkoutHeading
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false)
    ]).then(([viewReady, headingReady]) => viewReady || headingReady)

    if (reachedCheckout) {
      return
    }

    if (page.url().includes('/login')) {
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      continue
    }

    if (page.url().includes('/checkout')) {
      await expect(checkoutView).toBeVisible({ timeout: 15_000 })
      return
    }

    await page.waitForTimeout(1_000)
  }

  throw new Error('无法从商品详情页稳定进入结算页')
}

async function waitForOrderCardWithRecovery(page: Page, orderId: number, orderNo: string) {
  const paidOrderCard = page.getByTestId(`order-card-${orderId}`)

  for (let attempt = 0; attempt < 2; attempt++) {
    await expect(page.getByTestId('orders-view')).toBeVisible()
    await page.getByTestId('orders-search-input').fill(orderNo)

    const cardVisible = await paidOrderCard
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false)

    if (cardVisible) {
      return paidOrderCard
    }

    const retryButton = page.getByRole('button', { name: '重试' })
    if (await retryButton.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await retryButton.click()
      await page.waitForLoadState('networkidle').catch(() => {})
      continue
    }

    await page.reload()
    await page.waitForURL(/\/orders/)
    await neutralizeFloatingUi(page)
  }

  throw new Error(`订单页未能稳定加载目标订单: ${orderId} / ${orderNo}`)
}

test('普通用户主链路冒烟', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/')
  await expect(page.getByTestId('global-music-player')).toBeVisible()
  await expect(page.getByTestId('home-view')).toBeVisible()
  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await expect(page.getByTestId('home-view')).toBeVisible()

  const smokeProductId = await resolveProductId(page, 'smoke', {
    explicitId: E2E_PRODUCTS.smoke,
    excludeSellerUsername: E2E_USERS.buyer
  })

  await enterCheckoutFromProduct(page, smokeProductId)
  const submitButton = page.getByTestId('checkout-submit')
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()
  await submitButton.click()
  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await continueSubmitButton.click()
  }

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
  await expect(page.getByTestId('payment-view-orders')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible()
  await page.getByTestId('payment-view-orders').click()

  await page.waitForURL(/\/orders/)
  await neutralizeFloatingUi(page)
  const paidOrderCard = await waitForOrderCardWithRecovery(page, orderId, orderNo)
  await expect(paidOrderCard).toBeVisible({ timeout: 15_000 })
  await expect(paidOrderCard).toContainText('待发货')

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
