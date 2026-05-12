import { expect, test } from '@playwright/test'
import {
  attachPageWatchers,
  E2E_PASSWORD,
  E2E_USERS,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

async function navigateWithinAdmin(
  page: import('@playwright/test').Page,
  linkText: string,
  expectedUrl: RegExp,
  viewTestId: string
) {
  await page.getByRole('link', { name: new RegExp(linkText) }).click()
  await page.waitForURL(expectedUrl)
  await expect(page.getByTestId(viewTestId)).toBeVisible()
}

test('管理后台关键页面广覆盖冒烟', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await login(page, E2E_USERS.admin, E2E_PASSWORD)

  await page.goto('/admin')
  await neutralizeFloatingUi(page)
  await expect(page.getByRole('heading', { name: '数据概览' })).toBeVisible()

  await navigateWithinAdmin(page, '商品管理', /\/admin\/products$/, 'admin-products-view')
  await navigateWithinAdmin(page, '分类管理', /\/admin\/categories$/, 'admin-categories-view')
  await navigateWithinAdmin(page, '订单管理', /\/admin\/orders$/, 'admin-orders-view')
  await navigateWithinAdmin(page, '用户管理', /\/admin\/users$/, 'admin-users-view')
  await navigateWithinAdmin(page, '价格管理', /\/admin\/price$/, 'admin-price-view')
  await navigateWithinAdmin(page, '文件审核', /\/admin\/files$/, 'admin-files-view')
  await navigateWithinAdmin(page, '消息管理', /\/admin\/notifications$/, 'admin-notifications-view')
  await navigateWithinAdmin(page, '音乐管理', /\/admin\/music$/, 'admin-music-view')
  await navigateWithinAdmin(page, '促销管理', /\/admin\/coupons$/, 'admin-coupons-view')
  await navigateWithinAdmin(page, '留言管理', /\/admin\/contact-messages$/, 'admin-contact-messages-view')
  await navigateWithinAdmin(page, '理性消费', /\/admin\/rational$/, 'admin-rational-view')

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
