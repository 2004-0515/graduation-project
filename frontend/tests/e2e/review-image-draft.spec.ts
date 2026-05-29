import { expect, test } from '@playwright/test'
import path from 'node:path'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

test('选择评价图片只生成本地预览，不会自动上传或提交评价', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const imagePath = path.resolve(process.cwd(), '..', 'uploads', 'screenshots', 'test-case-login.png')

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/orders?status=3')
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await neutralizeFloatingUi(page)

  const reviewButton = page.getByRole('button', { name: '去评价' }).first()
  await expect(reviewButton).toBeVisible({ timeout: 15_000 })
  await reviewButton.click()

  await expect(page.getByText('发表评价')).toBeVisible()
  await page.locator('.review-dialog textarea').fill('你好')

  let imageUploadRequests = 0
  let reviewSubmitRequests = 0
  page.on('request', (request) => {
    const url = request.url()
    if (request.method() === 'POST' && url.includes('/api/files/review')) {
      imageUploadRequests += 1
    }
    if (request.method() === 'POST' && url.includes('/api/reviews')) {
      reviewSubmitRequests += 1
    }
  })

  await page.locator('.review-upload input[type="file"]').setInputFiles(imagePath)
  await expect(page.locator('.review-image-card img')).toBeVisible()
  await page.waitForTimeout(1_000)

  expect(imageUploadRequests).toBe(0)
  expect(reviewSubmitRequests).toBe(0)
  await expect(page.getByText('评价提交成功')).toHaveCount(0)
  await expect(page.getByTestId('review-submit')).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
