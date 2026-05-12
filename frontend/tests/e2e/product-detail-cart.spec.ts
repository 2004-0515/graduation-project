import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  getSession,
  login,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function clearCart(token: string, request: APIRequestContext) {
  const response = await request.delete('/api/cart/clear', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  expect(response.ok(), `清空购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

test('用户可从商品详情页直接加入购物车并在购物车页看到真实数据', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  await clearCart(buyerSession.token, page.request)

  const product = await resolveProduct(page, 'product-detail-cart', {
    excludeSellerUsername: E2E_USERS.buyer
  })

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto(`/product/${product.id}`)
    await neutralizeFloatingUi(page)

    await expect(page.getByTestId('product-detail-view')).toBeVisible()
    const addToCartResponse = page.waitForResponse((response) =>
      response.url().includes('/api/cart') &&
      response.request().method() === 'POST'
    )
    await page.getByTestId('product-add-to-cart').click()
    await addToCartResponse

    await expect(page.getByText('商品已添加到购物车')).toBeVisible({ timeout: 15_000 })

    await page.goto('/cart')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('cart-view')).toBeVisible()

    const cartItem = page.locator('[data-testid^="cart-item-"]', { hasText: product.name || '' })
    await expect(cartItem).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('cart-selected-count')).toContainText('共 1 件')

    expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
  } finally {
    await clearCart(buyerSession.token, page.request).catch(() => {})
  }
})
