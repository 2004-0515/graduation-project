import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  authedDelete,
  authedGet,
  getSession,
  login,
  neutralizeFloatingUi
} from './helpers/session'

type CategoryRecord = {
  id: number
  name: string
}

async function resolveCategory(page: Page) {
  const response = await page.request.get('/api/categories')
  expect(response.ok(), `获取分类失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  expect(payload?.code).toBe(200)
  const categories = Array.isArray(payload?.data) ? (payload.data as CategoryRecord[]) : []
  expect(categories.length, '真实环境中至少需要一个分类供卖家发布商品').toBeGreaterThan(0)
  return categories[0]
}

async function deleteProduct(page: Page, token: string, productId: number) {
  const response = await authedDelete(page.request, token, `/api/products/${productId}`)
  if (!response.ok()) {
    return
  }
  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

test('卖家可在我的商品页发布待审核商品并删除', async ({ page }) => {
  const category = await resolveCategory(page)
  const sellerSession = await getSession(page, E2E_USERS.seller, E2E_PASSWORD)
  const uniqueName = `E2E-MY-PRODUCT-${Date.now()}`
  const uploadImagePath = path.resolve(
    process.cwd(),
    '..',
    'uploads',
    'avatars',
    '2026',
    '05',
    '0836ddae-bd89-45fe-a82f-421e885b8ebf.jpg'
  )
  let createdProductId: number | null = null

  try {
    await login(page, E2E_USERS.seller, E2E_PASSWORD)
    await page.goto('/my-products')
    await neutralizeFloatingUi(page)
    await expect(page.getByTestId('my-products-view')).toBeVisible()

    await page.getByTestId('my-products-open-dialog').click()
    const dialog = page.getByRole('dialog', { name: /发布商品|编辑商品/ })
    await expect(dialog).toBeVisible()

    await dialog.getByPlaceholder('请输入商品名称').fill(uniqueName)
    await dialog.getByTestId('my-product-category-input').click()
    await page.getByText(category.name, { exact: true }).click()
    await dialog.getByRole('spinbutton').nth(0).fill('88')
    await dialog.getByRole('spinbutton').nth(2).fill('5')
    await dialog.getByPlaceholder('请输入商品描述').fill('real-browser-my-products')

    const uploadResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/files/product')
    )
    await dialog.locator('.avatar-uploader input[type="file"]').setInputFiles(uploadImagePath)
    const uploadResponse = await uploadResponsePromise
    expect(uploadResponse.ok(), `上传商品图片失败: ${uploadResponse.status()} ${uploadResponse.url()}`).toBeTruthy()
    await expect(dialog.locator('.image-grid .image-card')).toHaveCount(1)

    const submitResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/products/submit')
    )
    await dialog.getByTestId('my-product-submit').click()
    const submitResponse = await submitResponsePromise
    expect(submitResponse.ok(), `发布商品失败: ${submitResponse.status()} ${submitResponse.url()}`).toBeTruthy()

    const submitPayload = await submitResponse.json()
    expect(submitPayload?.code).toBe(200)
    expect(submitPayload?.message).toContain('等待管理员审核')
    createdProductId = Number(submitPayload?.data?.id || 0)
    expect(createdProductId).toBeGreaterThan(0)

    const productRow = page.getByTestId(`my-product-card-${createdProductId}`)
    await expect(productRow).toBeVisible({ timeout: 15_000 })
    await expect(productRow).toContainText(uniqueName)
    await expect(productRow).toContainText('待审核')
    await expect(page.getByTestId(`my-product-edit-${createdProductId}`)).toBeDisabled()

    const deleteResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' &&
      response.url().includes(`/api/products/${createdProductId}`)
    )
    await page.getByTestId(`my-product-delete-${createdProductId}`).click()
    await page.getByRole('button', { name: '确定' }).click()
    const deleteResponse = await deleteResponsePromise
    expect(deleteResponse.ok(), `删除商品失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()

    const deletePayload = await deleteResponse.json()
    expect(deletePayload?.code).toBe(200)
    await expect(page.getByTestId(`my-product-card-${createdProductId}`)).toHaveCount(0)

    const myProductsResponse = await authedGet(page.request, sellerSession.token, '/api/products/my')
    expect(myProductsResponse.ok()).toBeTruthy()
    const myProductsPayload = await myProductsResponse.json()
    const myProducts = Array.isArray(myProductsPayload?.data) ? myProductsPayload.data : []
    expect(myProducts.some((item: { id?: number }) => Number(item.id || 0) === createdProductId)).toBe(false)
    createdProductId = null
  } finally {
    if (createdProductId) {
      await deleteProduct(page, sellerSession.token, createdProductId).catch(() => {})
    }
  }
})
