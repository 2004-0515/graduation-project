import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import {
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  login,
  neutralizeFloatingUi
} from './helpers/session'

const outputDir = path.resolve(process.cwd(), '..', 'scratch', 'defense-screenshots', '20260526_答辩截图')
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

const screenshotRecords: ScreenshotRecord[] = []

const screenshotNames = [
  '5_首页商品列表_01.png',
  '5_商品详情_02.png',
  '5_购物车_03.png',
  '5_订单确认_04.png',
  '5_支付页面_05.png',
  '5_个人中心_06.png',
  '5_商家商品管理_07.png',
  '5_商家订单处理_08.png',
  '5_管理员数据看板_09.png',
  '5_管理员商品审核_10.png',
  '5_理性消费助手_11.png',
  '6_登录测试_01.png',
  '6_商品搜索测试_02.png',
  '6_搜索异常空状态_03.png',
  '6_购物车管理测试_04.png',
  '6_购物车空状态_05.png',
  '6_订单流程加购_06.png',
  '6_订单流程确认_07.png',
  '6_订单流程支付_08.png',
  '6_订单流程订单列表_09.png',
  '6_商家发货测试_10.png',
  '6_管理员审核测试_11.png',
  '6_优惠券通知测试_12.png'
]

test.use({
  viewport,
  deviceScaleFactor: 1,
  colorScheme: 'light'
})

async function authHeaders(page: Page, username: string) {
  const session = await getSession(page, username, E2E_PASSWORD)
  return {
    Authorization: `Bearer ${session.token}`
  }
}

async function resolveProductId(page: Page, keyword: string) {
  const response = await page.request.get(`/api/products?pageNo=0&pageSize=10&keyword=${encodeURIComponent(keyword)}`)
  expect(response.ok(), `商品查询失败: ${keyword}`).toBeTruthy()
  const payload = await response.json()
  const content = payload?.data?.content || []
  expect(content.length, `未找到截图商品: ${keyword}`).toBeGreaterThan(0)
  return Number(content[0].id)
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

async function waitForApp(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#app')
    return !!root && root.childElementCount > 0
  }, { timeout: 15_000 })
  await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {})
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

