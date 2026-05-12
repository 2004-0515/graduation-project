import { expect, test } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  authedPost,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

async function sendNotification(page: import('@playwright/test').Page, token: string, userId: number, title: string, message: string) {
  const response = await authedPost(page.request, token, '/api/notifications/admin/send', {
    userId,
    type: 'system',
    title,
    message
  })
  expect(response.ok(), `发送通知失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

test('用户可在通知页完成全部已读、单条删除和清空', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
  expect(buyerUserId).toBeGreaterThan(0)

  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')

  const markReadTitle = `E2E-NOTIFY-READ-${Date.now()}`
  const deleteTitle = `E2E-NOTIFY-DELETE-${Date.now()}`
  const clearTitle = `E2E-NOTIFY-CLEAR-${Date.now()}`

  await sendNotification(page, adminSession.token, buyerUserId, markReadTitle, '用于验证全部已读')
  await sendNotification(page, adminSession.token, buyerUserId, deleteTitle, '用于验证单条删除')

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/notifications')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('notifications-view')).toBeVisible()

  await expect(page.locator('.notification-item.unread')).toHaveCount(2, { timeout: 15_000 })
  await expect(page.locator('.stat-card').filter({ hasText: '未读消息' })).toContainText('2')

  const markAllResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'PUT' &&
    response.url().includes('/api/notifications/read-all')
  )
  await page.getByTestId('notifications-mark-all-read').click()
  const markAllResponse = await markAllResponsePromise
  expect(markAllResponse.ok(), `全部已读失败: ${markAllResponse.status()} ${markAllResponse.url()}`).toBeTruthy()
  await expect(page.getByText('已全部标记为已读')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.notification-item.unread')).toHaveCount(0)

  await sendNotification(page, adminSession.token, buyerUserId, clearTitle, '用于验证清空功能')
  await page.reload()
  await neutralizeFloatingUi(page)

  const deleteRow = page.locator('.notification-item', { hasText: deleteTitle }).first()
  await expect(deleteRow).toBeVisible({ timeout: 15_000 })
  const deleteResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'DELETE' &&
    /\/api\/notifications\/\d+$/.test(response.url())
  )
  await deleteRow.locator('.delete-btn').click()
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.ok(), `删除通知失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
  await expect(page.getByText('已删除')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.notification-item', { hasText: deleteTitle })).toHaveCount(0)

  const clearResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'DELETE' &&
    response.url().includes('/api/notifications/clear')
  )
  await page.getByTestId('notifications-clear-all').click()
  const confirmDialog = page.locator('.el-overlay-message-box, .el-message-box__wrapper').filter({ has: page.locator('.el-message-box') }).last()
  await expect(confirmDialog).toBeVisible({ timeout: 10_000 })
  await confirmDialog.getByRole('button', { name: '确定' }).press('Enter')
  const clearResponse = await clearResponsePromise
  expect(clearResponse.ok(), `清空通知失败: ${clearResponse.status()} ${clearResponse.url()}`).toBeTruthy()
  await expect(page.getByText('已清空所有通知')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('暂无通知')).toBeVisible({ timeout: 15_000 })

  await logout(page)
  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')
})
