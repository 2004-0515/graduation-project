import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
  confirmMessageBox,
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  openAdminPage,
  logout
} from './helpers/session'

test('管理员可创建并删除分类', async ({ page }) => {
  await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E分类${Date.now()}`
  const uniqueDescription = `后台分类说明-${Date.now()}`
  const uploadImagePath = path.resolve(process.cwd(), 'public', 'external-cache', 'category-bg.jpg')

  await openAdminPage(page, '/admin/categories', { testId: 'admin-categories-view' })

  await page.getByTestId('admin-category-add').click()
  const dialog = page.getByRole('dialog', { name: '添加分类' })
  await expect(dialog).toBeVisible()

  await page.getByPlaceholder('请输入分类名称').fill(uniqueName)
  await page.getByPlaceholder('请输入分类描述').fill(uniqueDescription)
  const uploadResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/files/category')
  )
  await dialog.getByTestId('admin-category-icon-upload').locator('input[type="file"]').setInputFiles(uploadImagePath)
  const uploadResponse = await uploadResponsePromise
  expect(uploadResponse.ok(), `上传分类图标失败: ${uploadResponse.status()} ${uploadResponse.url()}`).toBeTruthy()
  await expect(dialog.getByTestId('admin-category-icon-preview')).toBeVisible({ timeout: 15_000 })

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

  await createdRow.getByRole('button', { name: '编辑' }).click()
  const editDialog = page.getByRole('dialog', { name: '编辑分类' })
  await expect(editDialog).toBeVisible({ timeout: 10_000 })
  await expect(editDialog.getByTestId('admin-category-icon-preview')).toBeVisible()
  await expect(editDialog.getByTestId('admin-category-icon-clear')).toBeVisible()
  await editDialog.getByTestId('admin-category-icon-clear').click()
  await expect(editDialog.getByTestId('admin-category-icon-preview')).toHaveCount(0)
  await editDialog.getByRole('button', { name: '取消' }).click()
  await expect(editDialog).toBeHidden({ timeout: 10_000 })

  await createdRow.getByRole('button', { name: '删除' }).click()
  const deleteResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'DELETE' &&
    response.url().includes('/api/categories/')
  )

  await confirmMessageBox(page)
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.ok(), `删除分类失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
  await expect(page.getByText('分类删除成功').or(page.getByText('删除成功'))).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.el-table__row', { hasText: uniqueName })).toHaveCount(0)

  await logout(page)
})
