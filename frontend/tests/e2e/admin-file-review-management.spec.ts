import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

test('管理员可审核通过头像文件并删除审核记录', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const uniqueFilename = `e2e-avatar-${Date.now()}.jpg`
  const imagePath = join(process.cwd(), 'public', 'external-cache', 'login-bg.jpg')
  const imageBuffer = readFileSync(imagePath)

  const uploadResponse = await page.request.post('/api/files/avatar', {
    headers: {
      Authorization: `Bearer ${buyerSession.token}`
    },
    multipart: {
      file: {
        name: uniqueFilename,
        mimeType: 'image/jpeg',
        buffer: imageBuffer
      }
    }
  })
  expect(uploadResponse.ok(), `上传头像失败: ${uploadResponse.status()} ${uploadResponse.url()}`).toBeTruthy()

  const uploadPayload = await uploadResponse.json()
  expect(uploadPayload?.code).toBe(200)
  expect(uploadPayload?.message).toContain('等待管理员审核')

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await page.goto('/admin/files')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('admin-files-view')).toBeVisible()

  let fileCard = page.locator('.file-card', { hasText: uniqueFilename }).first()
  await expect(fileCard).toBeVisible({ timeout: 15_000 })
  await expect(fileCard).toContainText('待审核')

  await fileCard.getByRole('button', { name: '通过' }).click()
  await expect(page.getByText('审核通过', { exact: true })).toBeVisible()

  fileCard = page.locator('.file-card', { hasText: uniqueFilename }).first()
  await expect(fileCard).toContainText('已通过')

  await fileCard.getByRole('button', { name: '删除记录' }).click()
  await page.getByRole('button', { name: '确定删除' }).click()
  await expect(page.getByText('删除成功', { exact: true })).toBeVisible()
  await expect(page.locator('.file-card', { hasText: uniqueFilename })).toHaveCount(0)

  await logout(page)
})
