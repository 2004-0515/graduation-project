import { expect, test } from '@playwright/test'
import {
  confirmMessageBox,
  E2E_PASSWORD,
  E2E_USERS,
  authedPost,
  getSession,
  openAdminPage,
  logout
} from './helpers/session'

const ACHIEVEMENT_TYPE = 'BUDGET_MASTER'
const ACHIEVEMENT_NAME = '预算大师'

test('管理员可在理性消费后台授予并撤销成就', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
  expect(buyerUserId).toBeGreaterThan(0)

  await authedPost(page.request, adminSession.token, '/api/rational-consumption/admin/revoke-achievement', {
    userId: buyerUserId,
    type: ACHIEVEMENT_TYPE
  }).catch(() => {})

  await openAdminPage(page, '/admin/rational', { testId: 'admin-rational-view' })

  await page.getByRole('button', { name: '成就管理' }).click()

  const userIdInput = page.locator('.grant-form .el-input-number input').first()
  await userIdInput.fill('')
  await userIdInput.fill(String(buyerUserId))
  await page.getByTestId('admin-achievement-type').click()
  await page.locator('.el-select-dropdown__item').filter({ hasText: ACHIEVEMENT_NAME }).first().click()

  const grantResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/rational-consumption/admin/grant-achievement')
  )

  await page.getByTestId('admin-achievement-grant').click()
  const grantResponse = await grantResponsePromise
  expect(grantResponse.ok(), `授予成就失败: ${grantResponse.status()} ${grantResponse.url()}`).toBeTruthy()
  await expect(page.getByText('成就授予成功')).toBeVisible({ timeout: 15_000 })

  const achievementRow = page.locator('.achievement-item', {
    has: page.getByText(ACHIEVEMENT_NAME, { exact: true })
  }).filter({ hasText: E2E_USERS.buyer }).first()
  await expect(achievementRow).toBeVisible({ timeout: 15_000 })

  const revokeResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/rational-consumption/admin/revoke-achievement')
  )

  await achievementRow.getByRole('button', { name: '撤销' }).click()
  await confirmMessageBox(page)
  const revokeResponse = await revokeResponsePromise
  expect(revokeResponse.ok(), `撤销成就失败: ${revokeResponse.status()} ${revokeResponse.url()}`).toBeTruthy()
  await expect(page.getByText('成就已撤销')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.achievement-item', {
    has: page.getByText(ACHIEVEMENT_NAME, { exact: true })
  }).filter({ hasText: E2E_USERS.buyer })).toHaveCount(0)

  await logout(page)
})
