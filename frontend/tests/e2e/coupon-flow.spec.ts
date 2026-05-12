import { expect, test, type Page } from '@playwright/test'
import {
  authedGet,
  authedPost,
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

async function getFirstCouponId(page: Page) {
  const response = await page.request.get('/api/coupons')
  expect(response.ok()).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const coupons = Array.isArray(payload?.data) ? payload.data : []
  expect(coupons.length).toBeGreaterThan(0)
  return Number(coupons[0].id)
}

async function expectLoginRedirect(page: Page) {
  await expect(page.getByText('请先登录')).toBeVisible({ timeout: 10_000 })
  await page.waitForURL(/\/login/)
  await expect(page.getByTestId('login-form')).toBeVisible()
}

test('四个优惠券入口未登录时统一中文提示并引导登录', async ({ page }) => {
  const couponId = await getFirstCouponId(page)

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await page.getByTestId(`home-quick-coupon-claim-${couponId}`).click()
  await expectLoginRedirect(page)

  await page.goto('/promotions')
  await expect(page.getByTestId('promotions-view')).toBeVisible()
  await page.getByTestId(`promotions-claim-${couponId}`).click()
  await expectLoginRedirect(page)

  await page.goto(`/promotion/${couponId}`)
  await expect(page.getByTestId('promotion-detail-view')).toBeVisible()
  await page.getByTestId('promotion-featured-claim').click()
  await expectLoginRedirect(page)

  await page.goto(`/coupon/${couponId}`)
  await expect(page.getByTestId('coupon-detail-view')).toBeVisible()
  await page.getByTestId('coupon-detail-claim').click()
  await expectLoginRedirect(page)
})

test('已登录领取优惠券后列表与详情按服务端状态刷新', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)

  const beforeResponse = await page.request.get('/api/coupons')
  expect(beforeResponse.ok()).toBeTruthy()
  const beforePayload = await beforeResponse.json()
  const beforeCoupons = Array.isArray(beforePayload?.data) ? beforePayload.data : []
  const targetCoupon = beforeCoupons.find((item: any) =>
    Number(item.remaining || 0) > 0
  )

  expect(targetCoupon, '当前系统没有可领取优惠券，无法执行领取刷新验证').toBeTruthy()
  const couponId = Number(targetCoupon.id)

  const resetResponse = await authedPost(page.request, adminSession.token, '/api/coupons/admin/reset-user-coupon', {
    userId: Number((buyerSession.user as { id?: number }).id || 0),
    couponId
  })
  expect(resetResponse.ok()).toBeTruthy()
  const resetPayload = await resetResponse.json()
  expect(resetPayload?.code).toBe(200)

  await logout(page)
  await login(page, E2E_USERS.buyer, E2E_PASSWORD)

  await page.goto(`/coupon/${couponId}`)
  await expect(page.getByTestId('coupon-detail-view')).toBeVisible()

  const claimResponsePromise = page.waitForResponse((response) =>
    response.url().includes(`/api/coupons/${couponId}/claim`) &&
    response.request().method() === 'POST'
  )
  await page.getByTestId('coupon-detail-claim').click()
  const claimResponse = await claimResponsePromise
  expect(claimResponse.ok()).toBeTruthy()
  await expect(page.getByText('领取成功')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('coupon-detail-claim')).toBeDisabled({ timeout: 15_000 })

  await page.goto('/promotions')
  await expect(page.getByTestId('promotions-view')).toBeVisible()
  await expect(page.getByTestId(`promotions-claim-${couponId}`)).toBeDisabled({ timeout: 15_000 })
})
