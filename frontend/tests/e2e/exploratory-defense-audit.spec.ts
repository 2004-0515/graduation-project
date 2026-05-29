import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_PRODUCTS,
  E2E_USERS,
  attachPageWatchers,
  authedDelete,
  expectMessageBoxCentered,
  expectNoBlockingBrowserIssues,
  getMessageBox,
  getSession,
  login,
  logout,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function assertPageHealthy(page: Page, label: string, options: { allowHorizontalOverflow?: boolean } = {}) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction(() => {
    const appRoot = document.querySelector('#app')
    return !!appRoot && appRoot.childElementCount > 0
  })
  await neutralizeFloatingUi(page)

  const bodyText = (await page.locator('body').innerText({ timeout: 10_000 })).trim()
  expect(bodyText.length, `${label}: 页面可见文本过少，疑似空白页`).toBeGreaterThan(10)
  expect(bodyText, `${label}: 页面出现未格式化异常文本`).not.toMatch(/NaN|undefined|\[object Object\]|Invalid Date/)
  await expect(page.locator('.el-message--error'), `${label}: 页面出现错误提示条`).toHaveCount(0)

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const brokenImages = Array.from(document.images)
      .filter((image) => {
        const rect = image.getBoundingClientRect()
        const inViewport =
          rect.width > 8 &&
          rect.height > 8 &&
          rect.right >= 0 &&
          rect.bottom >= 0 &&
          rect.left <= window.innerWidth &&
          rect.top <= window.innerHeight
        return inViewport && !!image.currentSrc && image.complete && image.naturalWidth === 0
      })
      .slice(0, 5)
      .map((image) => image.currentSrc || image.getAttribute('src') || '')

    return {
      horizontalOverflow: Math.max(0, doc.scrollWidth - window.innerWidth),
      brokenImages
    }
  })

  expect(metrics.brokenImages, `${label}: 首屏存在加载失败图片`).toEqual([])
  if (!options.allowHorizontalOverflow) {
    expect(metrics.horizontalOverflow, `${label}: 页面存在明显横向溢出`).toBeLessThanOrEqual(8)
  }
}

