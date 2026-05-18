import { expect, test, type Page } from '@playwright/test'
import {
  attachPageWatchers,
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

async function gotoAuthed(page: Page, path: string, testId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(path)
    await page.waitForLoadState('domcontentloaded')

    if (page.url().includes('/login')) {
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto(path)
      await page.waitForLoadState('domcontentloaded')
    }

    const pageRoot = page.getByTestId(testId)
    if (
      await pageRoot
        .waitFor({
          state: 'visible',
          timeout: 15_000
        })
        .then(() => true)
        .catch(() => false)
    ) {
      return
    }

    if (page.url().includes('/login')) {
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    }

    await page.waitForTimeout(1_000)
  }

  throw new Error(`无法稳定进入受保护页面: ${path}`)
}

test('用户端页面广覆盖冒烟', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)

  await page.goto('/')
  await expect(page.getByTestId('home-view')).toBeVisible()
  await expect(page.getByTestId('home-coupon-section')).toBeVisible()

  await page.goto(`/product/${E2E_PRODUCTS.smoke}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible()

  await gotoAuthed(page, '/notifications', 'notifications-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('notifications-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: '消息通知' })).toBeVisible()

  await gotoAuthed(page, '/promotions', 'promotions-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('promotions-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: '可领取优惠券' })).toBeVisible()

  await gotoAuthed(page, '/price-alerts', 'price-alerts-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('price-alerts-view')).toBeVisible()
  await expect(page.getByRole('heading', { name: '我的降价提醒' })).toBeVisible()

  await gotoAuthed(page, '/cart', 'cart-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('cart-view')).toBeVisible()
  const cartReady = await page.getByTestId('cart-selected-count').isVisible({ timeout: 5_000 }).catch(() => false)
  if (!cartReady) {
    await expect(page.getByTestId('cart-empty')).toBeVisible()
  }

  await gotoAuthed(page, '/orders', 'orders-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await expect(page.getByTestId('orders-search-input')).toBeVisible()

  await gotoAuthed(page, '/address', 'address-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('address-view')).toBeVisible()
  await expect(page.getByTestId('address-add')).toBeVisible()

  await gotoAuthed(page, '/profile', 'profile-view')
  await expect(page.getByTestId('profile-view')).toBeVisible()
  await expect(page.getByTestId('profile-member-stats')).toBeVisible()

  await gotoAuthed(page, '/settings', 'settings-view')
  await expect(page.getByTestId('settings-view')).toBeVisible()
  await page.getByTestId('settings-nav-notification').click()
  await expect(page.getByTestId('settings-section-notification')).toBeVisible()
  await page.getByTestId('settings-nav-privacy').click()
  await expect(page.getByTestId('settings-section-privacy')).toBeVisible()

  await gotoAuthed(page, '/rational-consumption', 'rational-consumption-view')
  await neutralizeFloatingUi(page)
  await expect(page.getByRole('heading', { name: '理性消费助手' })).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
