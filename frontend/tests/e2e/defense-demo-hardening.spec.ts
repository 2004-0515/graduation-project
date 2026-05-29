import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectMessageBoxCentered,
  expectNoBlockingBrowserIssues,
  neutralizeFloatingUi
} from './helpers/session'

type Session = {
  token: string
  user: Record<string, unknown>
}

type DemoPages = {
  buyerContext: BrowserContext
  sellerContext: BrowserContext
  adminContext: BrowserContext
  buyerPage: Page
  sellerPage: Page
  adminPage: Page
  sharedContext: boolean
}

type UserRecord = {
  id: number
  username: string
  role: string
  status: number
}

type AdminRouteProbe = {
  name: string
  path: string
  ready: string
  allowNoRows?: boolean
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')

const buyerBaseUrl = normalizeBaseUrl(
  process.env.DEFENSE_BUYER_BASE_URL ||
  process.env.TRI_AUDIT_BUYER_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5173'
)
const adminBaseUrl = normalizeBaseUrl(
  process.env.DEFENSE_ADMIN_BASE_URL ||
  process.env.TRI_AUDIT_ADMIN_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5174'
)
const sellerBaseUrl = normalizeBaseUrl(
  process.env.DEFENSE_SELLER_BASE_URL ||
  process.env.TRI_AUDIT_SELLER_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:5175'
)

const adminRoutes: AdminRouteProbe[] = [
  { name: '数据概览', path: '/admin', ready: '.dashboard', allowNoRows: true },
  { name: '商品管理', path: '/admin/products', ready: '[data-testid="admin-products-view"]' },
  { name: '分类管理', path: '/admin/categories', ready: '[data-testid="admin-categories-view"]' },
  { name: '订单管理', path: '/admin/orders', ready: '[data-testid="admin-orders-view"]' },
  { name: '用户管理', path: '/admin/users', ready: '[data-testid="admin-users-view"]' },
  { name: '文件审核', path: '/admin/files', ready: '[data-testid="admin-files-view"]', allowNoRows: true },
  { name: '展示内容', path: '/admin/showcase', ready: '.showcase-manage' },
  { name: '消息管理', path: '/admin/notifications', ready: '[data-testid="admin-notifications-view"]', allowNoRows: true },
  { name: '留言管理', path: '/admin/contact-messages', ready: '[data-testid="admin-contact-messages-view"]', allowNoRows: true },
  { name: '促销管理', path: '/admin/coupons', ready: '[data-testid="admin-coupons-view"]' },
  { name: '音乐管理', path: '/admin/music', ready: '[data-testid="admin-music-view"]', allowNoRows: true },
  { name: '价格管理', path: '/admin/price', ready: '[data-testid="admin-price-view"]', allowNoRows: true },
  { name: '理性消费管理', path: '/admin/rational', ready: '[data-testid="admin-rational-view"]', allowNoRows: true }
]

async function newDemoPages(browser: Browser): Promise<DemoPages> {
  const uniqueOrigins = new Set([buyerBaseUrl, sellerBaseUrl, adminBaseUrl])
  if (uniqueOrigins.size === 3) {
    const context = await browser.newContext()
    return {
      buyerContext: context,
      sellerContext: context,
      adminContext: context,
      buyerPage: await context.newPage(),
      sellerPage: await context.newPage(),
      adminPage: await context.newPage(),
      sharedContext: true
    }
  }

  const buyerContext = await browser.newContext()
  const sellerContext = await browser.newContext()
  const adminContext = await browser.newContext()
  return {
    buyerContext,
    sellerContext,
    adminContext,
    buyerPage: await buyerContext.newPage(),
    sellerPage: await sellerContext.newPage(),
    adminPage: await adminContext.newPage(),
    sharedContext: false
  }
}

async function closeDemoPages(pages: DemoPages) {
  if (pages.sharedContext) {
    await pages.buyerContext.close()
    return
  }

  await pages.buyerContext.close()
  await pages.sellerContext.close()
  await pages.adminContext.close()
}

async function loginAt(page: Page, baseUrl: string, username: string, password: string): Promise<Session> {
  const response = await page.request.post(`${baseUrl}/api/auth/login`, {
    data: { username, password }
  })
  expect(response.ok(), `登录失败: ${username} ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code, `登录接口返回异常: ${username}`).toBe(200)

  const session = {
    token: String(payload.data.token || ''),
    user: payload.data.user || {}
  }
  expect(session.token, `登录未返回 token: ${username}`).toBeTruthy()

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(user))
  }, session)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const appRoot = document.querySelector('#app')
    return !!appRoot && appRoot.childElementCount > 0
  })
  await neutralizeFloatingUi(page)
  return session
}

async function authedGet(page: Page, baseUrl: string, token: string, apiPath: string) {
  return page.request.get(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

async function authedPut(page: Page, baseUrl: string, token: string, apiPath: string, data: unknown) {
  return page.request.put(`${baseUrl}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data
  })
}