async function clearCart(page: Page, token: string) {
  const response = await authedDelete(page.request, token, '/api/cart/clear')
  expect(response.ok(), `清空购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
}

test.describe('答辩探索性反固定检查', () => {
  test('直接访问、切换角色和受保护路由不会出现空白页或越权页面', async ({ page }) => {
    test.setTimeout(240_000)
    const { consoleErrors, failedRequests } = attachPageWatchers(page)

    await logout(page)
    for (const path of ['/cart', '/orders', '/checkout', '/rational-consumption', '/my-products', '/admin/products']) {
      await page.goto(path)
      await expect(page, `匿名访问 ${path} 应跳转登录`).toHaveURL(/\/login/)
      await expect(page.getByTestId('login-form')).toBeVisible()
      await assertPageHealthy(page, `匿名访问 ${path} 后登录页`)
    }

    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    for (const path of ['/admin', '/admin/products', '/my-products', '/seller-orders']) {
      await page.goto(path)
      await neutralizeFloatingUi(page)
      await expect(page, `普通用户访问 ${path} 应回首页`).toHaveURL(/\/$/)
      await expect(page.getByTestId('home-view')).toBeVisible()
      await assertPageHealthy(page, `普通用户越权访问 ${path} 后首页`)
    }

    const buyerPages: Array<[string, string]> = [
      ['/profile', 'profile-view'],
      ['/orders', 'orders-view'],
      ['/address', 'address-view'],
      ['/settings', 'settings-view'],
      ['/notifications', 'notifications-view'],
      ['/cart', 'cart-view'],
      ['/price-alerts', 'price-alerts-view'],
      ['/rational-consumption', 'rational-consumption-view']
    ]

    for (const [path, testId] of buyerPages) {
      await page.goto(path)
      await expect(page.getByTestId(testId), `普通用户页面 ${path} 未加载`).toBeVisible({ timeout: 15_000 })
      await assertPageHealthy(page, `普通用户页面 ${path}`)
    }

    await login(page, E2E_USERS.seller, E2E_PASSWORD)
    for (const [path, testId] of [
      ['/my-products', 'my-products-view'],
      ['/seller-orders', 'seller-orders-view']
    ] as Array<[string, string]>) {
      await page.goto(path)
      await expect(page.getByTestId(testId), `商家页面 ${path} 未加载`).toBeVisible({ timeout: 15_000 })
      await assertPageHealthy(page, `商家页面 ${path}`)
    }
    await page.goto('/admin')
    await expect(page, '商家访问管理员后台应回首页').toHaveURL(/\/$/)
    await assertPageHealthy(page, '商家越权访问管理员后台后首页')

    await login(page, E2E_USERS.admin, E2E_PASSWORD)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: '近7天销售趋势' })).toBeVisible({ timeout: 15_000 })
    await assertPageHealthy(page, '管理员数据看板', { allowHorizontalOverflow: true })

    for (const [path, testId] of [
      ['/admin/products', 'admin-products-view'],
      ['/admin/categories', 'admin-categories-view'],
      ['/admin/orders', 'admin-orders-view'],
      ['/admin/users', 'admin-users-view'],
      ['/admin/coupons', 'admin-coupons-view'],
      ['/admin/price', 'admin-price-view'],
      ['/admin/rational', 'admin-rational-view']
    ] as Array<[string, string]>) {
      await page.goto(path)
      await expect(page.getByTestId(testId), `管理员页面 ${path} 未加载`).toBeVisible({ timeout: 15_000 })
      await assertPageHealthy(page, `管理员页面 ${path}`, { allowHorizontalOverflow: true })
    }

    expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
  })

  test('用户端重复点击、极端数量、取消弹窗和购物车状态保持稳定', async ({ page }) => {
    test.setTimeout(180_000)
    const { consoleErrors, failedRequests } = attachPageWatchers(page)
    const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
    const product = await resolveProduct(page, 'exploratory-quantity-product', {
      explicitId: E2E_PRODUCTS.smoke,
      excludeSellerUsername: E2E_USERS.buyer
    })

    try {
      await clearCart(page, buyerSession.token)
      await login(page, E2E_USERS.buyer, E2E_PASSWORD)
      await page.goto(`/product/${product.id}`)
      await expect(page.getByTestId('product-detail-view')).toBeVisible({ timeout: 15_000 })
      await assertPageHealthy(page, '商品详情极端数量前')

      const quantityInput = page.locator('.qty-control input')
      await quantityInput.fill('0')
      await quantityInput.blur()
      await expect(quantityInput, '数量输入 0 后应被修正为 1').toHaveValue('1')

      await quantityInput.fill('9999')
      await quantityInput.blur()
      const clampedQuantity = Number(await quantityInput.inputValue())
      expect(Number.isFinite(clampedQuantity), '极大数量修正后不是数字').toBeTruthy()
      expect(clampedQuantity, '极大数量未按库存上限修正').toBeLessThanOrEqual(Number(product.stock || 9999))

      await quantityInput.fill('1')
      const addButton = page.getByTestId('product-add-to-cart')
      for (let index = 0; index < 3; index++) {
        if (await addButton.isEnabled().catch(() => false)) {
          await addButton.click()
        }
        await page.waitForTimeout(150)
      }

      await page.goto('/cart')
      await expect(page.getByTestId('cart-view')).toBeVisible({ timeout: 15_000 })
      await assertPageHealthy(page, '重复加购后的购物车')

      const cartItem = page.locator('[data-testid^="cart-item-"]').first()
      await expect(cartItem, '重复加购后购物车没有商品').toBeVisible({ timeout: 15_000 })
      const itemQuantity = cartItem.locator('[data-testid^="cart-item-quantity-"]')
      const increaseButton = cartItem.locator('[data-testid^="cart-item-increase-"]')
      for (let index = 0; index < 5; index++) {
        if (await increaseButton.isEnabled().catch(() => false)) {
          await increaseButton.click()
        }
      }
      const displayedQuantity = Number((await itemQuantity.innerText()).trim())
      expect(Number.isFinite(displayedQuantity), '购物车数量不是数字').toBeTruthy()
      expect(displayedQuantity, '购物车数量超过库存').toBeLessThanOrEqual(Number(product.stock || 9999))
      await expect(page.getByTestId('cart-total-price'), '购物车合计出现异常').not.toContainText(/NaN|undefined/)

      const checkbox = cartItem.locator('input[type="checkbox"]').first()
      await checkbox.setChecked(false)
      await expect(page.getByTestId('cart-go-checkout'), '取消选择后结算按钮应禁用').toBeDisabled()
      await checkbox.setChecked(true)
      await expect(page.getByTestId('cart-go-checkout'), '重新选择后结算按钮应可用').toBeEnabled()

      await cartItem.locator('[data-testid^="cart-item-delete-"]').click()
      await expectMessageBoxCentered(page, '探索性购物车删除 Escape 关闭')
      await page.keyboard.press('Escape')
      await expect(page.locator('.el-message-box')).toHaveCount(0)
      await expect(cartItem, 'Escape 关闭确认框后不应误删').toBeVisible()

      await cartItem.locator('[data-testid^="cart-item-delete-"]').click()
      await expectMessageBoxCentered(page, '探索性购物车删除确认')
      await getMessageBox(page).getByRole('button', { name: '确定' }).click()
      await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(0)
      await expect(page.getByTestId('cart-empty')).toBeVisible({ timeout: 15_000 })

      expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
    } finally {
      await clearCart(page, buyerSession.token).catch(() => {})
    }
  })

  test('移动端、空搜索和反向价格筛选保持可用且无明显溢出', async ({ page }) => {
    test.setTimeout(180_000)
    const { consoleErrors, failedRequests } = attachPageWatchers(page)
    const product = await resolveProduct(page, 'exploratory-mobile-product', {
      explicitId: E2E_PRODUCTS.smoke,
      excludeSellerUsername: E2E_USERS.buyer
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)

    for (const [path, label] of [
      ['/', '移动端首页'],
      [`/category?keyword=${encodeURIComponent('机械键盘')}`, '移动端搜索结果'],
      [`/product/${product.id}`, '移动端商品详情'],
      ['/cart', '移动端购物车'],
      ['/rational-consumption', '移动端理性消费']
    ] as Array<[string, string]>) {
      await page.goto(path)
      await assertPageHealthy(page, label)
    }

    await page.goto(`/category?keyword=${encodeURIComponent('不存在的商品-演示异常空状态')}`)
    await expect(page.getByTestId('category-view')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('暂无商品')).toBeVisible({ timeout: 15_000 })
    await assertPageHealthy(page, '移动端搜索空状态')

    await page.goto('/category')
    await expect(page.getByTestId('category-view')).toBeVisible({ timeout: 15_000 })
    await page.getByTestId('category-min-price').fill('999999')
    await page.getByTestId('category-max-price').fill('1')
    await page.getByTestId('category-apply-price').click()
    await expect(page.getByText('暂无商品')).toBeVisible({ timeout: 15_000 })
    await assertPageHealthy(page, '移动端反向价格筛选空状态')
    await page.getByTestId('category-clear-price').click()
    await expect(page.getByTestId('category-product-grid')).toBeVisible({ timeout: 15_000 })
    await assertPageHealthy(page, '移动端清除筛选后商品列表')

    expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
  })
})
