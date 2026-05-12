import { expect, test, type Page } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERS, getSession, login, neutralizeFloatingUi } from './helpers/session'

type AddressPayload = {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

async function getAddresses(page: Page, token: string) {
  const response = await page.request.get('/api/addresses', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  expect(response.ok(), `获取地址列表失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  return (payload.data || []) as AddressPayload[]
}

async function setDefaultAddress(page: Page, token: string, addressId: number) {
  const response = await page.request.put(`/api/addresses/${addressId}/default`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  expect(response.ok(), `恢复默认地址失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

async function deleteAddress(page: Page, token: string, addressId: number) {
  const response = await page.request.delete(`/api/addresses/${addressId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  expect(response.ok(), `清理地址失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

async function selectRegion(page: Page) {
  await page.getByPlaceholder('请选择省/市/区').click()
  await page.getByText('广东省', { exact: true }).click()
  await page.getByText('深圳市', { exact: true }).click()
  await page.getByText('南山区', { exact: true }).click()
}

test('用户可在地址页新增、编辑、设为默认并删除地址', async ({ page }) => {
  const session = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)
  const token = session.token
  const originalAddresses = await getAddresses(page, token)
  const originalDefaultAddress = originalAddresses.find((address) => address.isDefault)
  const uniqueSuffix = `${Date.now()}`
  const initialDetail = `科技园 ${uniqueSuffix}`
  const updatedDetail = `科技园更新 ${uniqueSuffix}`
  let createdAddressId: number | null = null

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto('/address')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('address-view')).toBeVisible()

    await page.getByTestId('address-add').click()
    await page.getByPlaceholder('请输入收货人姓名').fill('浏览器测试')
    await page.getByPlaceholder('请输入手机号').fill('13900139000')
    await selectRegion(page)
    await page.getByPlaceholder('请输入详细地址').fill(initialDetail)

    const createAddressResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/addresses')
    )
    await page.getByTestId('address-save').click()
    const createAddressResponse = await createAddressResponsePromise
    expect(createAddressResponse.ok(), `新增地址失败: ${createAddressResponse.status()} ${createAddressResponse.url()}`).toBeTruthy()

    const createAddressPayload = await createAddressResponse.json()
    expect(createAddressPayload?.code).toBe(200)
    createdAddressId = Number(createAddressPayload?.data?.id || 0)
    expect(createdAddressId).toBeGreaterThan(0)

    const createdAddressRow = page.getByTestId(`address-card-${createdAddressId}`)
    await expect(createdAddressRow).toBeVisible({ timeout: 15_000 })
    await expect(createdAddressRow).toContainText(initialDetail)

    await createdAddressRow.getByTestId(`address-edit-${createdAddressId}`).click()
    await page.getByPlaceholder('请输入详细地址').fill(updatedDetail)

    const updateAddressResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/addresses/${createdAddressId}`)
    )
    await page.getByTestId('address-save').click()
    const updateAddressResponse = await updateAddressResponsePromise
    expect(updateAddressResponse.ok(), `编辑地址失败: ${updateAddressResponse.status()} ${updateAddressResponse.url()}`).toBeTruthy()

    const updateAddressPayload = await updateAddressResponse.json()
    expect(updateAddressPayload?.code).toBe(200)
    await expect(createdAddressRow).toContainText(updatedDetail)

    const setDefaultResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/addresses/${createdAddressId}/default`)
    )
    await createdAddressRow.getByTestId(`address-set-default-${createdAddressId}`).click()
    const setDefaultResponse = await setDefaultResponsePromise
    expect(setDefaultResponse.ok(), `设置默认地址失败: ${setDefaultResponse.status()} ${setDefaultResponse.url()}`).toBeTruthy()

    const setDefaultPayload = await setDefaultResponse.json()
    expect(setDefaultPayload?.code).toBe(200)
    await expect(createdAddressRow).toContainText('默认')

    const deleteAddressResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' &&
      response.url().includes(`/api/addresses/${createdAddressId}`)
    )
    await createdAddressRow.getByTestId(`address-delete-${createdAddressId}`).click()
    await page.getByRole('button', { name: '确定' }).click()
    const deleteAddressResponse = await deleteAddressResponsePromise
    expect(deleteAddressResponse.ok(), `删除地址失败: ${deleteAddressResponse.status()} ${deleteAddressResponse.url()}`).toBeTruthy()

    const deleteAddressPayload = await deleteAddressResponse.json()
    expect(deleteAddressPayload?.code).toBe(200)
    await expect(page.getByTestId(`address-card-${createdAddressId}`)).toHaveCount(0)
    createdAddressId = null
  } finally {
    if (createdAddressId) {
      await deleteAddress(page, token, createdAddressId).catch(() => {})
    }
    if (originalDefaultAddress?.id) {
      await setDefaultAddress(page, token, originalDefaultAddress.id).catch(() => {})
    }
  }
})
