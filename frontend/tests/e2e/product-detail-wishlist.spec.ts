import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  authedGet,
  authedDelete,
  expectNoBlockingBrowserIssues,
  getSession,
  login,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function cleanupWishlistByProduct(request: APIRequestContext, token: string, productId: number) {
  const wishlistResponse = await authedGet(request, token, '/api/rational-consumption/wishlist')
  expect(wishlistResponse.ok(), `获取心愿单失败: ${wishlistResponse.status()} ${wishlistResponse.url()}`).toBeTruthy()
  const payload = await wishlistResponse.json()
  expect(payload?.code).toBe(200)
  const items = Array.isArray(payload?.data) ? payload.data : []
  for (const item of items) {
    if (Number(item.productId || 0) === productId && Number(item.id || 0) > 0) {
      await authedDelete(request, token, `/api/rational-consumption/wishlist/${Number(item.id)}`).catch(() => {})
    }
  }
}

test('用户可从商品详情页加入心愿单并在理性消费页看到真实列表', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const product = await resolveProduct(page, 'product-detail-wishlist', {
    excludeSellerUsername: E2E_USERS.buyer
  })

  await cleanupWishlistByProduct(page.request, buyerSession.token, Number(product.id))

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto(`/product/${product.id}`)
    await neutralizeFloatingUi(page)

    await expect(page.getByTestId('product-detail-view')).toBeVisible()
    await page.getByTestId('product-add-to-wishlist').click()
    await expect(page.getByRole('heading', { name: '加入心愿单' })).toBeVisible()

    const createResponse = page.waitForResponse((response) =>
      response.url().includes('/api/rational-consumption/wishlist') &&
      response.request().method() === 'POST'
    )
    await page.getByTestId('product-wishlist-confirm').click()
    const createWishlistResponse = await createResponse
    expect(createWishlistResponse.ok(), `添加心愿单失败: ${createWishlistResponse.status()} ${createWishlistResponse.url()}`).toBeTruthy()

    const createWishlistPayload = await createWishlistResponse.json()
    expect(createWishlistPayload?.code).toBe(200)

    await expect(page.getByRole('heading', { name: '加入心愿单' })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByTestId('product-add-to-wishlist')).toContainText('已在心愿单', { timeout: 15_000 })

    await page.goto('/rational-consumption?tab=wishlist')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('rational-consumption-view')).toBeVisible()

    const wishlistItem = page.locator('[data-testid^="wishlist-item-"]', { hasText: product.name || '' })
    await expect(wishlistItem).toBeVisible({ timeout: 15_000 })

    expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
  } finally {
    await cleanupWishlistByProduct(page.request, buyerSession.token, Number(product.id)).catch(() => {})
  }
})
