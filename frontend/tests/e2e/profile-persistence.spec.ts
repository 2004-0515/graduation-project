import { expect, test, type Page } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERS, getSession, login, neutralizeFloatingUi } from './helpers/session'

type CurrentUserPayload = {
  username: string
  nickname?: string | null
  bio?: string | null
}

async function getCurrentUser(page: Page, token: string) {
  const response = await page.request.get('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  expect(response.ok(), `获取当前用户失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return payload.data as CurrentUserPayload
}

async function restoreCurrentUser(page: Page, token: string, data: Pick<CurrentUserPayload, 'nickname' | 'bio'>) {
  const response = await page.request.put('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data
  })
  expect(response.ok(), `恢复当前用户资料失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

test('个人资料页会真实保存昵称和简介并在刷新后保持一致', async ({ page }) => {
  test.setTimeout(180_000)
  const session = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const token = session.token
  const originalUser = await getCurrentUser(page, token)
  const targetNickname = `${originalUser.nickname || originalUser.username}-E2E`
  const targetBio = `${originalUser.bio || '资料已更新'} [E2E]`

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto('/profile')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('profile-view')).toBeVisible()

    const nicknameInput = page.getByPlaceholder('设置展示昵称')
    const bioInput = page.getByPlaceholder('简单介绍一下自己')

    await nicknameInput.fill(targetNickname)
    await bioInput.fill(targetBio)

    const saveProfileResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes('/api/auth/me')
    )
    await page.getByTestId('profile-save').click()
    const saveProfileResponse = await saveProfileResponsePromise
    expect(saveProfileResponse.ok(), `保存个人资料失败: ${saveProfileResponse.status()} ${saveProfileResponse.url()}`).toBeTruthy()

    const saveProfilePayload = await saveProfileResponse.json()
    expect(saveProfilePayload?.code).toBe(200)
    expect(saveProfilePayload?.data?.nickname).toBe(targetNickname)
    expect(saveProfilePayload?.data?.bio).toBe(targetBio)

    await expect(page.getByText('个人资料已保存')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('profile-display-name')).toContainText(targetNickname)

    const currentUserAfterSave = await getCurrentUser(page, token)
    expect(currentUserAfterSave.nickname).toBe(targetNickname)
    expect(currentUserAfterSave.bio).toBe(targetBio)

    await page.reload()
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('profile-view')).toBeVisible()
    await expect(page.getByTestId('profile-display-name')).toContainText(targetNickname)
    await expect(page.getByPlaceholder('设置展示昵称')).toHaveValue(targetNickname)
    await expect(page.getByPlaceholder('简单介绍一下自己')).toHaveValue(targetBio)

  } finally {
    await restoreCurrentUser(page, token, {
      nickname: originalUser.nickname || '',
      bio: originalUser.bio || ''
    })
  }
})
