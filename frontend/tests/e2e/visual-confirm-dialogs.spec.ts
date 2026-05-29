import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  authedDelete,
  authedGet,
  authedPost,
  expectMessageBoxCentered,
  getMessageBox,
  getSession,
  login,
  logout,
  neutralizeFloatingUi,
  openAdminPage,
  resolveProduct,
  resolveProductId
} from './helpers/session'

async function cancelMessageBox(page: Page, label: string) {
  await expectMessageBoxCentered(page, label)
  await getMessageBox(page).getByRole('button', { name: '取消' }).click()
  await expect(page.locator('.el-message-box')).toHaveCount(0)
}

async function confirmMessageBoxByName(page: Page, label: string, buttonName: string = '确定') {
  await expectMessageBoxCentered(page, label)
  await getMessageBox(page).getByRole('button', { name: buttonName }).click()
}

async function clearCart(page: Page, token: string) {
  const response = await authedDelete(page.request, token, '/api/cart/clear')
  expect(response.ok(), `清空购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
}

async function addCartItem(page: Page, token: string, productId: number, quantity = 1) {
  const response = await authedPost(page.request, token, '/api/cart', { productId, quantity })
  expect(response.ok(), `加入购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const cartItemId = Number(payload?.data?.id || 0)
  expect(cartItemId).toBeGreaterThan(0)
  return cartItemId
}

async function resolveCategoryId(page: Page) {
  const response = await page.request.get('/api/categories')
  expect(response.ok(), `获取分类失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  const categories = Array.isArray(payload?.data) ? payload.data : []
  expect(categories.length).toBeGreaterThan(0)
  return Number(categories[0].id)
}

async function createSellerProduct(page: Page, namePrefix: string) {
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const categoryId = await resolveCategoryId(page)
  const uniqueName = `${namePrefix}-${Date.now()}`
  const response = await authedPost(page.request, sellerSession.token, '/api/products/submit', {
    name: uniqueName,
    description: 'visual-confirm-dialogs',
    price: '88.00',
    stock: 5,
    categoryId
  })
  expect(response.ok(), `提交卖家商品失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const productId = Number(payload?.data?.id || 0)
  expect(productId).toBeGreaterThan(0)
  return { productId, productName: uniqueName, sellerToken: sellerSession.token }
}

async function approveProduct(page: Page, productId: number) {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const response = await authedPost(page.request, adminSession.token, `/api/products/${productId}/audit`, {
    auditStatus: 1,
    remark: 'visual confirm approve'
  })
  expect(response.ok(), `审核商品失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

async function createAddress(page: Page, token: string) {
  const unique = Date.now()
  const response = await authedPost(page.request, token, '/api/addresses', {
    name: '视觉测试',
    phone: '13900139000',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: `视觉确认框地址 ${unique}`,
    isDefault: false
  })
  expect(response.ok(), `创建地址失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const addressId = Number(payload?.data?.id || 0)
  expect(addressId).toBeGreaterThan(0)
  return addressId
}

async function cleanupWishlist(page: Page, token: string, reasonPrefix: string) {
  const response = await authedGet(page.request, token, '/api/rational-consumption/wishlist')
  if (!response.ok()) return
  const payload = await response.json()
  const items = Array.isArray(payload?.data) ? payload.data : []
  for (const item of items) {
    if (String(item?.reason || '').startsWith(reasonPrefix) && item?.id) {
      await authedDelete(page.request, token, `/api/rational-consumption/wishlist/${Number(item.id)}`).catch(() => {})
    }
  }
}

async function createWishlistItem(page: Page, token: string, productId: number, reasonPrefix: string) {
  const reason = `${reasonPrefix}-${Date.now()}`
  const response = await authedPost(page.request, token, '/api/rational-consumption/wishlist', {
    productId,
    coolingDays: 3,
    reason
  })
  expect(response.ok(), `创建想要清单失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)

  const listResponse = await authedGet(page.request, token, '/api/rational-consumption/wishlist')
  expect(listResponse.ok()).toBeTruthy()
  const listPayload = await listResponse.json()
  const items = Array.isArray(listPayload?.data) ? listPayload.data : []
  const created = items.find((item: any) => item.reason === reason)
  expect(created, '未找到刚创建的想要清单项').toBeTruthy()
  return Number(created.id)
}

async function cleanupAlert(page: Page, token: string, productId: number) {
  await authedDelete(page.request, token, `/api/price/alert/${productId}/record`).catch(() => {})
  await authedDelete(page.request, token, `/api/price/alert/${productId}`).catch(() => {})
}

async function createPriceAlert(page: Page, token: string, productId: number, targetPrice: number) {
  await cleanupAlert(page, token, productId)
  const response = await authedPost(page.request, token, '/api/price/alert', { productId, targetPrice })
  expect(response.ok(), `创建降价提醒失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return Number(payload?.data?.id || 0)
}

async function createCategory(page: Page, token: string) {
  const name = `视觉分类${Date.now()}`
  const response = await authedPost(page.request, token, '/api/categories', {
    name,
    description: 'visual-confirm-dialogs',
    icon: null,
    sortOrder: 999,
    status: 1
  })
  expect(response.ok(), `创建分类失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return { categoryId: Number(payload?.data?.id || 0), categoryName: name }
}

async function createCoupon(page: Page, token: string) {
  const now = new Date()
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const name = `视觉优惠券${Date.now()}`
  const response = await authedPost(page.request, token, '/api/coupons/admin', {
    name,
    type: 1,
    discountAmount: 8,
    minAmount: 80,
    totalCount: 10,
    limitPerUser: 1,
    description: 'visual-confirm-dialogs',
    status: 1,
    startTime: now.toISOString(),
    endTime: end.toISOString()
  })
  expect(response.ok(), `创建优惠券失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return { couponId: Number(payload?.data?.id || 0), couponName: name }
}

async function sendNotification(page: Page, token: string, userId: number) {
  const title = `视觉通知${Date.now()}`
  const response = await authedPost(page.request, token, '/api/notifications/admin/send', {
    userId,
    type: 'SYSTEM',
    title,
    message: 'visual-confirm-dialogs'
  })
  expect(response.ok(), `发送通知失败: ${response.status()} ${response.url()}`).toBeTruthy()
  return title
}

async function cleanupNotificationByTitle(page: Page, token: string, title: string) {
  const response = await authedGet(page.request, token, '/api/notifications')
  if (!response.ok()) return
  const payload = await response.json()
  const notifications = Array.isArray(payload?.data) ? payload.data : []
  for (const item of notifications) {
    if (item?.title === title && item?.id) {
      await authedDelete(page.request, token, `/api/notifications/${Number(item.id)}`).catch(() => {})
    }
  }
}

async function createPaidOrder(page: Page, productId: number, remark: string) {
  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto(`/product/${productId}`)
  await expect(page.getByTestId('product-detail-view')).toBeVisible()
  await neutralizeFloatingUi(page)
  await page.getByTestId('product-buy-now').click()
  await page.waitForURL(/\/checkout/)
  await expect(page.getByTestId('checkout-view')).toBeVisible()
  await page.locator('textarea').fill(remark)
  await page.getByTestId('checkout-submit').click()
  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
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
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })
  return orderNo
}

test.describe('确认框视觉回归', () => {
  test('购物车删除确认框在多视口下居中，且取消不误删', async ({ page }) => {
    test.setTimeout(180_000)

    const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
    const productId = await resolveProductId(page, 'visual-cart-viewports', {
      explicitId: E2E_PRODUCTS.smoke,
      excludeSellerUsername: E2E_USERS.buyer
    })

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
      { width: 390, height: 844 }
    ]) {
      await page.setViewportSize(viewport)
      await clearCart(page, buyerSession.token)
      const cartItemId = await addCartItem(page, buyerSession.token, productId)

      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto('/cart')
      await neutralizeFloatingUi(page)
      const cartItem = page.getByTestId(`cart-item-${cartItemId}`)
      await expect(cartItem).toBeVisible({ timeout: 15_000 })
      await cartItem.getByTestId(`cart-item-delete-${cartItemId}`).scrollIntoViewIfNeeded()
      await cartItem.getByTestId(`cart-item-delete-${cartItemId}`).click()
      await cancelMessageBox(page, `购物车单项删除 ${viewport.width}x${viewport.height}`)
      await expect(cartItem).toBeVisible()
    }

    await clearCart(page, buyerSession.token)
  })

  test('桌面端核心删除和确认弹窗全部居中显示', async ({ page }) => {
    test.setTimeout(300_000)
    await page.setViewportSize({ width: 1440, height: 900 })

    const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
    const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
    const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
    const buyerUserId = Number((buyerSession.user as { id?: number }).id || 0)
    expect(buyerUserId).toBeGreaterThan(0)

    const createdProductIds: Array<{ id: number; token: string }> = []
    const createdCategoryIds: number[] = []
    const createdCouponIds: number[] = []
    const notificationTitles: string[] = []
    const wishlistReasonPrefix = `VISUAL-WISHLIST-${Date.now()}`
    let alertProductId: number | null = null

    try {
      const cartProduct = await resolveProduct(page, 'visual-cart-desktop', {
        explicitId: E2E_PRODUCTS.smoke,
        excludeSellerUsername: E2E_USERS.buyer
      })
      await clearCart(page, buyerSession.token)
      const cartItemId = await addCartItem(page, buyerSession.token, Number(cartProduct.id), 1)
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto('/cart')
      await neutralizeFloatingUi(page)
      const cartItem = page.getByTestId(`cart-item-${cartItemId}`)
      await expect(cartItem).toBeVisible({ timeout: 15_000 })
      await cartItem.getByTestId(`cart-item-delete-${cartItemId}`).click()
      await cancelMessageBox(page, '购物车单项删除取消')
      await expect(cartItem).toBeVisible()
      await page.getByTestId('cart-clear-selected').click()
      await cancelMessageBox(page, '购物车清空已选取消')
      await expect(cartItem).toBeVisible()
      const deleteResponsePromise = page.waitForResponse((response) =>
        response.request().method() === 'DELETE' && response.url().includes(`/api/cart/${cartItemId}`)
      )
      await cartItem.getByTestId(`cart-item-delete-${cartItemId}`).click()
      await confirmMessageBoxByName(page, '购物车单项删除确认')
      await deleteResponsePromise
      await expect(page.getByTestId(`cart-item-${cartItemId}`)).toHaveCount(0)

      const addressId = await createAddress(page, buyerSession.token)
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto('/address')
      await neutralizeFloatingUi(page)
      const addressCard = page.getByTestId(`address-card-${addressId}`)
      await expect(addressCard).toBeVisible({ timeout: 15_000 })
      await addressCard.getByTestId(`address-delete-${addressId}`).click()
      await cancelMessageBox(page, '地址删除取消')
      await expect(addressCard).toBeVisible()
      await authedDelete(page.request, buyerSession.token, `/api/addresses/${addressId}`)

      const wishlistProductId = await resolveProductId(page, 'visual-wishlist', {
        excludeSellerUsername: E2E_USERS.buyer
      })
      const wishlistId = await createWishlistItem(page, buyerSession.token, wishlistProductId, wishlistReasonPrefix)
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto('/rational-consumption?tab=wishlist')
      await neutralizeFloatingUi(page)
      const wishlistItem = page.getByTestId(`wishlist-item-${wishlistId}`)
      await expect(wishlistItem).toBeVisible({ timeout: 15_000 })
      await page.getByTestId(`wishlist-remove-${wishlistId}`).click()
      await cancelMessageBox(page, '理性消费想要清单移除取消')
      await expect(wishlistItem).toBeVisible()

      const alertProduct = await resolveProduct(page, 'visual-price-alert', {
        explicitId: E2E_PRODUCTS.priceAlert,
        excludeSellerUsername: E2E_USERS.buyer
      })
      alertProductId = Number(alertProduct.id)
      const alertId = await createPriceAlert(
        page,
        buyerSession.token,
        alertProductId,
        Math.max(0.01, Number((Number(alertProduct.price || 0) - 1).toFixed(2)))
      )
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto('/price-alerts')
      await neutralizeFloatingUi(page)
      const alertRow = page.getByTestId(`price-alert-item-${alertId}`)
      await expect(alertRow).toBeVisible({ timeout: 15_000 })
      await page.getByTestId(`price-alert-action-${alertId}`).click()
      await cancelMessageBox(page, '降价提醒取消监控取消')
      await expect(alertRow).toBeVisible()

      const notificationTitle = await sendNotification(page, adminSession.token, buyerUserId)
      notificationTitles.push(notificationTitle)
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto('/notifications')
      await neutralizeFloatingUi(page)
      await expect(page.getByTestId('notifications-view')).toBeVisible()
      await page.getByTestId('notifications-clear-all').click()
      await cancelMessageBox(page, '通知清空取消')
      await expect(page.getByText(notificationTitle)).toBeVisible({ timeout: 15_000 })

      const sellerProduct = await createSellerProduct(page, 'VISUAL-MY-PRODUCT')
      createdProductIds.push({ id: sellerProduct.productId, token: sellerProduct.sellerToken })
      await login(page, E2E_USERS.seller, E2E_PASSWORD)
      await page.goto('/my-products')
      await neutralizeFloatingUi(page)
      const sellerProductCard = page.getByTestId(`my-product-card-${sellerProduct.productId}`)
      await expect(sellerProductCard).toBeVisible({ timeout: 15_000 })
      await page.getByTestId(`my-product-delete-${sellerProduct.productId}`).click()
      await cancelMessageBox(page, '商家商品删除取消')
      await expect(sellerProductCard).toBeVisible()

      const shippingProduct = await createSellerProduct(page, 'VISUAL-SELLER-SHIP')
      createdProductIds.push({ id: shippingProduct.productId, token: shippingProduct.sellerToken })
      await approveProduct(page, shippingProduct.productId)
      const orderNo = await createPaidOrder(page, shippingProduct.productId, `VISUAL-SHIP-${Date.now()}`)
      await logout(page)
      await login(page, E2E_USERS.seller, E2E_PASSWORD)
      await page.goto('/seller-orders')
      await neutralizeFloatingUi(page)
      const sellerOrderCard = page.locator('.order-card', { hasText: orderNo }).first()
      await expect(sellerOrderCard).toBeVisible({ timeout: 15_000 })
      await sellerOrderCard.getByRole('button', { name: '发货' }).click()
      await cancelMessageBox(page, '卖家发货确认取消')
      await expect(sellerOrderCard).toContainText('待发货')

      const pendingProduct = await createSellerProduct(page, 'VISUAL-ADMIN-PRODUCT')
      createdProductIds.push({ id: pendingProduct.productId, token: pendingProduct.sellerToken })
      await openAdminPage(page, '/admin/products?tab=pending', { testId: 'admin-products-view' })
      const pendingRow = page.locator('.el-table__row', { hasText: pendingProduct.productName }).first()
      await expect(pendingRow).toBeVisible({ timeout: 15_000 })
      await pendingRow.getByRole('button', { name: '通过' }).click()
      await cancelMessageBox(page, '管理员商品审核通过取消')
      await expect(pendingRow).toBeVisible()

      const deletableProduct = await createSellerProduct(page, 'VISUAL-ADMIN-DELETE')
      createdProductIds.push({ id: deletableProduct.productId, token: deletableProduct.sellerToken })
      await approveProduct(page, deletableProduct.productId)
      await openAdminPage(page, '/admin/products', { testId: 'admin-products-view' })
      await page.getByPlaceholder('搜索商品名称').fill(deletableProduct.productName)
      await page.getByRole('button', { name: '搜索' }).click()
      const deletableRow = page.locator('.el-table__row', { hasText: deletableProduct.productName }).first()
      await expect(deletableRow).toBeVisible({ timeout: 15_000 })
      await deletableRow.getByRole('button', { name: '删除' }).click()
      await cancelMessageBox(page, '管理员商品删除取消')
      await expect(deletableRow).toBeVisible()

      const category = await createCategory(page, adminSession.token)
      createdCategoryIds.push(category.categoryId)
      await openAdminPage(page, '/admin/categories', { testId: 'admin-categories-view' })
      const categoryRow = page.locator('.el-table__row', { hasText: category.categoryName }).first()
      await expect(categoryRow).toBeVisible({ timeout: 15_000 })
      await categoryRow.getByRole('button', { name: '删除' }).click()
      await cancelMessageBox(page, '管理员分类删除取消')

      const coupon = await createCoupon(page, adminSession.token)
      createdCouponIds.push(coupon.couponId)
      await openAdminPage(page, '/admin/coupons', { testId: 'admin-coupons-view' })
      const couponRow = page.locator('.el-table__row', { hasText: coupon.couponName }).first()
      await expect(couponRow).toBeVisible({ timeout: 15_000 })
      await couponRow.getByRole('button', { name: '删除' }).click()
      await cancelMessageBox(page, '管理员优惠券删除取消')

      await openAdminPage(page, '/admin/price', { testId: 'admin-price-view' })
      await page.getByText('降价提醒').click()
      await expect(page.locator('.el-table')).toBeVisible()
      await page.getByPlaceholder('搜索用户名/商品名').fill(E2E_USERS.buyer)
      await page.getByRole('button', { name: '搜索' }).click()
      const adminAlertRow = page.locator('.el-table__row', { hasText: String(alertProduct.name || '') }).first()
      await expect(adminAlertRow).toBeVisible({ timeout: 15_000 })
      await adminAlertRow.getByRole('button', { name: '手动触发' }).click()
      await cancelMessageBox(page, '管理员手动触发降价提醒取消')
      await adminAlertRow.getByRole('button', { name: '删除' }).click()
      await cancelMessageBox(page, '管理员降价提醒删除取消')

      const cancelProductId = await resolveProductId(page, 'visual-admin-order', {
        explicitId: E2E_PRODUCTS.cancel,
        excludeSellerUsername: E2E_USERS.buyer
      })
      const cancelOrderNo = await createPaidOrder(page, cancelProductId, `VISUAL-CANCEL-${Date.now()}`)
      await page.getByTestId('payment-view-orders').click()
      await page.waitForURL(/\/orders/)
      await neutralizeFloatingUi(page)
      await page.getByPlaceholder('搜索订单号或商品名称').fill(cancelOrderNo)
      const buyerOrderCard = page.locator('.order-card', { hasText: cancelOrderNo }).first()
      await expect(buyerOrderCard).toBeVisible({ timeout: 15_000 })
      await buyerOrderCard.getByRole('button', { name: '申请取消' }).click()
      await expect(page.getByText('取消申请已提交')).toBeVisible()
      await openAdminPage(page, '/admin/orders', { testId: 'admin-orders-view' })
      await page.getByPlaceholder('搜索订单号').fill(cancelOrderNo)
      await page.getByRole('button', { name: '搜索' }).click()
      const adminOrderRow = page.locator('.el-table__row', { hasText: cancelOrderNo }).first()
      await expect(adminOrderRow).toBeVisible({ timeout: 15_000 })
      await adminOrderRow.getByRole('button', { name: '同意取消' }).click()
      await cancelMessageBox(page, '管理员订单取消审核取消')
      await expect(adminOrderRow).toBeVisible()
    } finally {
      await clearCart(page, buyerSession.token).catch(() => {})
      await cleanupWishlist(page, buyerSession.token, wishlistReasonPrefix).catch(() => {})
      if (alertProductId) {
        await cleanupAlert(page, buyerSession.token, alertProductId).catch(() => {})
      }
      for (const title of notificationTitles) {
        await cleanupNotificationByTitle(page, buyerSession.token, title).catch(() => {})
      }
      for (const product of createdProductIds) {
        await authedDelete(page.request, product.token, `/api/products/${product.id}`).catch(() => {})
        await authedDelete(page.request, adminSession.token, `/api/products/${product.id}`).catch(() => {})
      }
      for (const categoryId of createdCategoryIds) {
        await authedDelete(page.request, adminSession.token, `/api/categories/${categoryId}`).catch(() => {})
      }
      for (const couponId of createdCouponIds) {
        await authedDelete(page.request, adminSession.token, `/api/coupons/admin/${couponId}`).catch(() => {})
      }
    }
  })
})
