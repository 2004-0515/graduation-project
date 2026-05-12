import { expect, test } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

test('管理员可向指定用户发送通知，用户侧可收到并查看', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
  expect(buyerUserId).toBeGreaterThan(0)

  const uniqueTitle = `E2E-ADMIN-NOTICE-${Date.now()}`
  const uniqueMessage = `管理员定向通知-${Date.now()}`

  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await page.goto('/admin/notifications')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('admin-notifications-view')).toBeVisible()

  await page.getByText('指定用户').click()
  await page.getByTestId('notification-users-select').click()
  await page.locator('.el-select-dropdown__item').filter({ hasText: E2E_USERS.buyer }).first().click()

  await page.getByPlaceholder('请输入消息标题').fill(uniqueTitle)
  await page.getByPlaceholder('请输入消息内容').fill(uniqueMessage)
  await page.getByTestId('notification-send-button').click()
  await expect(page.getByText('消息已发送给 1 位用户')).toBeVisible({ timeout: 15_000 })

  await logout(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/notifications')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('notifications-view')).toBeVisible()

  const notificationCard = page.locator('.notification-item', { hasText: uniqueTitle }).first()
  await expect(notificationCard).toBeVisible({ timeout: 15_000 })
  await expect(notificationCard).toContainText(uniqueMessage)
  await notificationCard.click()

  await expect(page.getByRole('dialog')).toContainText(uniqueTitle)
  await expect(page.getByRole('dialog')).toContainText(uniqueMessage)

  await logout(page)

  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')
})