async function capture(page: Page, fileName: string, title: string, role: string) {
  const outputPath = path.join(outputDir, fileName)
  await page.setViewportSize(viewport)
  await prepareVisualState(page)
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

async function ensurePendingProduct(page: Page) {
  const headers = await authHeaders(page, E2E_USERS.seller)
  const uniqueName = `截图审核商品 ${Date.now()}`
  const response = await page.request.post('/api/products/submit', {
    headers,
    data: {
      name: uniqueName,
      categoryId: 2,
      price: 199,
      originalPrice: 259,
      stock: 36,
      mainImage: '/uploads/products/桌搭数码/2026/05/desk-camera-canon-eos.jpg',
      images: ['/uploads/products/桌搭数码/2026/05/desk-camera-canon-eos.jpg'],
      description: '用于答辩截图的待审核商品，保留真实图片和完整审核流。'
    }
  })
  expect(response.ok(), '创建待审核商品失败').toBeTruthy()
}

async function clearCartFor(page: Page, username: string) {
  const headers = await authHeaders(page, username)
  const response = await page.request.delete('/api/cart/clear', { headers })
  expect(response.ok(), `清空 ${username} 购物车失败`).toBeTruthy()
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
          allPresent: screenshotRecords.length === screenshotNames.length,
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

test('生成第5章和第6章答辩截图', async ({ page }) => {
  test.setTimeout(360_000)

  const keyboardId = await resolveProductId(page, '机械键盘')
  const headphonesId = await resolveProductId(page, '索尼 WH-1000XM5')
  await resolveProductId(page, '降噪耳机')
  await resolveProductId(page, '佳能 EOS')
  await ensurePendingProduct(page)

  await openPublic(page, '/', 'home-view')
  await page.getByTestId('home-product-card').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await capture(page, '5_首页商品列表_01.png', '第5章 首页商品列表', 'public')

  await openPublic(page, `/product/${keyboardId}`, 'product-detail-view')
  await capture(page, '5_商品详情_02.png', '第5章 商品详情', 'public')

  await openAs(page, E2E_USERS.buyer, '/cart', 'cart-view')
  await capture(page, '5_购物车_03.png', '第5章 购物车', 'buyer')

  await openAs(page, E2E_USERS.buyer, `/checkout?productId=${headphonesId}&quantity=1`, 'checkout-view')
  await capture(page, '5_订单确认_04.png', '第5章 订单确认', 'buyer')
  await submitCheckoutToPayment(page)
  await capture(page, '5_支付页面_05.png', '第5章 支付页面', 'buyer')

  await openAs(page, E2E_USERS.buyer, '/profile', 'profile-view')
  await capture(page, '5_个人中心_06.png', '第5章 个人中心', 'buyer')

  await openAs(page, E2E_USERS.seller, '/my-products', 'my-products-view')
  await capture(page, '5_商家商品管理_07.png', '第5章 商家商品管理', 'seller')

  await openAs(page, E2E_USERS.seller, '/seller-orders', 'seller-orders-view')
  await capture(page, '5_商家订单处理_08.png', '第5章 商家订单处理', 'seller')

  await openAs(page, E2E_USERS.admin, '/admin')
  await expect(page.locator('.dashboard')).toBeVisible({ timeout: 15_000 })
  await capture(page, '5_管理员数据看板_09.png', '第5章 管理员数据看板', 'admin')

  await openAs(page, E2E_USERS.admin, '/admin/products', 'admin-products-view')
  await page.getByRole('tab', { name: /待审核/ }).click()
  await expect(page.getByText(/截图审核商品/)).toBeVisible({ timeout: 15_000 })
  await capture(page, '5_管理员商品审核_10.png', '第5章 管理员商品审核', 'admin')

  await openAs(page, E2E_USERS.buyer, '/rational-consumption', 'rational-consumption-view')
  await capture(page, '5_理性消费助手_11.png', '第5章 理性消费助手', 'buyer')

  await page.context().clearCookies()
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 15_000 })
  await fillFieldByTestId(page, 'login-username', 'zhangsan')
  await fillFieldByTestId(page, 'login-password', '123456')
  await capture(page, '6_登录测试_01.png', '第6章 登录测试', 'public')

  await openPublic(page, '/category?keyword=机械键盘', 'category-view')
  await expect(page.getByText(/机械键盘/).first()).toBeVisible({ timeout: 15_000 })
  await capture(page, '6_商品搜索测试_02.png', '第6章 商品搜索测试', 'public')

  await openPublic(page, '/category?keyword=不存在商品', 'category-view')
  await capture(page, '6_搜索异常空状态_03.png', '第6章 搜索异常空状态', 'public')

  await openAs(page, E2E_USERS.buyer, '/cart', 'cart-view')
  await capture(page, '6_购物车管理测试_04.png', '第6章 购物车管理测试', 'buyer')

  await clearCartFor(page, 'xinyi')
  await openAs(page, 'xinyi', '/cart', 'cart-view')
  await expect(page.getByTestId('cart-empty')).toBeVisible({ timeout: 15_000 })
  await capture(page, '6_购物车空状态_05.png', '第6章 购物车空状态', 'buyer')

  await openAs(page, E2E_USERS.buyer, `/product/${keyboardId}`, 'product-detail-view')
  await capture(page, '6_订单流程加购_06.png', '第6章 订单流程加购', 'buyer')

  await openAs(page, E2E_USERS.buyer, `/checkout?productId=${keyboardId}&quantity=1`, 'checkout-view')
  await capture(page, '6_订单流程确认_07.png', '第6章 订单流程确认', 'buyer')
  await submitCheckoutToPayment(page)
  await capture(page, '6_订单流程支付_08.png', '第6章 订单流程支付', 'buyer')
  await payCurrentOrderAndOpenOrders(page)
  await capture(page, '6_订单流程订单列表_09.png', '第6章 订单流程订单列表', 'buyer')

  await openAs(page, E2E_USERS.seller, '/seller-orders', 'seller-orders-view')
  await capture(page, '6_商家发货测试_10.png', '第6章 商家发货测试', 'seller')

  await openAs(page, E2E_USERS.admin, '/admin/products', 'admin-products-view')
  await page.getByRole('tab', { name: /待审核/ }).click()
  await expect(page.getByText(/截图审核商品/)).toBeVisible({ timeout: 15_000 })
  await capture(page, '6_管理员审核测试_11.png', '第6章 管理员审核测试', 'admin')

  await openAs(page, E2E_USERS.buyer, '/notifications', 'notifications-view')
  await capture(page, '6_优惠券通知测试_12.png', '第6章 优惠券通知测试', 'buyer')

  expect(screenshotRecords).toHaveLength(screenshotNames.length)
})
