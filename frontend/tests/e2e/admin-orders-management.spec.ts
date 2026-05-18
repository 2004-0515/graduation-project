import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  login,
  openAdminPage,
  logout,
  neutralizeFloatingUi,
  resolveProductId
} from './helpers/session'

async function createPaidOrder(page: Page, productId: number, remark: string) {
  await page.goto(`/product/${productId}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible()
  await neutralizeFloatingUi(page)

  await page.getByTestId('product-buy-now').click()
  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible()

  await page.locator('textarea').fill(remark)

  await page.getByTestId('checkout-submit').click()

  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible().catch(() => false)) {
    await continueSubmitButton.click()
  }

  await page.waitForURL(/\/payment\/\d+/)
  await expect(page.getByTestId('payment-view')).toBeVisible()

  const orderNoText = (await page.locator('.order-no').textContent()) || ''
  const orderNo = orderNoText.replace('订单号：', '').trim()
  expect(orderNo).toBeTruthy()

  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible()
  await page.getByTestId('payment-simulate').click()
  await expect(page.getByTestId('payment-view-orders')).toBeVisible({ timeout: 15_000 })

  return orderNo
}

test('管理员可在订单管理页审核取消并删除订单', async ({ page }) => {
  const cancelProductId = await resolveProductId(page, 'adminOrderManageCancel', {
    explicitId: E2E_PRODUCTS.cancel,
    excludeSellerUsername: E2E_USERS.buyer
  })
  const remark = `E2E-ADMIN-ORDER-${Date.now()}`

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const orderNo = await createPaidOrder(page, cancelProductId, remark)

  await page.getByTestId('payment-view-orders').click()
  await page.waitForURL(/\/orders/)
  await neutralizeFloatingUi(page)
  await page.getByPlaceholder('搜索订单号或商品名称').fill(orderNo)

  const buyerOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(buyerOrderCard).toContainText('待发货')
  await buyerOrderCard.getByRole('button', { name: '申请取消' }).click()
  await expect(page.getByText('取消申请已提交')).toBeVisible()
  await expect(buyerOrderCard).toContainText('申请取消中')

  await logout(page)

  await openAdminPage(page, '/admin/orders', { testId: 'admin-orders-view' })

  await page.getByPlaceholder('搜索订单号').fill(orderNo)
  await page.getByRole('button', { name: '搜索' }).click()

  let adminOrderRow = page.locator('.el-table__row', { hasText: orderNo }).first()
  await expect(adminOrderRow).toBeVisible({ timeout: 15_000 })
  await expect(adminOrderRow).toContainText('申请取消中')

  await adminOrderRow.getByRole('button', { name: '同意取消' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('已同意取消')).toBeVisible()

  adminOrderRow = page.locator('.el-table__row', { hasText: orderNo }).first()
  await expect(adminOrderRow).toContainText('已取消')

  await adminOrderRow.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '确定删除' }).click()

  await expect(page.locator('.el-table__row', { hasText: orderNo })).toHaveCount(0)

  await logout(page)
})
