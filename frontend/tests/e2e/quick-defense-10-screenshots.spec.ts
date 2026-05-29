import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  authedPost,
  getSession,
  login,
  neutralizeFloatingUi
} from './helpers/session'

const outputDir = path.resolve(process.cwd(), '..', 'scratch', 'defense-screenshots', '20260526_快速检查10页')
const viewport = { width: 1440, height: 900 }

type ScreenshotRecord = {
  fileName: string
  title: string
  role: string
  path: string
  url: string
  sizeBytes: number
  width: number
  height: number
  valid: boolean
}

const screenshotNames = [
  '功能_首页_01.png',
  '功能_商品详情与价格提醒_02.png',
  '功能_购物车管理_03.png',
  '功能_后台商品管理_04.png',
  '功能_理性消费助手_05.png',
  '测试_登录认证功能测试_06.png',
  '测试_商品搜索功能测试_07.png',
  '测试_购物车管理功能测试_08.png',
  '测试_订单流程功能测试_09.png',
  '测试_理性消费功能测试_10.png'
]

const screenshotRecords: ScreenshotRecord[] = []

test.use({
  viewport,
  deviceScaleFactor: 1,
  colorScheme: 'light'
})

async function waitForApp(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#app')
    return !!root && root.childElementCount > 0
  }, { timeout: 15_000 })
  await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {})
}

async function prepareVisualState(page: Page) {
  await neutralizeFloatingUi(page)
  await page.addStyleTag({
    content: `
      [data-testid="global-music-player"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .phone,
      .addr-detail,
      .address-info p,
      input[placeholder*="手机"],
      input[placeholder*="电话"],
      input[placeholder*="邮箱"],
      input[placeholder*="地址"],
      textarea[placeholder*="地址"] {
        color: transparent !important;
        text-shadow: 0 0 8px rgba(0, 0, 0, 0.35) !important;
      }
    `
  }).catch(() => {})
  await page.evaluate(() => {
    const replaceSensitiveText = (value: string) =>
      value
        .replace(/1[3-9]\d{9}/g, '138****0000')
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 'masked@example.com')

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text)
    }
    for (const node of nodes) {
      const nextValue = replaceSensitiveText(node.nodeValue || '')
      if (nextValue !== node.nodeValue) {
        node.nodeValue = nextValue
      }
    }
  }).catch(() => {})
}

async function resolveProductId(page: Page, keyword: string) {
  const response = await page.request.get(`/api/products?pageNo=0&pageSize=10&keyword=${encodeURIComponent(keyword)}`)
  expect(response.ok(), `商品查询失败: ${keyword}`).toBeTruthy()
  const payload = await response.json()
  const content = payload?.data?.content || []
  expect(content.length, `未找到截图商品: ${keyword}`).toBeGreaterThan(0)
  return Number(content[0].id)
}

async function authHeaders(page: Page, username: string) {
  const session = await getSession(page, username, E2E_PASSWORD)
  return {
    Authorization: `Bearer ${session.token}`
  }
}

async function openPublic(page: Page, route: string, readyTestId?: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await waitForApp(page)
  if (readyTestId) {
    await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 15_000 })
  }
  await prepareVisualState(page)
}

async function openAs(page: Page, username: string, route: string, readyTestId?: string) {
  await login(page, username, E2E_PASSWORD)
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await waitForApp(page)
  if (readyTestId) {
    await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 15_000 })
  }
  await prepareVisualState(page)
}

async function fillFieldByTestId(page: Page, testId: string, value: string) {
  const field = page
    .locator(
      [
        `[data-testid="${testId}"] input`,
        `[data-testid="${testId}"] textarea`,
        `input[data-testid="${testId}"]`,
        `textarea[data-testid="${testId}"]`
      ].join(', ')
    )
    .first()
  await expect(field, `${testId} 输入框未渲染`).toBeVisible({ timeout: 15_000 })
  await field.fill(value)
}

