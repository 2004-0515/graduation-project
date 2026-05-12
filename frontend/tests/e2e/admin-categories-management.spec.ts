import { expect, test } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

test('管理员可创建并删除分类', async ({ page }) => {
  await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E分类${Date.now()}`
  const uniqueDescription = `后台分类说明-${Date.now()}`

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await page.goto('/admin/categories')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('admin-categories-view')).toBeVisible()

  await page.getByTestId('admin-category-add').click()
  const dialog = page.getByRole('dialog', { name: '添加分类' })
  await expect(dialog).toBeVisible()

  await page.getByPlaceholder('请输入分类名称').fill(uniqueName)
  await page.getByPlaceholder('请输入分类描述').fill(uniqueDescription)

  const createResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/categories')
  )

  await page.getByTestId('admin-category-save').click()
  const createResponse = await createResponsePromise
  expect(createResponse.ok(), `创建分类失败: ${createResponse.status()} ${createResponse.url()}`).toBeTruthy()
  await expect(page.getByText('分类创建成功').or(page.getByText('分类添加成功'))).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toBeHidden({ timeout: 10_000 })

  const createdRow = page.locator('.el-table__row', { hasText: uniqueName }).first()
  await expect(createdRow).toBeVisible({ timeout: 15_000 })
  await expect(createdRow).toContainText(uniqueDescription)

  await createdRow.getByRole('button', { name: '删除' }).click()
  const confirmDialog = page.locator('.el-overlay-message-box, .el-message-box__wrapper').filter({ has: page.locator('.el-message-box') }).last()
  await expect(confirmDialog).toBeVisible({ timeout: 10_000 })

  const deleteResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'DELETE' &&
    response.url().includes('/api/categories/')
  )

  await confirmDialog.getByRole('button', { name: '确定' }).press('Enter')
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.ok(), `删除分类失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
  await expect(page.getByText('分类删除成功').or(page.getByText('删除成功'))).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.el-table__row', { hasText: uniqueName })).toHaveCount(0)

  await logout(page)
})
