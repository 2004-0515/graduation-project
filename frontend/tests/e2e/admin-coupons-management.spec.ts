import { expect, test } from '@playwright/test'
import {
  authedDelete,
  authedPost,
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  openAdminPage,
  logout,
} from './helpers/session'

test('管理员可在优惠券后台切换状态并删除优惠券', async ({ page }) => {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E-COUPON-${Date.now()}`
  let couponId: number | null = null

  try {
    const createResponse = await authedPost(page.request, adminSession.token, '/api/coupons/admin', {
      name: uniqueName,
      type: 1,
      discountAmount: 15,
      minAmount: 100,
      totalCount: 30,
      limitPerUser: 1,
      description: 'real-browser-admin-coupon',
      status: 0,
      startTime: '2026-01-01T00:00:00',
      endTime: '2026-12-31T23:59:59'
    })
    expect(createResponse.ok(), `创建优惠券失败: ${createResponse.status()} ${createResponse.url()}`).toBeTruthy()

    const createPayload = await createResponse.json()
    expect(createPayload?.code).toBe(200)
    couponId = Number(createPayload?.data?.id)
    expect(couponId).toBeGreaterThan(0)

    await openAdminPage(page, '/admin/coupons', { testId: 'admin-coupons-view' })

    let couponRow = page.locator('.el-table__row', { hasText: uniqueName }).first()
    await expect(couponRow).toBeVisible({ timeout: 15_000 })
    await expect(couponRow).toContainText('0 / 30')

    const statusSwitch = couponRow.locator('.el-switch').first()
    await statusSwitch.click()
    await expect(page.getByText('已启用')).toBeVisible()

    couponRow = page.locator('.el-table__row', { hasText: uniqueName }).first()
    await expect(couponRow).toBeVisible({ timeout: 15_000 })
    await expect(couponRow.locator('.el-switch.is-checked')).toHaveCount(1)

    await couponRow.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page.getByText('删除成功')).toBeVisible()
    await expect(page.locator('.el-table__row', { hasText: uniqueName })).toHaveCount(0)

    couponId = null
    await logout(page)
  } finally {
    if (couponId) {
      await authedDelete(page.request, adminSession.token, `/api/coupons/admin/${couponId}`).catch(() => {})
    }
  }
})
