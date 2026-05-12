import { expect, test } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERS, login, neutralizeFloatingUi } from './helpers/session'

async function returnToProfile(page: import('@playwright/test').Page) {
  await page.goBack()
  await page.waitForURL(/\/profile$/)
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('profile-view')).toBeVisible()
}

test('个人中心快捷入口能跳转到真实目标页面', async ({ page }) => {
  await login(page, E2E_USERS.buyer, E2E_PASSWORD)

  await page.goto('/profile')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('profile-view')).toBeVisible()

  await page.getByTestId('profile-quick-action-pending-payment').click()
  await page.waitForURL(/\/orders\?status=0$/)
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await returnToProfile(page)

  await page.getByTestId('profile-quick-action-pending-shipment').click()
  await page.waitForURL(/\/orders\?status=1$/)
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await returnToProfile(page)

  await page.getByTestId('profile-quick-action-pending-receive').click()
  await page.waitForURL(/\/orders\?status=2$/)
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await returnToProfile(page)

  await page.getByTestId('profile-quick-action-cart').click()
  await page.waitForURL(/\/cart$/)
  await expect(page.getByTestId('cart-view')).toBeVisible()
  await returnToProfile(page)

  await page.getByTestId('profile-quick-action-price-alerts').click()
  await page.waitForURL(/\/price-alerts$/)
  await expect(page.getByTestId('price-alerts-view')).toBeVisible()
})
