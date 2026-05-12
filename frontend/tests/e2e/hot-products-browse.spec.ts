import { expect, test, type Page } from '@playwright/test'
import { attachPageWatchers, expectNoBlockingBrowserIssues, neutralizeFloatingUi } from './helpers/session'

type HotProduct = {
  id: number
  sales: number
}

async function resolveTopSellingProduct(page: Page): Promise<HotProduct> {
  const response = await page.request.get('/api/products?page=0&size=20&sort=sales')
  expect(response.ok(), `获取热销商品列表失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)

  const data = payload?.data
  const rawProducts = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.records)
        ? data.records
        : []

  const products = rawProducts
    .map((item: any) => ({
      id: Number(item?.id || 0),
      sales: Number(item?.sales || 0)
    }))
    .filter((item: HotProduct) => item.id > 0)
    .sort((a: HotProduct, b: HotProduct) => b.sales - a.sales)

  expect(products.length, '真实环境中至少需要一个热销商品').toBeGreaterThan(0)
  return products[0]
}

test('匿名用户可在热销榜查看榜单并进入商品详情', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const topProduct = await resolveTopSellingProduct(page)

  await page.goto('/hot')
  await neutralizeFloatingUi(page)

  await expect(page.getByTestId('hot-products-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: '热销排行榜' })).toBeVisible()
  await expect(page.getByTestId('hot-rank-list')).toBeVisible()
  await expect(page.getByTestId(`hot-rank-item-${topProduct.id}`)).toBeVisible({ timeout: 15_000 })

  if (await page.getByTestId('hot-top3').isVisible().catch(() => false)) {
    await expect(page.getByTestId('hot-top-card-1')).toBeVisible()
  }

  await page.getByTestId(`hot-rank-item-${topProduct.id}`).click()
  await page.waitForURL(new RegExp(`/product/${topProduct.id}$`))
  await expect(page.getByTestId('product-detail-view')).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
