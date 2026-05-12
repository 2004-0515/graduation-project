import { expect, test, type Page } from '@playwright/test'
import {
  authedPost,
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

async function resolveCategoryId(page: Page) {
  const response = await page.request.get('/api/categories')
  expect(response.ok(), `获取分类失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const categories = Array.isArray(payload?.data) ? payload.data : []
  expect(categories.length, '真实环境中至少需要一个分类供商品提交流程使用').toBeGreaterThan(0)
  return Number(categories[0].id)
}

test('管理员可审核通过卖家商品并从后台删除', async ({ page }) => {
  const categoryId = await resolveCategoryId(page)
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const uniqueName = `E2E-ADMIN-PRODUCT-${Date.now()}`

  const submitResponse = await authedPost(page.request, sellerSession.token, '/api/products/submit', {
    name: uniqueName,
    description: 'real-browser-product-review',
    price: '88.00',
    stock: 5,
    categoryId
  })
  expect(submitResponse.ok(), `提交商品失败: ${submitResponse.status()} ${submitResponse.url()}`).toBeTruthy()

  const submitPayload = await submitResponse.json()
  expect(submitPayload?.code).toBe(200)
  expect(submitPayload?.message).toContain('等待管理员审核')

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await page.goto('/admin/products?tab=pending')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('admin-products-view')).toBeVisible()

  const searchInput = page.getByPlaceholder('搜索商品名称')
  await searchInput.fill(uniqueName)
  await searchInput.press('Enter')

  let pendingRow = page.locator('.el-table__row', { hasText: uniqueName }).first()
  await expect(pendingRow).toBeVisible({ timeout: 15_000 })
  await expect(pendingRow).toContainText('待审核')

  await pendingRow.getByRole('button', { name: '通过' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('审核通过')).toBeVisible()
  await expect(page.locator('.el-table__row', { hasText: uniqueName })).toHaveCount(0)

  await page.goto('/admin/products')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('admin-products-view')).toBeVisible()

  await searchInput.fill(uniqueName)
  await searchInput.press('Enter')

  const approvedRow = page.locator('.el-table__row', { hasText: uniqueName }).first()
  await expect(approvedRow).toBeVisible({ timeout: 15_000 })
  await approvedRow.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('删除成功')).toBeVisible()
  await expect(page.locator('.el-table__row', { hasText: uniqueName })).toHaveCount(0)

  await logout(page)
})
