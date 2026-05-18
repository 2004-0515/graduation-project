import { expect, test } from '@playwright/test'
import {
  attachPageWatchers,
  E2E_PASSWORD,
  E2E_USERS,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

async function openAdminDashboardWithRecovery(page: import('@playwright/test').Page) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto('/admin')
    await neutralizeFloatingUi(page)

    const dashboardVisible = await page
      .getByRole('heading', { name: '数据概览' })
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false)

    if (dashboardVisible) {
      return
    }

    if (page.url().includes('/login')) {
      await login(page, E2E_USERS.admin, E2E_PASSWORD)
      continue
    }
  }

  await expect(page.getByRole('heading', { name: '数据概览' })).toBeVisible()
}

test('路由守卫在真实浏览器中保持正确跳转语义', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/orders')
  await page.waitForLoadState('domcontentloaded')
  await expect(page).toHaveURL(/\/login\?redirect=\/orders/)
  await expect(page.getByTestId('login-form')).toBeVisible()

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/admin')
  await neutralizeFloatingUi(page)
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('home-view')).toBeVisible()
  await expect(page.getByText('我的商品')).toHaveCount(0)
  await expect(page.getByText('卖家发货')).toHaveCount(0)

  await page.goto('/my-products')
  await neutralizeFloatingUi(page)
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/seller-orders')
  await neutralizeFloatingUi(page)
  await expect(page).toHaveURL(/\/$/)

  await login(page, E2E_USERS.seller, E2E_PASSWORD)
  await page.goto('/my-products')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('my-products-view')).toBeVisible()
  await page.goto('/seller-orders')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('seller-orders-view')).toBeVisible()
  await page.goto('/admin')
  await neutralizeFloatingUi(page)
  await expect(page).toHaveURL(/\/$/)

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await openAdminDashboardWithRecovery(page)

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