async function capture(page: Page, fileName: string, title: string, role: string) {
  const outputPath = path.join(outputDir, fileName)
  await page.setViewportSize(viewport)
  await prepareVisualState(page)
  await expect(page.locator('#app').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.el-message--error')).toHaveCount(0)
  await page.screenshot({ path: outputPath, fullPage: false, animations: 'disabled' })
  const fileBuffer = fs.readFileSync(outputPath)
  const width = fileBuffer.readUInt32BE(16)
  const height = fileBuffer.readUInt32BE(20)
  const sizeBytes = fileBuffer.byteLength
  screenshotRecords.push({
    fileName,
    title,
    role,
    path: outputPath,
    url: page.url(),
    sizeBytes,
    width,
    height,
    valid: width === viewport.width && height === viewport.height && sizeBytes > 10_000
  })
}

async function clearCartFor(page: Page, username: string) {
  const headers = await authHeaders(page, username)
  const response = await authedDelete(page.request, headers.Authorization.replace('Bearer ', ''), '/api/cart/clear')
  expect(response.ok(), `清空 ${username} 购物车失败`).toBeTruthy()
}

async function addCartItem(page: Page, username: string, productId: number, quantity: number) {
  const session = await getSession(page, username, E2E_PASSWORD)
  const response = await authedPost(page.request, session.token, '/api/cart', {
    productId,
    quantity
  })
  expect(response.ok(), `加入购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return Number(payload?.data?.id || 0)
}

async function submitCheckoutToPayment(page: Page) {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders') && response.request().method() === 'POST'
  )
  await page.getByTestId('checkout-submit').click()
  const continueSubmitButton = page.getByRole('button', { name: '继续提交' })
  if (await continueSubmitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await continueSubmitButton.click()
  }
  await responsePromise
  await page.waitForURL(/\/payment\/\d+/, { timeout: 15_000 })
  await expect(page.getByTestId('payment-view')).toBeVisible({ timeout: 15_000 })
}

async function payCurrentOrderAndOpenOrders(page: Page) {
  await page.getByTestId('payment-open').click()
  await expect(page.getByTestId('payment-simulate')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('payment-simulate').click()
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('payment-view-orders').click()
  await page.waitForURL(/\/orders/, { timeout: 15_000 })
  await expect(page.getByTestId('orders-view')).toBeVisible({ timeout: 15_000 })
}

test.beforeAll(() => {
  fs.mkdirSync(outputDir, { recursive: true })
  for (const name of screenshotNames) {
    fs.rmSync(path.join(outputDir, name), { force: true })
  }
})

test.afterAll(() => {
  fs.writeFileSync(
    path.join(outputDir, 'screenshot-manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        viewport,
        count: screenshotRecords.length,
        validation: {
          expectedCount: screenshotNames.length,
          actualCount: screenshotRecords.length,
          allPresent: screenshotNames.every((name) => screenshotRecords.some((record) => record.fileName === name)),
          allValid: screenshotRecords.every((record) => record.valid)
        },
        screenshots: screenshotRecords
      },
      null,
      2
    ),
    'utf-8'
  )
})

test('生成快速检查 10 页答辩截图', async ({ page }) => {
  test.setTimeout(240_000)

  const keyboardId = await resolveProductId(page, '机械键盘')
  const headphonesId = await resolveProductId(page, '降噪耳机')
  await resolveProductId(page, '佳能 EOS')

  await openPublic(page, '/', 'home-view')
  await page.getByTestId('home-product-card').first().scrollIntoViewIfNeeded()
  await capture(page, '功能_首页_01.png', '功能：首页', 'public')

  await openAs(page, E2E_USERS.buyer, `/product/${headphonesId}`, 'product-detail-view')
  const openAlertButton = page.getByTestId('product-price-alert-open')
  if (await openAlertButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await openAlertButton.click()
    await expect(page.getByTestId('product-price-alert-input')).toBeVisible({ timeout: 15_000 })
  }
  await capture(page, '功能_商品详情与价格提醒_02.png', '功能：商品详情与价格提醒', 'buyer')

  await clearCartFor(page, E2E_USERS.buyer)
  const cartItemId = await addCartItem(page, E2E_USERS.buyer, keyboardId, 1)
  await openAs(page, E2E_USERS.buyer, '/cart', 'cart-view')
  await expect(page.getByTestId(`cart-item-${cartItemId}`)).toBeVisible({ timeout: 15_000 })
  await capture(page, '功能_购物车管理_03.png', '功能：购物车管理', 'buyer')

  await openAs(page, E2E_USERS.admin, '/admin/products', 'admin-products-view')
  await capture(page, '功能_后台商品管理_04.png', '功能：后台商品管理', 'admin')

  await openAs(page, E2E_USERS.buyer, '/rational-consumption', 'rational-consumption-view')
  await capture(page, '功能_理性消费助手_05.png', '功能：理性消费助手', 'buyer')

  await page.context().clearCookies()
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 15_000 })
  await fillFieldByTestId(page, 'login-username', E2E_USERS.buyer)
  await fillFieldByTestId(page, 'login-password', E2E_PASSWORD)
  await capture(page, '测试_登录认证功能测试_06.png', '测试：登录认证功能测试', 'public')

  await openPublic(page, '/category?keyword=机械键盘', 'category-view')
  await expect(page.getByText(/机械键盘/).first()).toBeVisible({ timeout: 15_000 })
  await capture(page, '测试_商品搜索功能测试_07.png', '测试：商品搜索功能测试', 'public')

  await openAs(page, E2E_USERS.buyer, '/cart', 'cart-view')
  await expect(page.getByTestId(`cart-item-${cartItemId}`)).toBeVisible({ timeout: 15_000 })
  const increaseButton = page.getByTestId(`cart-item-increase-${cartItemId}`)
  if (await increaseButton.isEnabled().catch(() => false)) {
    await increaseButton.click()
    await expect(page.getByTestId(`cart-item-quantity-${cartItemId}`)).toHaveText('2', { timeout: 15_000 })
  }
  await capture(page, '测试_购物车管理功能测试_08.png', '测试：购物车管理功能测试', 'buyer')

  await openAs(page, E2E_USERS.buyer, `/checkout?productId=${keyboardId}&quantity=1`, 'checkout-view')
  await submitCheckoutToPayment(page)
  await payCurrentOrderAndOpenOrders(page)
  await capture(page, '测试_订单流程功能测试_09.png', '测试：订单流程功能测试', 'buyer')

  await openAs(page, E2E_USERS.buyer, '/rational-consumption', 'rational-consumption-view')
  await page.getByTestId('rational-tab-wishlist').click()
  await capture(page, '测试_理性消费功能测试_10.png', '测试：理性消费功能测试', 'buyer')

  expect(screenshotRecords).toHaveLength(screenshotNames.length)
  expect(screenshotRecords.every((record) => record.valid)).toBeTruthy()
})
