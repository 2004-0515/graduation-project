import { expect, test } from '@playwright/test'
import { attachPageWatchers, expectNoBlockingBrowserIssues, neutralizeFloatingUi } from './helpers/session'

test('页脚关键入口可跳转到对应页面', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('home-view')).toBeVisible()

  await page.getByRole('link', { name: '帮助中心' }).click()
  await expect(page.getByRole('heading', { name: '帮助中心' })).toBeVisible()

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await page.getByRole('link', { name: '联系客服' }).click()
  await expect(page.getByRole('heading', { name: '联系客服' })).toBeVisible()

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await page.getByRole('link', { name: '服务条款' }).click()
  await expect(page.getByRole('heading', { name: '服务条款' })).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