async function expectApiCode(response: Awaited<ReturnType<typeof authedPut>>, expectedCode: number, label: string) {
  expect(response.ok(), `${label}: HTTP ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code, `${label}: 业务 code 异常`).toBe(expectedCode)
  return payload
}

async function getUserByUsername(page: Page, baseUrl: string, token: string, username: string): Promise<UserRecord> {
  const response = await authedGet(page, baseUrl, token, `/api/users/username/${encodeURIComponent(username)}`)
  expect(response.ok(), `查询用户失败: ${username} ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code, `查询用户接口返回异常: ${username}`).toBe(200)
  const data = payload.data || {}
  return {
    id: Number(data.id || 0),
    username: String(data.username || username),
    role: String(data.role || ''),
    status: Number(data.status ?? 1)
  }
}

async function setUserRole(page: Page, baseUrl: string, adminToken: string, userId: number, role: string) {
  const response = await authedPut(page, baseUrl, adminToken, `/api/users/${userId}/role`, { role })
  const payload = await expectApiCode(response, 200, `设置用户角色为 ${role}`)
  expect(payload?.data?.role, `后端未返回最新角色 ${role}`).toBe(role)
}

async function setUserStatus(page: Page, baseUrl: string, adminToken: string, userId: number, status: number) {
  const response = await authedPut(page, baseUrl, adminToken, `/api/users/${userId}/status`, { status })
  const payload = await expectApiCode(response, 200, `设置用户状态为 ${status}`)
  expect(Number(payload?.data?.status), `后端未返回最新状态 ${status}`).toBe(status)
}

async function readStoredUser(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('userInfo') || '{}'))
}

async function expectStoredUsername(page: Page, username: string, label: string) {
  const stored = await readStoredUser(page)
  expect(stored?.username, `${label}: localStorage 登录用户被串号`).toBe(username)
}

async function expectSellerApiForbidden(page: Page, token: string) {
  const response = await authedGet(page, sellerBaseUrl, token, '/api/products/my')
  if (response.status() === 403 || response.status() === 401) {
    return
  }

  const payload = await response.json().catch(() => null)
  expect(payload?.code, `卖家降级后不应继续访问卖家商品接口: HTTP ${response.status()}`).toBe(403)
}

function expectNoUnexpectedBrowserIssues(
  consoleErrors: string[],
  failedRequests: string[],
  allowedFailedRequestPatterns: RegExp[] = []
) {
  const filteredFailedRequests = failedRequests.filter((entry) =>
    !allowedFailedRequestPatterns.some((pattern) => pattern.test(entry))
  )
  expectNoBlockingBrowserIssues(consoleErrors, filteredFailedRequests)
}

async function expectSidebarBadgesReadable(page: Page) {
  const badges = page.locator('.admin-sidebar .nav-icon')
  await expect(badges.first(), '管理员侧边栏标识不可见').toBeVisible({ timeout: 10_000 })
  const badgeTexts = (await badges.allTextContents()).map((item) => item.trim()).filter(Boolean)

  expect(badgeTexts).toContain('仪表盘')
  expect(badgeTexts).toEqual(expect.arrayContaining(['商品', '分类', '订单', '用户', '审核', '展示', '消息', '留言', '促销', '音乐', '价格', '理性']))
  expect(badgeTexts, '侧边栏不应出现单字框').not.toEqual(expect.arrayContaining(['展', '联', '券', '乐', '价']))

  const boxes = await badges.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { text: element.textContent?.trim() || '', width: rect.width, height: rect.height }
    })
  )

  for (const box of boxes) {
    if (box.text === '仪表盘') {
      expect(box.width, '仪表盘标识宽度异常').toBeGreaterThanOrEqual(48)
      continue
    }

    expect(box.text.length, `侧边栏短标识应统一为两个字: ${box.text}`).toBe(2)
    expect(box.width, `侧边栏短标识过窄: ${box.text}`).toBeGreaterThanOrEqual(34)
    expect(box.height, `侧边栏短标识高度异常: ${box.text}`).toBeGreaterThanOrEqual(24)
  }
}

