import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  attachPageWatchers,
  authedDelete,
  expectNoBlockingBrowserIssues,
  getSession,
  login,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function cleanupAlert(page: Page, token: string, productId: number) {
  await authedDelete(page.request, token, `/api/price/alert/${productId}`).catch(() => null)
  await authedDelete(page.request, token, `/api/price/alert/${productId}/record`).catch(() => null)
}

test('用户可从商品详情页设置降价提醒并在提醒页看到真实记录', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const product = await resolveProduct(page, 'product-detail-price-alert', {
    explicitId: E2E_PRODUCTS.priceAlert,
    excludeSellerUsername: E2E_USERS.buyer
  })
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const productId = Number(product.id)
  const currentPrice = Number(product.price || 0)
  expect(currentPrice).toBeGreaterThan(1)
  const targetPrice = Math.max(0.01, Number((currentPrice - 1).toFixed(2)))

  await cleanupAlert(page, buyerSession.token, productId)

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto(`/product/${productId}`)
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('product-detail-view')).toBeVisible()

    const createResponse = page.waitForResponse((response) =>
      response.url().includes('/api/price/alert') &&
      response.request().method() === 'POST'
    )
    await page.getByTestId('product-price-alert-open').click()
    await page.getByTestId('product-price-alert-input').fill(String(targetPrice))
    await page.getByTestId('product-price-alert-confirm').click()
    await createResponse

    await expect(page.getByText('降价提醒设置成功')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(`已设提醒 ¥${targetPrice}`)).toBeVisible()

    await page.goto('/price-alerts')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('price-alerts-view')).toBeVisible()

    const alertRow = page.locator('[data-testid^="price-alert-item-"]', { hasText: product.name || '' })
    await expect(alertRow).toBeVisible({ timeout: 15_000 })
    await expect(alertRow).toContainText(`目标 ¥${targetPrice}`)

    expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
  } finally {
    await cleanupAlert(page, buyerSession.token, productId)
  }
})
