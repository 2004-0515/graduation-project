import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  authedPost,
  getSession,
  login,
  logout,
  neutralizeFloatingUi,
  resolveProductId
} from './helpers/session'

function formatLocalDateTime(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

async function createActiveCoupon(page: Page) {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E-NOTIFICATION-COUPON-${Date.now()}`

  const createResponse = await authedPost(page.request, adminSession.token, '/api/coupons/admin', {
    name: uniqueName,
    type: 1,
    discountAmount: 15,
    minAmount: 100,
    totalCount: 30,
    limitPerUser: 1,
    description: 'real-browser-notification-routing',
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

async function sendNotification(page: Page, targetUserId: number, payload: Record<string, unknown>) {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const response = await authedPost(page.request, adminSession.token, '/api/notifications/admin/send', {
    userId: targetUserId,
    ...payload
  })
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body?.code).toBe(200)
}

async function openNotificationByTitle(page: Page, title: string) {
  await page.goto('/notifications')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('notifications-view')).toBeVisible()

  const notificationCard = page.locator('.notification-item', { hasText: title }).first()
  await expect(notificationCard).toBeVisible({ timeout: 15_000 })
  await notificationCard.click()
}

test.describe.configure({ mode: 'serial' })

test('旧版价格提醒通知不会误跳到优惠券页', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
  expect(buyerUserId).toBeGreaterThan(0)
  const productId = await resolveProductId(page, 'priceAlert')
  const legacyPriceAlertTitle = `关注商品价格提醒-${Date.now()}`

  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')

  await sendNotification(page, buyerUserId, {
    type: 'promotion',
    title: legacyPriceAlertTitle,
    message: '数据增强:您关注的「演示商品」近期价格有变化，可进入商品详情查看走势。',
    relatedId: productId
  })

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)

  await openNotificationByTitle(page, legacyPriceAlertTitle)
  await expect(page.locator('.detail-type.price_alert', { hasText: '价格提醒' })).toBeVisible()
  await expect(page.getByTestId('notification-detail-promotion-action')).toHaveCount(0)
  await page.getByTestId('notification-detail-price-alert-action').click()
  await page.waitForURL(new RegExp(`/product/${productId}$`))
  await expect(page.getByTestId('product-detail-view')).toBeVisible()

  await logout(page)
  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')
})

test('促销通知和文件审核通知跳转到正确的用户页面', async ({ page }) => {
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
  expect(buyerUserId).toBeGreaterThan(0)

  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')

  const { adminSession, couponId } = await createActiveCoupon(page)
  const promotionTitle = `E2E-COUPON-ROUTE-${Date.now()}`
  const fileReviewTitle = `E2E-FILE-ROUTE-${Date.now()}`

  try {
    await sendNotification(page, buyerUserId, {
      type: 'promotion',
      title: promotionTitle,
      message: '请查看这张优惠券详情页',
      relatedId: couponId
    })

    await sendNotification(page, buyerUserId, {
      type: 'file_review',
      title: fileReviewTitle,
      message: '您的头像审核结果已更新'
    })

    await login(page, E2E_USERS.buyer, E2E_PASSWORD)

    await openNotificationByTitle(page, promotionTitle)
    await page.getByTestId('notification-detail-promotion-action').click()
    await page.waitForURL(new RegExp(`/coupon/${couponId}$`))
    await expect(page.getByTestId('coupon-detail-view')).toBeVisible()

    await openNotificationByTitle(page, fileReviewTitle)
    await page.getByTestId('notification-detail-profile-action').click()
    await page.waitForURL(/\/profile$/)
    await expect(page.getByTestId('profile-view')).toBeVisible()

    await logout(page)
  } finally {
    await authedDelete(page.request, adminSession.token, `/api/coupons/admin/${couponId}`).catch(() => {})
  }
})

test('卖家订单通知和管理员商品审核通知跳转到正确的后台页面', async ({ page }) => {
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const sellerUserId = Number((sellerSession.user as { id?: number }).id || 0)
  const adminUserId = Number((adminSession.user as { id?: number }).id || 0)
  expect(sellerUserId).toBeGreaterThan(0)
  expect(adminUserId).toBeGreaterThan(0)

  await authedDelete(page.request, sellerSession.token, '/api/notifications/clear')
  await authedDelete(page.request, adminSession.token, '/api/notifications/clear')

  const sellerOrderTitle = `新订单待发货-${Date.now()}`
  const adminProductTitle = `E2E-PRODUCT-REVIEW-${Date.now()}`

  await sendNotification(page, sellerUserId, {
    type: 'order',
    title: sellerOrderTitle,
    message: '用户购买了您的商品，请尽快发货'
  })

  await sendNotification(page, adminUserId, {
    type: 'product_review',
    title: adminProductTitle,
    message: '有新商品等待审核'
  })

  await login(page, E2E_USERS.seller, E2E_PASSWORD)
  await openNotificationByTitle(page, sellerOrderTitle)
  await page.getByTestId('notification-detail-order-action').click()
  await page.waitForURL(/\/seller-orders$/)
  await expect(page.getByRole('heading', { name: '卖家发货' })).toBeVisible()

  await logout(page)

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await openNotificationByTitle(page, adminProductTitle)
  await page.getByTestId('notification-detail-product-review-action').click()
  await page.waitForURL(/\/admin\/products\?tab=pending$/)
  await expect(page.getByTestId('admin-products-view')).toBeVisible()

  await logout(page)
})