async function expectVisibleActionButtonsSeparated(page: Page, routeName: string, allowNoRows = false) {
  const rowCount = await page.locator('.el-table__row').count()
  if (rowCount === 0) {
    expect(allowNoRows, `${routeName}: 后台表格没有任何行，演示容易空场`).toBeTruthy()
    return
  }

  const problems = await page.locator('.el-table__row').evaluateAll((rows) => {
    const issues: string[] = []
    const maxRows = Math.min(rows.length, 4)

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
      const row = rows[rowIndex] as HTMLElement
      const buttons = Array.from(row.querySelectorAll<HTMLElement>('button, .el-button'))
        .map((button) => {
          const style = window.getComputedStyle(button)
          const rect = button.getBoundingClientRect()
          return {
            text: button.innerText.trim() || button.getAttribute('aria-label') || '(无文本)',
            display: style.display,
            visibility: style.visibility,
            opacity: Number(style.opacity || '1'),
            x: rect.x,
            y: rect.y,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          }
        })
        .filter((button) =>
          button.display !== 'none' &&
          button.visibility !== 'hidden' &&
          button.opacity > 0 &&
          button.width > 2 &&
          button.height > 2 &&
          button.text !== '(无文本)'
        )
        .sort((left, right) => left.y === right.y ? left.x - right.x : left.y - right.y)

      for (let index = 1; index < buttons.length; index += 1) {
        const previous = buttons[index - 1]
        const current = buttons[index]
        const verticalOverlap = Math.min(previous.bottom, current.bottom) - Math.max(previous.y, current.y)
        const horizontalOverlap = Math.min(previous.right, current.right) - Math.max(previous.x, current.x)
        const sameLine = verticalOverlap > Math.min(previous.height, current.height) * 0.45
        const horizontalGap = current.x - previous.right

        if (sameLine && horizontalOverlap > 1) {
          issues.push(`第 ${rowIndex + 1} 行按钮重叠: ${previous.text} / ${current.text}`)
        } else if (sameLine && horizontalGap >= 0 && horizontalGap < 6) {
          issues.push(`第 ${rowIndex + 1} 行按钮过挤: ${previous.text} -> ${current.text} gap=${horizontalGap.toFixed(1)}px`)
        }
      }
    }

    return issues
  })

  expect(problems, `${routeName}: 后台操作按钮布局异常`).toEqual([])
}

async function expectNoShowcaseEnumLeakage(page: Page) {
  const visibleText = await page.locator('.showcase-manage').innerText()
  expect(visibleText, '展示内容页不应直接显示内部枚举值 CATEGORY/PRODUCT/PROMOTION').not.toMatch(/\b(CATEGORY|PRODUCT|PROMOTION|ROUTE|URL|NONE|HOME_HERO|PROMOTION_HERO|CATEGORY_SPOTLIGHT)\b/)
  expect(visibleText, '展示内容页应显示中文跳转/版位含义').toMatch(/首页主轮播|促销主视觉|类目专题位|分类页|商品详情|活动专题|站内页面|外部链接|无跳转/)
}

