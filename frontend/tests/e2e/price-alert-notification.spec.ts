import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  authedDelete,
  authedGet,
  authedPost,
  getSession,
  login,
  logout,
  neutralizeFloatingUi,
  resolveProductId
} from './helpers/session'

async function cleanupAlert(page: Page, token: string, productId: number) {
  await authedDelete(page.request, token, `/api/price/alert/${productId}`).catch(() => null)
  await authedDelete(page.request, token, `/api/price/alert/${productId}/record`).catch(() => null)
}

test('降价提醒通知可跳转到商品详情', async ({ page }) => {
  const priceAlertProductId = await resolveProductId(page, 'priceAlert', {
    explicitId: E2E_PRODUCTS.priceAlert,
    excludeSellerUsername: E2E_USERS.buyer
  })
  const buyerSession = await login(page, E2E_USERS.buyer, E2E_PASSWORD)

  await cleanupAlert(page, buyerSession.token, priceAlertProductId)
  await authedDelete(page.request, buyerSession.token, '/api/notifications/clear')

  try {
    const existingNotificationsResponse = await authedGet(page.request, buyerSession.token, '/api/notifications')
    expect(existingNotificationsResponse.ok()).toBeTruthy()
    const existingNotificationsPayload = await existingNotificationsResponse.json()
    const existingNotifications = Array.isArray(existingNotificationsPayload?.data) ? existingNotificationsPayload.data : []
    const previousMaxNotificationId = existingNotifications.reduce(
      (max: number, item: { id?: number }) => Math.max(max, Number(item.id || 0)),
      0
    )

    await page.goto(`/product/${priceAlertProductId}`)
    await expect(page.getByTestId('product-detail-view')).toBeVisible()
    await neutralizeFloatingUi(page)

    const priceLocator = page.locator('.price-box .price').first()
    await expect(priceLocator).toContainText('¥', { timeout: 15_000 })
    const currentPriceText = (await priceLocator.textContent()) || ''
    const currentPrice = Number(currentPriceText.replace(/[^\d.]/g, ''))
    expect(currentPrice).toBeGreaterThan(1)
    const targetPrice = Math.max(0.01, Number((currentPrice - 1).toFixed(2)))

    await page.getByTestId('product-price-alert-open').click()
    await page.getByTestId('product-price-alert-input').fill(String(targetPrice))
    await page.getByTestId('product-price-alert-confirm').click()
    await expect(page.getByText('降价提醒设置成功')).toBeVisible({ timeout: 15_000 })

    const alertsResponse = await authedGet(page.request, buyerSession.token, '/api/price/alerts/detail')
    expect(alertsResponse.ok()).toBeTruthy()
    const alertsPayload = await alertsResponse.json()
    const alerts = Array.isArray(alertsPayload?.data) ? alertsPayload.data : []
    const createdAlert = alerts.find((item: { productId?: number; status?: number }) =>
      Number(item.productId) === priceAlertProductId && Number(item.status) === 0
    )
    expect(createdAlert, `未找到商品 ${priceAlertProductId} 的监控中降价提醒`).toBeTruthy()
    const alertId = Number(createdAlert?.id || 0)
    expect(alertId).toBeGreaterThan(0)

    await logout(page)

    const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
    const triggerResponse = await authedPost(
      page.request,
      adminSession.token,
      `/api/price/admin/alert/${alertId}/trigger`
    )
    expect(triggerResponse.ok()).toBeTruthy()
    const triggerPayload = await triggerResponse.json()
    expect(triggerPayload?.code).toBe(200)

    await login(page, E2E_USERS.buyer, E2E_PASSWORD)

    let notificationFound = false
    for (let attempt = 0; attempt < 10; attempt++) {
      const notificationsResponse = await authedGet(page.request, buyerSession.token, '/api/notifications')
      expect(notificationsResponse.ok()).toBeTruthy()
      const notificationsPayload = await notificationsResponse.json()
      const notifications = Array.isArray(notificationsPayload?.data) ? notificationsPayload.data : []
      notificationFound = notifications.some((item: { id?: number; type?: string; title?: string; relatedId?: number }) =>
        Number(item.id || 0) > previousMaxNotificationId &&
        (item.type === 'price_alert' || item.type === 'promotion') &&
        String(item.title || '').includes('降价提醒') &&
        Number(item.relatedId) === priceAlertProductId
      )
      if (notificationFound) {
        break
      }
      await page.waitForTimeout(1000)
    }
    expect(notificationFound).toBeTruthy()

    await page.goto('/notifications')
    await neutralizeFloatingUi(page)
    await expect(page.getByRole('heading', { name: '消息通知' })).toBeVisible()

    const priceAlertCard = page.locator('.notification-item', {
      hasText: '降价提醒'
    }).first()
    await expect(priceAlertCard).toBeVisible({ timeout: 15_000 })
    await priceAlertCard.click()
    await page.getByRole('button', { name: '查看商品' }).click()

    await page.waitForURL(new RegExp(`/product/${priceAlertProductId}$`))
    await expect(page.getByTestId('product-detail-view')).toBeVisible()
  } finally {
    await cleanupAlert(page, buyerSession.token, priceAlertProductId)
  }
})
