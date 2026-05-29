import { expect, test, type Locator } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

async function expectActionButtonsSpaced(scope: Locator) {
  const buttons = [
    scope.getByRole('button', { name: '编辑' }).first(),
    scope.getByRole('button', { name: '删除' }).first()
  ]
  const boxes = []

  for (const button of buttons) {
    await expect(button).toBeVisible()
    const box = await button.boundingBox()
    expect(box, '无法读取展示内容操作按钮位置').toBeTruthy()
    boxes.push(box!)
  }

  const sameLine = Math.abs(boxes[1].y - boxes[0].y) < 8
  if (sameLine) {
    const gap = boxes[1].x - (boxes[0].x + boxes[0].width)
    expect(gap, '展示内容操作按钮过挤').toBeGreaterThanOrEqual(8)
  }
}

test('展示内容管理页隐藏内部跳转枚举，并保持表格操作区清晰', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await login(page, E2E_USERS.admin, E2E_PASSWORD)
  await page.goto('/admin/showcase')
  await neutralizeFloatingUi(page)
  await expect(page.locator('.showcase-manage')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: '展示内容管理' })).toBeVisible()

  const firstRow = page.locator('.el-table__row').first()
  await expect(firstRow).toBeVisible({ timeout: 15_000 })

  const targetTexts = (await page.locator('.target-cell').allTextContents()).join('\n')
  expect(targetTexts, '跳转目标列不应直接暴露内部枚举 CATEGORY/PRODUCT/PROMOTION').not.toMatch(/\b(CATEGORY|PRODUCT|PROMOTION|ROUTE|URL|NONE)\b/)
  expect(targetTexts, '跳转目标列应显示面向演示的中文含义').toMatch(/分类页|商品详情|活动专题|站内页面|外部链接|无跳转/)

  await expectActionButtonsSpaced(firstRow)
  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
