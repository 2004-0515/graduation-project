import { expect, test, type Locator } from '@playwright/test'
import {
  authedPut,
  confirmMessageBox,
  E2E_PASSWORD,
  E2E_USERS,
  getSession,
  openAdminPage,
  logout
} from './helpers/session'

async function expectActionButtonsSpaced(userRow: Locator, statusActionName: '禁用' | '启用') {
  const buttonNames = ['详情', '角色', '重置券', statusActionName]
  const boxes = []

  for (const buttonName of buttonNames) {
    const button = userRow.getByRole('button', { name: buttonName })
    await expect(button, `用户操作按钮不可见: ${buttonName}`).toBeVisible()
    const box = await button.boundingBox()
    expect(box, `无法读取用户操作按钮位置: ${buttonName}`).toBeTruthy()
    boxes.push({ name: buttonName, box: box! })
  }

  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1]
    const current = boxes[index]
    const sameLine = Math.abs(current.box.y - previous.box.y) < 8
    if (!sameLine) {
      continue
    }
    const gap = current.box.x - (previous.box.x + previous.box.width)
    expect(gap, `用户操作按钮过挤: ${previous.name} -> ${current.name}`).toBeGreaterThanOrEqual(8)
  }
}

async function expectSidebarBadgesConsistent(page: import('@playwright/test').Page) {
  const badges = page.locator('.admin-sidebar .nav-icon')
  const badgeTexts = await badges.allTextContents()

  expect(badgeTexts).toContain('仪表盘')
  expect(badgeTexts).toEqual(expect.arrayContaining(['商品', '分类', '订单', '用户', '审核', '展示', '消息', '留言', '促销', '音乐', '价格', '理性']))
  expect(badgeTexts).not.toEqual(expect.arrayContaining(['展', '联', '券', '乐', '价', '理']))

  const twoCharBadges = badges.filter({ hasNotText: '仪表盘' })
  const boxes = await twoCharBadges.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, text: element.textContent?.trim() || '' }
    })
  )

  for (const box of boxes) {
    expect(box.text.length, `侧边栏短标识应为两个字: ${box.text}`).toBe(2)
    expect(box.width, `侧边栏短标识宽度异常: ${box.text}`).toBeGreaterThanOrEqual(34)
  }
}

test('管理员可搜索用户并禁用后再恢复', async ({ page, browser }) => {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const sellerUserId = Number((sellerSession.user as { id?: number }).id || 0)
  expect(sellerUserId).toBeGreaterThan(0)

  const resetStatus = async (status: number) => {
    const response = await authedPut(page.request, adminSession.token, `/api/users/${sellerUserId}/status`, { status })
    expect(response.ok(), `重置用户状态失败: ${response.status()} ${response.url()}`).toBeTruthy()
  }

  await resetStatus(1)

  try {
    await openAdminPage(page, '/admin', { heading: '数据概览' })
    await expectSidebarBadgesConsistent(page)
    await page.getByRole('link', { name: /用户管理/ }).click()
    await page.waitForURL(/\/admin\/users$/)
    await expect(page.getByTestId('admin-users-view')).toBeVisible()

    await page.getByPlaceholder('搜索用户名/邮箱').fill(E2E_USERS.seller)
    await page.getByRole('button', { name: '搜索' }).click()

    let userRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(userRow).toBeVisible({ timeout: 15_000 })
    await expect(userRow).toContainText('正常')
    await expectActionButtonsSpaced(userRow, '禁用')

    const disableResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/users/${sellerUserId}/status`)
    )
    await userRow.getByRole('button', { name: '禁用' }).click()
    await confirmMessageBox(page)
    const disableResponse = await disableResponsePromise
    expect(disableResponse.ok(), `禁用用户失败: ${disableResponse.status()} ${disableResponse.url()}`).toBeTruthy()
    await expect(page.getByText('用户已禁用')).toBeVisible({ timeout: 15_000 })

    userRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(userRow).toContainText('禁用')
    await expect(userRow.getByRole('button', { name: '启用' })).toBeVisible()
    await expectActionButtonsSpaced(userRow, '启用')

    const disabledTokenResponse = await page.request.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${sellerSession.token}`
      }
    })
    expect(disabledTokenResponse.status(), '已禁用账号的既有 token 应立即失效').toBe(401)
    const disabledTokenPayload = await disabledTokenResponse.json()
    expect(disabledTokenPayload?.message).toContain('账号已被禁用')

    const disabledLoginResponse = await page.request.post('/api/auth/login', {
      data: {
        username: E2E_USERS.seller,
        password: E2E_PASSWORD
      }
    })
    const disabledLoginPayload = await disabledLoginResponse.json()
    expect(disabledLoginPayload?.code, '已禁用账号不应重新登录').toBe(401)
    expect(disabledLoginPayload?.message).toContain('账号已被禁用')

    const sellerContext = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173'
    })
    const sellerPage = await sellerContext.newPage()
    try {
      await sellerPage.goto('/')
      await sellerPage.evaluate(({ token, user }) => {
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(user))
      }, sellerSession)
      await sellerPage.goto('/my-products')
      await expect(sellerPage, '已禁用卖家刷新受保护页面后应回到登录页').toHaveURL(/\/login/, { timeout: 15_000 })
    } finally {
      await sellerContext.close()
    }

    const enableResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/users/${sellerUserId}/status`)
    )
    await userRow.getByRole('button', { name: '启用' }).click()
    await confirmMessageBox(page)
    const enableResponse = await enableResponsePromise
    expect(enableResponse.ok(), `启用用户失败: ${enableResponse.status()} ${enableResponse.url()}`).toBeTruthy()
    await expect(page.getByText('用户已启用')).toBeVisible({ timeout: 15_000 })

    userRow = page.locator('.el-table__row', { hasText: E2E_USERS.seller }).first()
    await expect(userRow).toContainText('正常')

    await logout(page)
  } finally {
    await resetStatus(1)
  }
})
