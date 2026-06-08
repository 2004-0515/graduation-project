import { expect, test, type Page } from '@playwright/test'
import {
  confirmMessageBox,
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  authedGet,
  authedPost,
  getSession,
  login,
  logout,
  neutralizeFloatingUi,
  resolveProductId
} from './helpers/session'

async function clearWishlist(page: Page, token: string) {
  const response = await authedGet(page.request, token, '/api/rational-consumption/wishlist')
  expect(response.ok(), `获取心愿单失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const items = Array.isArray(payload?.data) ? payload.data : []

  for (const item of items) {
    if (item?.id) {
      await authedDelete(page.request, token, `/api/rational-consumption/wishlist/${Number(item.id)}`)
    }
  }
}

test.describe.configure({ mode: 'serial' })

test('用户可在理性消费页设置预算并刷新预算展示', async ({ page }) => {
  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/rational-consumption')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('rational-consumption-view')).toBeVisible()

  await page.getByTestId('rational-budget-edit').click()
  const budgetDialog = page.getByRole('dialog', { name: '设置月度预算' })
  await expect(budgetDialog).toBeVisible()

  const budgetInput = budgetDialog.locator('.el-input-number input').first()
  await budgetInput.fill('')
  await budgetInput.fill('4321')

  const saveResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/rational-consumption/budget')
  )

  await budgetDialog.getByTestId('rational-budget-save').click()
  const saveResponse = await saveResponsePromise
  expect(saveResponse.ok(), `保存预算失败: ${saveResponse.status()} ${saveResponse.url()}`).toBeTruthy()

  await expect(page.getByText('预算设置成功')).toBeVisible({ timeout: 15_000 })
  await expect(budgetDialog).toBeHidden({ timeout: 10_000 })
  await expect(page.locator('.budget-amount .total')).toContainText('¥4321.00')

  await logout(page)
})

test('用户可在理性消费页移除心愿单项并刷新列表', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const productId = await resolveProductId(page, 'rational-wishlist', { excludeSellerUsername: E2E_USERS.buyer })
  const uniqueReason = `E2E心愿单-${Date.now()}`

  await clearWishlist(page, buyerSession.token)

  const createResponse = await authedPost(page.request, buyerSession.token, '/api/rational-consumption/wishlist', {
    productId,
    coolingDays: 3,
    reason: uniqueReason
  })
  expect(createResponse.ok(), `创建心愿单失败: ${createResponse.status()} ${createResponse.url()}`).toBeTruthy()
  const createPayload = await createResponse.json()
  expect(createPayload?.code).toBe(200)

  const wishlistResponse = await authedGet(page.request, buyerSession.token, '/api/rational-consumption/wishlist')
  expect(wishlistResponse.ok()).toBeTruthy()
  const wishlistPayload = await wishlistResponse.json()
  expect(wishlistPayload?.code).toBe(200)
  const items = Array.isArray(wishlistPayload?.data) ? wishlistPayload.data : []
  const createdItem = items.find((item: any) => item.reason === uniqueReason)
  expect(createdItem, '未找到刚创建的心愿单项').toBeTruthy()
  const createdItemId = Number(createdItem.id)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/rational-consumption?tab=wishlist')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('rational-consumption-view')).toBeVisible()

  const wishlistItem = page.getByTestId(`wishlist-item-${createdItemId}`)
  await expect(wishlistItem).toBeVisible({ timeout: 15_000 })
  await expect(wishlistItem).toContainText(uniqueReason)

  await page.getByTestId(`wishlist-remove-${createdItemId}`).click()

  const deleteResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'DELETE' &&
    response.url().includes(`/api/rational-consumption/wishlist/${createdItemId}`)
  )

  await confirmMessageBox(page)
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.ok(), `移除心愿单失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()

  await expect(page.getByText('已移除')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId(`wishlist-item-${createdItemId}`)).toHaveCount(0)

  await logout(page)
  await clearWishlist(page, buyerSession.token)
})
