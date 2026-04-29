import { expect, test } from '@playwright/test'

const username = process.env.E2E_USERNAME || 'zhangsan'
const password = process.env.E2E_PASSWORD || '123456'

test('普通用户主链路冒烟', async ({ page }) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()
    if (status >= 400 && !url.includes('/favicon.ico')) {
      failedRequests.push(`${status} ${url}`)
    }
  })

  await page.goto('/')
  await expect(page.getByTestId('global-music-player')).toBeVisible()
  await expect(page.getByTestId('home-view')).toBeVisible()

  await page.goto('/login')
  await expect(page.getByTestId('login-form')).toBeVisible()

  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)

  const captchaCode = await page.getByAltText('验证码').getAttribute('data-captcha-code')
  expect(captchaCode).toBeTruthy()
  await page.getByPlaceholder('请输入验证码').fill(captchaCode!)
  await page.getByRole('button', { name: '登录' }).click()

  await page.waitForURL(/\/$/)
  await expect(page.getByTestId('home-view')).toBeVisible()

  const viewDetailButtons = page.getByRole('button', { name: '查看详情' })
  await expect(viewDetailButtons.first()).toBeVisible()
  await viewDetailButtons.first().click()

  await page.waitForURL(/\/product\/\d+/)
  await expect(page.getByTestId('product-detail-view')).toBeVisible()
  await expect(page.getByTestId('global-music-player')).toBeVisible()

  const buyNowButton = page.getByTestId('product-buy-now')
  await expect(buyNowButton).toBeVisible()
  await buyNowButton.click()

  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible()
  await expect(page.getByTestId('checkout-submit')).toBeVisible()

  await page.goto('/orders')
  await expect(page.getByTestId('orders-view')).toBeVisible()

  const blockingResponses = failedRequests.filter((entry) => {
    if (entry.includes('/api/notifications/unread/count') && entry.startsWith('401 ')) {
      return false
    }
    return true
  })

  expect(blockingResponses, `Unexpected failing requests:\n${blockingResponses.join('\n')}`).toEqual([])
  expect(consoleErrors, `Unexpected console errors:\n${consoleErrors.join('\n')}`).toEqual([])
})
