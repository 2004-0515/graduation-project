import { expect, test } from '@playwright/test'
import { attachPageWatchers, expectNoBlockingBrowserIssues, neutralizeFloatingUi } from './helpers/session'

test('帮助中心与服务条款路由可达', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/help')
  await neutralizeFloatingUi(page)
  await expect(page.getByRole('heading', { name: '帮助中心' })).toBeVisible()
  await expect(page.getByText('常见问题解答，帮助您更好地使用紫苑风鸢')).toBeVisible()

  await page.getByText('订单相关').click()
  await expect(page.getByText('如何查看我的订单？')).toBeVisible()
  await page.getByText('如何查看我的订单？').click()
  await expect(page.getByText('登录后，点击右上角头像进入个人中心')).toBeVisible()

  await page.goto('/terms')
  await neutralizeFloatingUi(page)
  await expect(page.getByRole('heading', { name: '服务条款' })).toBeVisible()
  await expect(page.getByText('最后更新：2026年5月23日')).toBeVisible()
  await expect(page.getByRole('heading', { name: '1. 服务协议的确认' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '10. 条款修改' })).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
