import { expect, test } from '@playwright/test'
import { attachPageWatchers, expectNoBlockingBrowserIssues, neutralizeFloatingUi } from './helpers/session'

test('公开页面关键路由可达', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/login')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('login-form')).toBeVisible()
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()

  await page.goto('/register')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('register-form')).toBeVisible()
  await expect(page.getByRole('heading', { name: '创建账号' })).toBeVisible()

  await page.goto('/contact')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('contact-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: '联系客服' })).toBeVisible()

  await page.goto('/help')
  await neutralizeFloatingUi(page)
  await expect(page.getByRole('heading', { name: '帮助中心' })).toBeVisible()

  await page.goto('/terms')
  await neutralizeFloatingUi(page)
  await expect(page.getByRole('heading', { name: '服务条款' })).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
