import { expect, test, type Page } from '@playwright/test'
import {
  authedDelete,
  authedPost,
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

function formatLocalDateTime(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

async function createActiveCoupon(page: Page) {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E-COUPON-FLOW-${Date.now()}`

  const createResponse = await authedPost(page.request, adminSession.token, '/api/coupons/admin', {
    name: uniqueName,
    type: 1,
    discountAmount: 15,
    minAmount: 100,
    totalCount: 30,
    limitPerUser: 1,
    description: 'real-browser-coupon-flow',
    status: 1,
    startTime: formatLocalDateTime(-1),
    endTime: formatLocalDateTime(30)
  })
  expect(createResponse.ok(), `创建优惠券失败: ${createResponse.status()} ${createResponse.url()}`).toBeTruthy()

  const createPayload = await createResponse.json()
  expect(createPayload?.code).toBe(200)
  const couponId = Number(createPayload?.data?.id || 0)
  expect(couponId).toBeGreaterThan(0)

  return { adminSession, couponId }
}

async function expectLoginRedirect(page: Page) {
  await expect(page.getByText('请先登录')).toBeVisible({ timeout: 10_000 })
  await page.waitForURL(/\/login/)
  await expect(page.getByTestId('login-form')).toBeVisible()
}

test('四个优惠券入口未登录时统一中文提示并引导登录', async ({ page }) => {
  const { adminSession, couponId } = await createActiveCoupon(page)

  try {
    await page.goto('/')
    await neutralizeFloatingUi(page)
    await page.getByTestId(`home-quick-coupon-claim-${couponId}`).click()
    await expectLoginRedirect(page)

    await page.goto('/promotions')
    await expect(page.getByTestId('promotions-view')).toBeVisible()
    await page.getByTestId(`promotions-claim-${couponId}`).click()
    await expectLoginRedirect(page)

    await page.goto(`/promotion/${couponId}`)
    await expect(page.getByTestId('promotions-view')).toBeVisible()
    await page.getByTestId(`promotions-claim-${couponId}`).click()
    await expectLoginRedirect(page)

    await page.goto(`/coupon/${couponId}`)
    await expect(page.getByTestId('coupon-detail-view')).toBeVisible()
    await page.getByTestId('coupon-detail-claim').click()
    await expectLoginRedirect(page)
  } finally {
    await authedDelete(page.request, adminSession.token, `/api/coupons/admin/${couponId}`).catch(() => {})
  }
})

test('已登录领取优惠券后列表与详情按服务端状态刷新', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const { adminSession, couponId } = await createActiveCoupon(page)

  try {
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
  } finally {
    await authedDelete(page.request, adminSession.token, `/api/coupons/admin/${couponId}`).catch(() => {})
  }
})
