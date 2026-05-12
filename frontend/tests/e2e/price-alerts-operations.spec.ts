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
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function cleanupAlert(page: Page, token: string, productId: number) {
  await authedDelete(page.request, token, `/api/price/alert/${productId}`).catch(() => null)
  await authedDelete(page.request, token, `/api/price/alert/${productId}/record`).catch(() => null)
}

test('用户可在降价提醒页修改、取消并删除提醒记录', async ({ page }) => {
  const product = await resolveProduct(page, 'priceAlertsOperations', {
    explicitId: E2E_PRODUCTS.priceAlert,
    excludeSellerUsername: E2E_USERS.buyer
  })
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const productId = Number(product.id)
  const currentPrice = Number(product.price || 0)
  expect(currentPrice).toBeGreaterThan(1)

  const initialTargetPrice = Math.max(0.01, Number((currentPrice - 1).toFixed(2)))
  const updatedTargetPrice = Math.max(0.01, Number((currentPrice - 2).toFixed(2)))

  await cleanupAlert(page, buyerSession.token, productId)

  let alertId: number | null = null
  try {
    const createResponse = await authedPost(page.request, buyerSession.token, '/api/price/alert', {
      productId,
      targetPrice: initialTargetPrice
    })
    expect(createResponse.ok(), `创建降价提醒失败: ${createResponse.status()} ${createResponse.url()}`).toBeTruthy()
    const createPayload = await createResponse.json()
    expect(createPayload?.code).toBe(200)
    alertId = Number(createPayload?.data?.id || 0)
    expect(alertId).toBeGreaterThan(0)

    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto('/price-alerts')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('price-alerts-view')).toBeVisible()

    const alertRow = page.getByTestId(`price-alert-item-${alertId}`)
    await expect(alertRow).toBeVisible({ timeout: 15_000 })
    await expect(alertRow).toContainText(product.name || `商品${productId}`)
    await expect(alertRow).toContainText(`目标 ¥${initialTargetPrice}`)

    const updateAlertResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/price/alert')
    )
    await page.getByTestId(`price-alert-edit-${alertId}`).click()
    await page.getByTestId('price-alert-target-input').fill(String(updatedTargetPrice))
    await page.getByTestId('price-alert-edit-save').click()
    const updateAlertResponse = await updateAlertResponsePromise
    expect(updateAlertResponse.ok(), `修改降价提醒失败: ${updateAlertResponse.status()} ${updateAlertResponse.url()}`).toBeTruthy()
    const updateAlertPayload = await updateAlertResponse.json()
    expect(updateAlertPayload?.code).toBe(200)
    await expect(alertRow).toContainText(`目标 ¥${updatedTargetPrice}`)

    const cancelAlertResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' &&
      response.url().includes(`/api/price/alert/${productId}`) &&
      !response.url().includes('/record')
    )
    await page.getByTestId(`price-alert-action-${alertId}`).click()
    await page.getByRole('button', { name: '确定' }).click()
    const cancelAlertResponse = await cancelAlertResponsePromise
    expect(cancelAlertResponse.ok(), `取消降价提醒失败: ${cancelAlertResponse.status()} ${cancelAlertResponse.url()}`).toBeTruthy()
    const cancelAlertPayload = await cancelAlertResponse.json()
    expect(cancelAlertPayload?.code).toBe(200)
    await expect(alertRow).toContainText('已取消')
    await expect(page.getByTestId(`price-alert-action-${alertId}`)).toContainText('删除记录')

    const deleteAlertResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' &&
      response.url().includes(`/api/price/alert/${productId}/record`)
    )
    await page.getByTestId(`price-alert-action-${alertId}`).click()
    await page.getByRole('button', { name: '确定' }).click()
    const deleteAlertResponse = await deleteAlertResponsePromise
    expect(deleteAlertResponse.ok(), `删除降价提醒记录失败: ${deleteAlertResponse.status()} ${deleteAlertResponse.url()}`).toBeTruthy()
    const deleteAlertPayload = await deleteAlertResponse.json()
    expect(deleteAlertPayload?.code).toBe(200)
    await expect(page.getByTestId(`price-alert-item-${alertId}`)).toHaveCount(0)

    const alertsResponse = await authedGet(page.request, buyerSession.token, '/api/price/alerts/detail')
    expect(alertsResponse.ok()).toBeTruthy()
    const alertsPayload = await alertsResponse.json()
    const remainingAlerts = Array.isArray(alertsPayload?.data) ? alertsPayload.data : []
    expect(remainingAlerts.some((item: { id?: number }) => Number(item.id || 0) === alertId)).toBe(false)
    alertId = null
  } finally {
    await cleanupAlert(page, buyerSession.token, productId)
  }
})
