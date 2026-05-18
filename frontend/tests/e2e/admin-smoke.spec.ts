import { expect, test } from '@playwright/test'
import {
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  openAdminPage
} from './helpers/session'

async function visitAdminPage(
  page: import('@playwright/test').Page,
  path: string,
  viewTestId: string
) {
  await page.goto(path)
  await expect(page.getByTestId(viewTestId)).toBeVisible()
}

test('管理后台关键页面广覆盖冒烟', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await openAdminPage(page, '/admin', { heading: '数据概览' })

  await visitAdminPage(page, '/admin/products', 'admin-products-view')
  await visitAdminPage(page, '/admin/categories', 'admin-categories-view')
  await visitAdminPage(page, '/admin/orders', 'admin-orders-view')
  await visitAdminPage(page, '/admin/users', 'admin-users-view')
  await visitAdminPage(page, '/admin/price', 'admin-price-view')
  await visitAdminPage(page, '/admin/files', 'admin-files-view')
  await visitAdminPage(page, '/admin/notifications', 'admin-notifications-view')
  await visitAdminPage(page, '/admin/music', 'admin-music-view')
  await visitAdminPage(page, '/admin/coupons', 'admin-coupons-view')
  await visitAdminPage(page, '/admin/contact-messages', 'admin-contact-messages-view')
  await visitAdminPage(page, '/admin/rational', 'admin-rational-view')

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
