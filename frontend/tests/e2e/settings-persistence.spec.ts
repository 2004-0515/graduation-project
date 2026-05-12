import { expect, test, type Page } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERS, getSession, login, logout, neutralizeFloatingUi } from './helpers/session'

type NotificationSettingsPayload = {
  orderStatusEnabled: boolean
  deliveryEnabled: boolean
  promotionsEnabled: boolean
  newProductsEnabled: boolean
  systemEnabled: boolean
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  notificationFrequency: string
  notifyStartTime: number
  notifyEndTime: number
}

type PrivacySettingsPayload = {
  profileVisibility: 'public' | 'friends' | 'private'
}

const privacyLabelMap: Record<PrivacySettingsPayload['profileVisibility'], string> = {
  public: '所有人',
  friends: '仅好友',
  private: '仅自己'
}

async function getSettings<T>(page: Page, token: string, url: string) {
  let response
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await page.request.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.ok() || response.status() !== 429 || attempt === 2) {
      break
    }
    await page.waitForTimeout(1_500)
  }
  expect(response.ok(), `获取设置失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return payload.data as T
}

async function putSettings(page: Page, token: string, url: string, data: unknown) {
  let response
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await page.request.put(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data
    })
    if (response.ok() || response.status() !== 429 || attempt === 2) {
      break
    }
    await page.waitForTimeout(1_500)
  }
  expect(response.ok(), `恢复设置失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

test('设置页会把通知与隐私设置真实持久化并在刷新后保持一致', async ({ page }) => {
  const session = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const token = session.token
  const originalNotificationSettings = await getSettings<NotificationSettingsPayload>(
    page,
    token,
    '/api/notification-settings/me'
  )
  const originalPrivacySettings = await getSettings<PrivacySettingsPayload>(
    page,
    token,
    '/api/privacy-settings/me'
  )

  const targetPrivacy: PrivacySettingsPayload['profileVisibility'] =
    originalPrivacySettings.profileVisibility === 'private' ? 'public' : 'private'
  const targetOrderNotify = !originalNotificationSettings.orderStatusEnabled

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)

    await page.goto('/settings?section=privacy')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('settings-section-privacy')).toBeVisible()

    const privacySelect = page.getByTestId('settings-privacy-visibility')
    const savePrivacyResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes('/api/privacy-settings/me')
    )

    await privacySelect.click()
    const visiblePrivacyOption = page.locator('.el-select-dropdown:visible').getByText(privacyLabelMap[targetPrivacy], {
      exact: true
    })
    await visiblePrivacyOption.click()
    const savePrivacyResponse = await savePrivacyResponsePromise
    expect(savePrivacyResponse.ok(), `保存隐私设置失败: ${savePrivacyResponse.status()} ${savePrivacyResponse.url()}`).toBeTruthy()
    const savePrivacyPayload = await savePrivacyResponse.json()
    expect(savePrivacyPayload?.code).toBe(200)
    expect(savePrivacyPayload?.data?.profileVisibility).toBe(targetPrivacy)

    await expect(privacySelect).toContainText(privacyLabelMap[targetPrivacy])
    const privacySettingsAfterSave = await getSettings<PrivacySettingsPayload>(page, token, '/api/privacy-settings/me')
    expect(privacySettingsAfterSave.profileVisibility).toBe(targetPrivacy)

    const reloadPrivacyResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'GET' &&
      response.url().includes('/api/privacy-settings/me')
    )
    await page.reload()
    const reloadPrivacyResponse = await reloadPrivacyResponsePromise
    expect(reloadPrivacyResponse.ok(), `刷新隐私设置失败: ${reloadPrivacyResponse.status()} ${reloadPrivacyResponse.url()}`).toBeTruthy()
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('settings-section-privacy')).toBeVisible()
    await expect(page.getByTestId('settings-privacy-visibility')).toContainText(privacyLabelMap[targetPrivacy])

    await page.goto('/settings?section=notification')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('settings-section-notification')).toBeVisible()

    const orderNotifySwitch = page.getByTestId('settings-notify-switch-order')
    const orderNotifySwitchAria = page.getByTestId('settings-notify-item-order').getByRole('switch')
    const saveNotificationResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes('/api/notification-settings/me')
    )

    await orderNotifySwitch.click()
    const saveNotificationResponse = await saveNotificationResponsePromise
    expect(
      saveNotificationResponse.ok(),
      `保存通知设置失败: ${saveNotificationResponse.status()} ${saveNotificationResponse.url()}`
    ).toBeTruthy()
    const saveNotificationPayload = await saveNotificationResponse.json()
    expect(saveNotificationPayload?.code).toBe(200)
    expect(saveNotificationPayload?.data?.orderStatusEnabled).toBe(targetOrderNotify)

    await expect(orderNotifySwitchAria).toHaveAttribute('aria-checked', String(targetOrderNotify))
    const notificationSettingsAfterSave = await getSettings<NotificationSettingsPayload>(
      page,
      token,
      '/api/notification-settings/me'
    )
    expect(notificationSettingsAfterSave.orderStatusEnabled).toBe(targetOrderNotify)

    const reloadNotificationResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'GET' &&
      response.url().includes('/api/notification-settings/me')
    )
    await page.reload()
    const reloadNotificationResponse = await reloadNotificationResponsePromise
    expect(
      reloadNotificationResponse.ok(),
      `刷新通知设置失败: ${reloadNotificationResponse.status()} ${reloadNotificationResponse.url()}`
    ).toBeTruthy()
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('settings-section-notification')).toBeVisible()
    await expect(page.getByTestId('settings-notify-item-order').getByRole('switch')).toHaveAttribute(
      'aria-checked',
      String(targetOrderNotify)
    )

    await logout(page)
  } finally {
    await putSettings(page, token, '/api/privacy-settings/me', originalPrivacySettings)
    await putSettings(page, token, '/api/notification-settings/me', originalNotificationSettings)
  }
})
