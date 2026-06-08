import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues
} from './helpers/session'

async function fillFieldByTestId(page: Page, testId: string, value: string) {
  const field = page
    .locator(
      [
        `[data-testid="${testId}"] input`,
        `[data-testid="${testId}"] textarea`,
        `input[data-testid="${testId}"]`,
        `textarea[data-testid="${testId}"]`
      ].join(', ')
    )
    .first()
  await expect(field, `${testId} 输入框未渲染`).toBeVisible({ timeout: 15_000 })
  await field.fill(value)
}

async function submitLoginForm(page: Page, username: string, password: string) {
  await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 15_000 })
  await fillFieldByTestId(page, 'login-username', username)
  await fillFieldByTestId(page, 'login-password', password)
  const captcha = await page.getByTestId('login-captcha-image').getAttribute('data-captcha-code')
  expect(captcha, 'E2E 登录验证码未暴露').toBeTruthy()
  await fillFieldByTestId(page, 'login-captcha', captcha!)
  await page.getByTestId('login-submit').click()
}

test('登录拦截保留用户原始目标页', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/orders')
  await expect(page).toHaveURL(/\/login\?redirect=\/orders/)
  await submitLoginForm(page, E2E_USERS.buyer, E2E_PASSWORD)

  await expect(page).toHaveURL(/\/orders(?:\?|$)/, { timeout: 15_000 })
  await expect(page.getByTestId('orders-view')).toBeVisible({ timeout: 15_000 })
  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})

test('主动退出后的登录忽略旧页面 redirect 并按角色进入默认页', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.goto('/login?redirect=/admin/music&loggedOut=1')
  await submitLoginForm(page, E2E_USERS.admin, E2E_PASSWORD)

  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: '数据概览' })).toBeVisible({ timeout: 15_000 })
  await expect(page).not.toHaveURL(/\/admin\/music/)
  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
