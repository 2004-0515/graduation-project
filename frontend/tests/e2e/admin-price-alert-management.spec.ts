import { expect, test, type Locator } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  authedGet,
  authedPost,
  getSession,
  login,
  logout,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function findAlertRow(page: import('@playwright/test').Page, keyword: string): Promise<Locator> {
  const row = page.locator('.el-table__row', { hasText: keyword }).first()
  await expect(row).toBeVisible({ timeout: 15_000 })
  return row
}

test('管理员可在价格管理页触发、回退并删除降价提醒', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
  expect(buyerUserId).toBeGreaterThan(0)

  const targetProduct = await resolveProduct(page, 'adminPriceManageAlert', {
    excludeSellerUsername: E2E_USERS.buyer
  })
  const productId = Number(targetProduct.id)
  expect(productId).toBeGreaterThan(0)

  await authedDelete(page.request, buyerSession.token, `/api/price/alert/${productId}/record`).catch(() => {})

  const createResponse = await authedPost(page.request, buyerSession.token, '/api/price/alert', {
    productId,
    targetPrice: Math.max(0.01, Number((Number(targetProduct.price || 0) - 1).toFixed(2)))
  })
  expect(createResponse.ok()).toBeTruthy()
  const createPayload = await createResponse.json()
  expect(createPayload?.code).toBe(200)

  const alertsResponse = await authedGet(page.request, buyerSession.token, '/api/price/alerts/detail')
  expect(alertsResponse.ok()).toBeTruthy()
  const alertsPayload = await alertsResponse.json()
  const alerts = Array.isArray(alertsPayload?.data) ? alertsPayload.data : []
  const createdAlert = alerts.find((item: { productId?: number; status?: number }) =>
    Number(item.productId) === productId && Number(item.status) === 0
  )
  expect(createdAlert, `未找到商品 ${productId} 的新建提醒`).toBeTruthy()
  const alertId = Number(createdAlert?.id || 0)
  expect(alertId).toBeGreaterThan(0)

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await page.goto('/admin/price')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('admin-price-view')).toBeVisible()

  await page.getByText('降价提醒').click()
  await expect(page.locator('.el-table')).toBeVisible()

  await page.getByPlaceholder('搜索用户名/商品名').fill(E2E_USERS.buyer)
  await page.getByRole('button', { name: '搜索' }).click()

  const rowKeyword = String(targetProduct.name || `商品${productId}`)
  let alertRow = await findAlertRow(page, rowKeyword)
  await expect(alertRow).toContainText(E2E_USERS.buyer)
  await expect(alertRow).toContainText('监控中')

  await alertRow.getByRole('button', { name: '手动触发' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('已触发并发送通知')).toBeVisible()

  alertRow = await findAlertRow(page, rowKeyword)
  await expect(alertRow).toContainText('已触发')
  await expect(alertRow).toContainText('是')

  await alertRow.getByRole('button', { name: '回退触发' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('已回退到监控状态')).toBeVisible()

  alertRow = await findAlertRow(page, rowKeyword)
  await expect(alertRow).toContainText('监控中')
  await expect(alertRow).toContainText('否')

  await alertRow.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('删除成功')).toBeVisible()

  await expect(page.locator('.el-table__row', { hasText: rowKeyword }).filter({ hasText: E2E_USERS.buyer })).toHaveCount(0)

  await logout(page)
})
