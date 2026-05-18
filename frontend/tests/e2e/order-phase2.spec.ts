import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  login,
  openAdminPage,
  logout,
  neutralizeFloatingUi,
  resolveProduct,
  resolveProductId
} from './helpers/session'

async function enterCheckoutFromProduct(page: Page, productId: number) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`/product/${productId}`)
    await page.waitForURL(new RegExp(`/product/${productId}$`))
    await expect(page.getByTestId('product-detail-view')).toBeVisible()
    await neutralizeFloatingUi(page)

    const buyNowButton = page.getByTestId('product-buy-now')
    await expect(buyNowButton).toBeVisible()
    await buyNowButton.click()

    const checkoutView = page.getByTestId('checkout-view')
    const reachedCheckout = await checkoutView
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false)

    if (reachedCheckout || page.url().includes('/checkout')) {
      await expect(checkoutView).toBeVisible({ timeout: 15_000 })
      return
    }

    if (page.url().includes('/login')) {
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      continue
    }

    await page.waitForTimeout(1_000)
  }

  throw new Error('无法从商品详情页稳定进入结算页')
}

async function createPaidOrder(page: Page, productId: number, remark: string) {
  await enterCheckoutFromProduct(page, productId)
  await expect(page.getByTestId('checkout-view')).toBeVisible()

  await page.locator('textarea').fill(remark)

  const createOrderResponse = page.waitForResponse((response) =>
    response.url().includes('/api/orders') &&
    response.request().method() === 'POST'
  )
  await page.getByTestId('checkout-submit').click()

  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible().catch(() => false)) {
    await continueSubmitButton.click()
  }

  await createOrderResponse

  await page.waitForURL(/\/payment\/\d+/)
  await expect(page.getByTestId('payment-view')).toBeVisible()

  const orderNoText = (await page.locator('.order-no').textContent()) || ''
  const orderNo = orderNoText.replace('订单号：', '').trim()
  expect(orderNo).toBeTruthy()

  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible()
  await page.getByTestId('payment-simulate').click()
  await expect(page.getByTestId('payment-view-orders')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible()

  return orderNo
}

test.describe.configure({ mode: 'serial' })

test('卖家发货后买家可确认收货', async ({ page }) => {
  const remark = `E2E-SHIP-${Date.now()}`
  const shippingProduct = await resolveProduct(page, 'shipping', {
    explicitId: E2E_PRODUCTS.shipping,
    sellerUsername: process.env.E2E_SELLER_USERNAME || undefined
  })
  const shippingProductId = Number(shippingProduct.id)
  const shippingSellerUsername = shippingProduct.sellerName || E2E_USERS.seller

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const orderNo = await createPaidOrder(page, shippingProductId, remark)

  await page.getByTestId('payment-view-orders').click()
  await page.waitForURL(/\/orders/)
  await neutralizeFloatingUi(page)
  await page.getByPlaceholder('搜索订单号或商品名称').fill(orderNo)

  const paidOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(paidOrderCard).toContainText('待发货')

  await logout(page)

  await login(page, shippingSellerUsername, E2E_PASSWORD)
  await page.goto('/seller-orders')
  await expect(page.getByText('卖家发货')).toBeVisible()
  await neutralizeFloatingUi(page)

  const sellerOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(sellerOrderCard).toBeVisible({ timeout: 15_000 })
  await sellerOrderCard.getByRole('button', { name: '发货' }).evaluate((element: HTMLButtonElement) => {
    element.click()
  })
  await page.getByRole('button', { name: '确定发货' }).click()
  await expect(page.getByText('发货成功')).toBeVisible()
  await expect(sellerOrderCard).toContainText('已发货')

  await logout(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/orders')
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await neutralizeFloatingUi(page)
  await page.getByPlaceholder('搜索订单号或商品名称').fill(orderNo)

  const shippedOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(shippedOrderCard).toContainText('待收货')
  await shippedOrderCard.getByRole('button', { name: '确认收货' }).click()
  await expect(page.getByText('已确认收货')).toBeVisible()
  await expect(shippedOrderCard).toContainText('已完成')
})

test('买家申请取消后管理员可审核通过', async ({ page }) => {
  const remark = `E2E-CANCEL-${Date.now()}`
  const cancelProductId = await resolveProductId(page, 'cancel', {
    explicitId: E2E_PRODUCTS.cancel,
    excludeSellerUsername: E2E_USERS.buyer
  })

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  const orderNo = await createPaidOrder(page, cancelProductId, remark)

  await page.getByTestId('payment-view-orders').click()
  await page.waitForURL(/\/orders/)
  await neutralizeFloatingUi(page)
  await page.getByPlaceholder('搜索订单号或商品名称').fill(orderNo)

  const paidOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(paidOrderCard).toContainText('待发货')
  await paidOrderCard.getByRole('button', { name: '申请取消' }).click()
  await expect(page.getByText('取消申请已提交')).toBeVisible()
  await expect(paidOrderCard).toContainText('申请取消中')

  await logout(page)

  await openAdminPage(page, '/admin/orders', { heading: '订单管理' })

  await page.getByPlaceholder('搜索订单号').fill(orderNo)
  await page.getByRole('button', { name: '搜索' }).click()

  const adminOrderRow = page.locator('.el-table__row', { hasText: orderNo })
  await expect(adminOrderRow).toBeVisible({ timeout: 15_000 })
  await adminOrderRow.getByRole('button', { name: '同意取消' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('已同意取消')).toBeVisible()

  await logout(page)

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/orders')
  await expect(page.getByTestId('orders-view')).toBeVisible()
  await neutralizeFloatingUi(page)
  await page.getByPlaceholder('搜索订单号或商品名称').fill(orderNo)

  const cancelledOrderCard = page.locator('.order-card', { hasText: orderNo })
  await expect(cancelledOrderCard).toContainText('已取消')
})
