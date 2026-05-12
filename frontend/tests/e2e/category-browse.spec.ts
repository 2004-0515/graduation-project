import { expect, test, type Page } from '@playwright/test'
import {
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  neutralizeFloatingUi
} from './helpers/session'

type CatalogProduct = {
  id: number
  name: string
  price: number
}

async function resolveCatalogProduct(page: Page): Promise<CatalogProduct> {
  const response = await page.request.get('/api/products?page=0&size=100')
  expect(response.ok(), `获取商品列表失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)

  const data = payload?.data
  const products = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : []

  const selected = products.find((item: any) =>
    Number(item?.id || 0) > 0 &&
    Number(item?.status ?? 0) === 1 &&
    Number(item?.stock ?? 0) > 0 &&
    typeof item?.name === 'string' &&
    item.name.trim().length > 0 &&
    Number(item?.price ?? 0) > 0
  )

  expect(selected, '真实环境中至少需要一个可浏览的上架商品').toBeTruthy()

  return {
    id: Number(selected.id),
    name: String(selected.name),
    price: Number(selected.price)
  }
}

test('匿名用户可在分类页完成搜索、筛选、排序并进入商品详情', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const product = await resolveCatalogProduct(page)
  const minPrice = Math.max(0, Number((product.price - 1).toFixed(2)))
  const maxPrice = Number((product.price + 1).toFixed(2))

  await page.goto(`/category?q=${encodeURIComponent(product.name)}`)
  await neutralizeFloatingUi(page)

  await expect(page.getByTestId('category-view')).toBeVisible()
  await expect(page.getByTestId('category-search-hint')).toContainText(product.name)

  const productCard = page.getByTestId(`category-product-${product.id}`)
  await expect(productCard).toBeVisible({ timeout: 15_000 })
  await expect(productCard).toContainText(product.name)

  await page.getByTestId('category-sort-price-desc').click()
  await expect(page.getByTestId('category-sort-price-desc')).toHaveClass(/active/)

  await page.getByTestId('category-min-price').fill(String(minPrice))
  await page.getByTestId('category-max-price').fill(String(maxPrice))
  await page.getByTestId('category-apply-price').click()
  await expect(productCard).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('category-clear-price').click()
  await expect(page.getByTestId('category-min-price')).toHaveValue('')
  await expect(page.getByTestId('category-max-price')).toHaveValue('')

  await page.getByTestId(`category-product-${product.id}`).click()
  await page.waitForURL(new RegExp(`/product/${product.id}$`))
  await expect(page.getByTestId('product-detail-view')).toBeVisible()

  await page.goBack()
  await page.waitForURL(/\/category\?q=/)
  await expect(page.getByTestId('category-view')).toBeVisible()

  await page.getByTestId('category-clear-search').click()
  await page.waitForURL(/\/category$/)
  await expect(page.getByTestId('category-search-hint')).toHaveCount(0)
  await expect(page.getByTestId('category-product-grid')).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
