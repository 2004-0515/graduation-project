import { expect, test } from '@playwright/test'
import {
  authedDelete,
  authedGet,
  confirmMessageBox,
  E2E_PASSWORD,
  E2E_USERS,
  getMessageBox,
  getSession,
  openAdminPage,
  logout,
  neutralizeFloatingUi
} from './helpers/session'

test('用户可提交留言，管理员可处理并删除', async ({ page }) => {
  const adminSession = await getSession(page, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E留言${Date.now()}`
  const uniqueContent = `real-browser-contact-${Date.now()}`
  let messageId: number | null = null

  try {
    await page.goto('/contact')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('contact-view')).toBeVisible()

    await page.getByPlaceholder('请输入姓名').fill(uniqueName)
    await page.getByPlaceholder('手机号或邮箱').fill('e2e-contact@example.com')
    await page.getByTestId('contact-type').scrollIntoViewIfNeeded()
    await page.getByTestId('contact-type').click()
    await page.getByText('投诉建议').click()
    await page.getByPlaceholder('请详细描述您的问题').fill(uniqueContent)

    await page.getByTestId('contact-submit').click()
    await expect(page.getByText('留言提交成功，我们会尽快回复您')).toBeVisible({ timeout: 15_000 })

    const listResponse = await authedGet(page.request, adminSession.token, '/api/contact-messages/admin')
    expect(listResponse.ok(), `获取留言列表失败: ${listResponse.status()} ${listResponse.url()}`).toBeTruthy()
    const listPayload = await listResponse.json()
    expect(listPayload?.code).toBe(200)
    const messages = Array.isArray(listPayload?.data) ? listPayload.data : []
    const createdMessage = messages.find((item: any) => item.content === uniqueContent)
    expect(createdMessage, '后台未找到刚提交的留言').toBeTruthy()
    messageId = Number(createdMessage.id)

    await openAdminPage(page, '/admin/contact-messages', { testId: 'admin-contact-messages-view' })

    let messageRow = page.locator('.el-table__row', { hasText: uniqueContent }).first()
    await expect(messageRow).toBeVisible({ timeout: 15_000 })
    await expect(messageRow).toContainText('待处理')

    await messageRow.getByRole('button', { name: '标记已处理' }).click()
    await expect(page.getByText('留言状态更新成功')).toBeVisible()

    messageRow = page.locator('.el-table__row', { hasText: uniqueContent }).first()
    await expect(messageRow).toContainText('已处理')

    await messageRow.getByRole('button', { name: '删除' }).click()
    const confirmDialog = getMessageBox(page)
    const deleteResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' &&
      response.url().includes(`/api/contact-messages/admin/${messageId}`)
    )
    await confirmMessageBox(page)
    const deleteResponse = await deleteResponsePromise
    expect(deleteResponse.ok(), `删除留言请求失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
    await expect(confirmDialog).toBeHidden({ timeout: 10_000 })
    await expect(page.getByText('留言删除成功').or(page.getByText('删除成功'))).toBeVisible()
    await expect(page.locator('.el-table__row', { hasText: uniqueContent })).toHaveCount(0)

    messageId = null
    await logout(page)
  } finally {
    if (messageId) {
      await authedDelete(page.request, adminSession.token, `/api/contact-messages/admin/${messageId}`).catch(() => {})
    }
  }
})
