import { expect, test } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERS, login, neutralizeFloatingUi } from './helpers/session'

test('账户与设置链路冒烟', async ({ page }) => {
  await login(page, E2E_USERS.buyer, E2E_PASSWORD)

  await page.goto('/profile')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('profile-view')).toBeVisible()
  await expect(page.getByTestId('profile-quick-actions')).toBeVisible()

  await page.goto('/settings')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('settings-view')).toBeVisible()

  await page.getByTestId('settings-nav-security').click()
  await expect(page.getByTestId('settings-section-security')).toBeVisible()

  await page.getByTestId('settings-nav-notification').click()
  await expect(page.getByTestId('settings-section-notification')).toBeVisible()

  await page.getByTestId('settings-nav-privacy').click()
  await expect(page.getByTestId('settings-section-privacy')).toBeVisible()

  await page.getByTestId('settings-nav-account').click()
  await expect(page.getByTestId('settings-section-account')).toBeVisible()
  await neutralizeFloatingUi(page)
  await page.getByTestId('settings-logout').evaluate((element: HTMLButtonElement) => {
    element.click()
  })
  await page.getByRole('button', { name: '确定' }).click()
  await page.waitForURL(/\/$/)
  await expect(page.getByTestId('home-view')).toBeVisible()
})