async function expectRoleDropdownDoesNotMutateOnOpen(page: Page, sellerUserId: number) {
  await page.goto(`${adminBaseUrl}/admin/users`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('admin-users-view')).toBeVisible({ timeout: 15_000 })
  await neutralizeFloatingUi(page)

  await page.getByPlaceholder('搜索用户名/邮箱').fill(E2E_USERS.seller)
  await page.getByRole('button', { name: '搜索' }).click()
  const sellerRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
  await expect(sellerRow).toBeVisible({ timeout: 15_000 })

  let roleMutations = 0
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().includes(`/api/users/${sellerUserId}/role`)) {
      roleMutations += 1
    }
  })

  await sellerRow.getByRole('button', { name: '角色' }).click()
  await expect(page.locator('.el-dropdown__popper').last(), '角色菜单未打开').toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(500)
  expect(roleMutations, '只打开角色菜单不应触发角色更新接口').toBe(0)

  await page.keyboard.press('Escape')
  await expect(page.locator('.el-dropdown__popper:visible')).toHaveCount(0)
  await expect(sellerRow).toContainText('卖家')
  await expect(page.getByText('用户角色已更新')).toHaveCount(0)
}

test('三端演示门禁：用户、卖家、管理员同时打开时刷新必须同步角色和禁用状态', async ({ browser }) => {
  test.setTimeout(180_000)

  const pages = await newDemoPages(browser)
  await Promise.all([
    pages.buyerPage.setViewportSize({ width: 1440, height: 900 }),
    pages.sellerPage.setViewportSize({ width: 1440, height: 900 }),
    pages.adminPage.setViewportSize({ width: 1440, height: 900 })
  ])

  const adminWatchers = attachPageWatchers(pages.adminPage)
  const sellerWatchers = attachPageWatchers(pages.sellerPage)
  const buyerWatchers = attachPageWatchers(pages.buyerPage)

  let originalSeller: UserRecord | null = null
  let adminSession: Session | null = null
  let sellerSession: Session | null = null

  try {
    adminSession = await loginAt(pages.adminPage, adminBaseUrl, E2E_USERS.admin, E2E_PASSWORD)
    originalSeller = await getUserByUsername(pages.adminPage, adminBaseUrl, adminSession.token, E2E_USERS.seller)
    expect(originalSeller.id, '未找到演示卖家账号').toBeGreaterThan(0)

    await setUserStatus(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, 1)
    await setUserRole(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, 'SELLER')

    sellerSession = await loginAt(pages.sellerPage, sellerBaseUrl, E2E_USERS.seller, E2E_PASSWORD)
    await loginAt(pages.buyerPage, buyerBaseUrl, E2E_USERS.buyer, E2E_PASSWORD)

    await expectStoredUsername(pages.buyerPage, E2E_USERS.buyer, '买家端')
    await expectStoredUsername(pages.sellerPage, E2E_USERS.seller, '卖家端')
    await expectStoredUsername(pages.adminPage, E2E_USERS.admin, '管理员端')

    await pages.buyerPage.reload({ waitUntil: 'domcontentloaded' })
    await pages.sellerPage.reload({ waitUntil: 'domcontentloaded' })
    await pages.adminPage.reload({ waitUntil: 'domcontentloaded' })
    await expectStoredUsername(pages.buyerPage, E2E_USERS.buyer, '买家端刷新后')
    await expectStoredUsername(pages.sellerPage, E2E_USERS.seller, '卖家端刷新后')
    await expectStoredUsername(pages.adminPage, E2E_USERS.admin, '管理员端刷新后')

    await expectRoleDropdownDoesNotMutateOnOpen(pages.adminPage, originalSeller.id)

    await setUserRole(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, 'BUYER')
    await pages.sellerPage.goto(`${sellerBaseUrl}/my-products`, { waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(pages.sellerPage)
    await expect(pages.sellerPage, '卖家被改成买家后刷新卖家页应回到首页').toHaveURL(new RegExp(`${sellerBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`), { timeout: 15_000 })
    await expect(pages.sellerPage.getByTestId('home-view')).toBeVisible({ timeout: 15_000 })
    await expect((await readStoredUser(pages.sellerPage))?.role, '刷新后本地用户角色应来自 /auth/me 最新数据').toBe('BUYER')
    await expectSellerApiForbidden(pages.sellerPage, sellerSession.token)

    await setUserRole(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, 'SELLER')
    await pages.sellerPage.goto(`${sellerBaseUrl}/my-products`, { waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(pages.sellerPage)
    await expect(pages.sellerPage.getByTestId('my-products-view'), '卖家角色恢复后刷新应重新进入卖家商品页').toBeVisible({ timeout: 15_000 })
    await expect((await readStoredUser(pages.sellerPage))?.role, '角色恢复后本地用户角色应同步为 SELLER').toBe('SELLER')

    await setUserStatus(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, 0)
    await pages.sellerPage.goto(`${sellerBaseUrl}/seller-orders`, { waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(pages.sellerPage)
    await expect(pages.sellerPage, '卖家被禁用后刷新受保护页必须回登录页').toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(pages.sellerPage.getByTestId('login-form')).toBeVisible({ timeout: 15_000 })
    await expect(pages.sellerPage.evaluate(() => localStorage.getItem('token')), '禁用账号后前端 token 应清理').resolves.toBeNull()

    await setUserStatus(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, 1)
    await loginAt(pages.sellerPage, sellerBaseUrl, E2E_USERS.seller, E2E_PASSWORD)
    await pages.sellerPage.goto(`${sellerBaseUrl}/seller-orders`, { waitUntil: 'domcontentloaded' })
    await expect(pages.sellerPage.getByTestId('seller-orders-view'), '重新启用后卖家端应可继续演示').toBeVisible({ timeout: 15_000 })

    expectNoUnexpectedBrowserIssues(adminWatchers.consoleErrors, adminWatchers.failedRequests)
    expectNoUnexpectedBrowserIssues(sellerWatchers.consoleErrors, sellerWatchers.failedRequests, [
      /^401 .*\/api\/auth\/me\b/,
      /^403 .*\/api\/products\/my\b/
    ])
    expectNoUnexpectedBrowserIssues(buyerWatchers.consoleErrors, buyerWatchers.failedRequests)
  } finally {
    if (adminSession && originalSeller) {
      await setUserRole(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, originalSeller.role).catch(() => {})
      await setUserStatus(pages.adminPage, adminBaseUrl, adminSession.token, originalSeller.id, originalSeller.status).catch(() => {})
    }
    await closeDemoPages(pages)
  }
})

test('管理员后台视觉门禁：侧栏、表格操作区、确认框和内部枚举都不能出现明显显示问题', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  const adminSession = await loginAt(page, adminBaseUrl, E2E_USERS.admin, E2E_PASSWORD)
  const sellerUser = await getUserByUsername(page, adminBaseUrl, adminSession.token, E2E_USERS.seller)
  await setUserRole(page, adminBaseUrl, adminSession.token, sellerUser.id, 'SELLER')
  await setUserStatus(page, adminBaseUrl, adminSession.token, sellerUser.id, 1)

  try {
    for (const route of adminRoutes) {
      await page.goto(`${adminBaseUrl}${route.path}`, { waitUntil: 'domcontentloaded' })
      await neutralizeFloatingUi(page)
      await expect(page.locator(route.ready), `${route.name}: 页面主体不可见`).toBeVisible({ timeout: 15_000 })
      await expectSidebarBadgesReadable(page)
      await expectVisibleActionButtonsSeparated(page, route.name, route.allowNoRows)

      if (route.path === '/admin/showcase') {
        await expectNoShowcaseEnumLeakage(page)
      }
    }

    await page.goto(`${adminBaseUrl}/admin/users`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('admin-users-view')).toBeVisible({ timeout: 15_000 })
    await page.getByPlaceholder('搜索用户名/邮箱').fill(E2E_USERS.seller)
    await page.getByRole('button', { name: '搜索' }).click()
    const sellerRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(sellerRow).toBeVisible({ timeout: 15_000 })
    await sellerRow.getByRole('button', { name: '禁用' }).click()
    await expectMessageBoxCentered(page, '管理员用户禁用确认框')
    await page.locator('.el-message-box').last().getByRole('button', { name: '取消' }).click()
    await expect(page.locator('.el-message-box')).toHaveCount(0)
    await expect(sellerRow, '取消禁用后状态不应改变').toContainText('正常')

    expectNoUnexpectedBrowserIssues(consoleErrors, failedRequests)
  } finally {
    await setUserRole(page, adminBaseUrl, adminSession.token, sellerUser.id, sellerUser.role).catch(() => {})
    await setUserStatus(page, adminBaseUrl, adminSession.token, sellerUser.id, sellerUser.status).catch(() => {})
  }
})
