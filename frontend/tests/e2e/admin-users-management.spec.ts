import { expect, test } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

test('管理员可搜索用户并禁用后再恢复', async ({ page }) => {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const sellerUserId = Number((sellerSession.user as { id?: number }).id || 0)
  expect(sellerUserId).toBeGreaterThan(0)

  const resetStatus = async (status: number) => {
    const response = await page.request.put(`/api/users/${sellerUserId}/status`, {
      headers: {
        Authorization: `Bearer ${adminSession.token}`
      },
      data: { status }
    })
    expect(response.ok(), `重置用户状态失败: ${response.status()} ${response.url()}`).toBeTruthy()
  }

  await resetStatus(1)

  try {
    await login(page, E2E_USERS.admin, E2E_PASSWORD)
    await page.goto('/admin')
    await neutralizeFloatingUi(page)
    await expect(page.getByRole('heading', { name: '数据概览' })).toBeVisible()
    await page.getByRole('link', { name: /用户管理/ }).click()
    await page.waitForURL(/\/admin\/users$/)
    await expect(page.getByTestId('admin-users-view')).toBeVisible()

    await page.getByPlaceholder('搜索用户名/邮箱').fill(E2E_USERS.seller)
    await page.getByRole('button', { name: '搜索' }).click()

    let userRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(userRow).toBeVisible({ timeout: 15_000 })
    await expect(userRow).toContainText('正常')

    const disableResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/users/${sellerUserId}/status`)
    )
    await userRow.getByRole('button', { name: '禁用' }).click()
    const confirmDialog = page.locator('.el-overlay-message-box, .el-message-box__wrapper').filter({ has: page.locator('.el-message-box') }).last()
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 })
    await confirmDialog.getByRole('button', { name: '确定' }).press('Enter')
    const disableResponse = await disableResponsePromise
    expect(disableResponse.ok(), `禁用用户失败: ${disableResponse.status()} ${disableResponse.url()}`).toBeTruthy()
    await expect(page.getByText('用户已禁用')).toBeVisible({ timeout: 15_000 })

    userRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(userRow).toContainText('禁用')
    await expect(userRow.getByRole('button', { name: '启用' })).toBeVisible()

    const enableResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/users/${sellerUserId}/status`)
    )
    await userRow.getByRole('button', { name: '启用' }).click()
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 })
    await confirmDialog.getByRole('button', { name: '确定' }).press('Enter')
    const enableResponse = await enableResponsePromise
    expect(enableResponse.ok(), `启用用户失败: ${enableResponse.status()} ${enableResponse.url()}`).toBeTruthy()
    await expect(page.getByText('用户已启用')).toBeVisible({ timeout: 15_000 })

    userRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(userRow).toContainText('正常')

    await logout(page)
  } finally {
    await resetStatus(1)
  }
})
