import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  authedDelete,
  authedGet,
  authedPost,
  expectMessageBoxCentered,
  expectNoBlockingBrowserIssues,
  getMessageBox,
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
  expect(categories.length, '卖家上架演示至少需要一个有效分类').toBeGreaterThan(0)
  return categories[0]
}

async function expectSellerProductAbsent(page: Page, token: string, name: string) {
  const response = await authedGet(page.request, token, '/api/products/my')
  expect(response.ok(), `获取我的商品失败: ${response.status()} ${response.url()}`).toBeTruthy()

  const payload = await response.json()
  const products = Array.isArray(payload?.data) ? payload.data : []
  expect(products.some((item: { name?: string }) => item.name === name)).toBe(false)
}

async function fillSellerProductForm(page: Page, category: CategoryRecord, productName: string) {
  const dialog = page.getByRole('dialog', { name: /发布商品|编辑商品/ })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  await dialog.getByPlaceholder('请输入商品名称').fill(productName)
  await dialog.getByTestId('my-product-category-input').click()
  await page.getByText(category.name, { exact: true }).click()
  await dialog.getByRole('spinbutton').nth(0).fill('88')
  await dialog.getByRole('spinbutton').nth(2).fill('7')
  await dialog.getByPlaceholder('请输入商品描述').fill('卖家三端演示硬化临时商品，用于验证上架、审核和刷新一致性。')
}

async function uploadSellerProductImage(page: Page, uploadImagePath: string) {
  const dialog = page.getByRole('dialog', { name: /发布商品|编辑商品/ })
  const uploadResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/files/product')
  )
  await dialog.locator('.avatar-uploader input[type="file"]').setInputFiles(uploadImagePath)
  const uploadResponse = await uploadResponsePromise
  expect(uploadResponse.ok(), `上传商品图片失败: ${uploadResponse.status()} ${uploadResponse.url()}`).toBeTruthy()
  await expect(dialog.locator('.image-grid .image-card')).toHaveCount(1, { timeout: 10_000 })
}

test('卖家上架演示硬化：选图不提交、取消不变更、重复提交不重复创建、审核后三端刷新一致', async ({ browser }) => {
  test.setTimeout(240_000)

  const sellerContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const sellerPage = await sellerContext.newPage()
  const adminPage = await adminContext.newPage()
  const buyerPage = await buyerContext.newPage()

  const sellerWatchers = attachPageWatchers(sellerPage)
  const adminWatchers = attachPageWatchers(adminPage)
  const buyerWatchers = attachPageWatchers(buyerPage)

  const category = await resolveCategory(sellerPage)
  const sellerSession = await getSession(sellerPage, E2E_USERS.seller, E2E_PASSWORD)
  const adminSession = await getSession(adminPage, E2E_USERS.admin, E2E_PASSWORD)
  const uniqueName = `E2E-SELLER-DEMO-${Date.now()}`
  const editedName = `${uniqueName}-EDITED`
  const uploadImagePath = path.resolve(
    process.cwd(),
    '..',
    'uploads',
    'avatars',
    '2026',
    '05',
    '0836ddae-bd89-45fe-a82f-421e885b8ebf.jpg'
  )

  let submitRequests = 0
  let auditRequests = 0
  let deleteRequests = 0
  let createdProductId: number | null = null
  let productDeleted = false
  let buyerToken: string | null = null

  sellerPage.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/products/submit')) {
      submitRequests += 1
    }
    if (request.method() === 'DELETE' && createdProductId && request.url().includes(`/api/products/${createdProductId}`)) {
      deleteRequests += 1
    }
  })
  adminPage.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/products/') && request.url().includes('/audit')) {
      auditRequests += 1
    }
  })

  try {
    await login(sellerPage, E2E_USERS.seller, E2E_PASSWORD)
    await sellerPage.goto('/my-products', { waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(sellerPage)
    await expect(sellerPage.getByTestId('my-products-view')).toBeVisible({ timeout: 15_000 })

    await sellerPage.getByTestId('my-products-open-dialog').click()
    await fillSellerProductForm(sellerPage, category, uniqueName)
    await uploadSellerProductImage(sellerPage, uploadImagePath)
    expect(submitRequests, '只选择商品图片不应提交商品审核').toBe(0)

    await sellerPage.getByTestId('my-product-cancel').click()
    await expect(sellerPage.getByRole('dialog', { name: /发布商品|编辑商品/ })).toHaveCount(0)
    await expectSellerProductAbsent(sellerPage, sellerSession.token, uniqueName)

    await sellerPage.getByTestId('my-products-open-dialog').click()
    await fillSellerProductForm(sellerPage, category, uniqueName)
    await uploadSellerProductImage(sellerPage, uploadImagePath)

    const submitResponsePromise = sellerPage.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/products/submit')
    )
    const submitButton = sellerPage.getByTestId('my-product-submit')
    await Promise.all([
      submitButton.click(),
      submitButton.click().catch(() => null)
    ])
    const submitResponse = await submitResponsePromise
    expect(submitResponse.ok(), `发布商品失败: ${submitResponse.status()} ${submitResponse.url()}`).toBeTruthy()
    await sellerPage.waitForTimeout(700)
    expect(submitRequests, '重复点击提交审核不应创建重复商品').toBe(1)

    const submitPayload = await submitResponse.json()
    expect(submitPayload?.code).toBe(200)
    createdProductId = Number(submitPayload?.data?.id || 0)
    expect(createdProductId).toBeGreaterThan(0)

    const productCard = sellerPage.getByTestId(`my-product-card-${createdProductId}`)
    await expect(productCard).toBeVisible({ timeout: 15_000 })
    await expect(productCard).toContainText(uniqueName)
    await expect(productCard).toContainText('待审核')
    await expect(sellerPage.getByTestId(`my-product-edit-${createdProductId}`)).toBeDisabled()

    await sellerPage.getByTestId(`my-product-delete-${createdProductId}`).click()
    await expectMessageBoxCentered(sellerPage, '卖家商品删除取消')
    await getMessageBox(sellerPage).getByRole('button', { name: '取消' }).click()
    await expect(sellerPage.locator('.el-message-box')).toHaveCount(0)
    expect(deleteRequests, '删除确认框点取消不应删除商品').toBe(0)
    await expect(productCard).toBeVisible()

    await login(adminPage, E2E_USERS.admin, E2E_PASSWORD)
    await adminPage.goto('/admin/products?tab=pending', { waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(adminPage)
    await expect(adminPage.getByTestId('admin-products-view')).toBeVisible({ timeout: 15_000 })
    await adminPage.getByPlaceholder('搜索商品名称').fill(uniqueName)
    await adminPage.getByPlaceholder('搜索商品名称').press('Enter')

    const pendingRow = adminPage.locator('.el-table__row', { hasText: uniqueName }).first()
    await expect(pendingRow).toBeVisible({ timeout: 15_000 })
    await expect(pendingRow).toContainText('待审核')

    await pendingRow.getByRole('button', { name: '通过' }).click()
    await expectMessageBoxCentered(adminPage, '管理员商品审核取消')
    await getMessageBox(adminPage).getByRole('button', { name: '取消' }).click()
    await expect(adminPage.locator('.el-message-box')).toHaveCount(0)
    expect(auditRequests, '审核确认框点取消不应变更审核状态').toBe(0)
    await expect(pendingRow).toBeVisible()

    const auditResponsePromise = adminPage.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/api/products/${createdProductId}/audit`)
    )
    await pendingRow.getByRole('button', { name: '通过' }).click()
    await expectMessageBoxCentered(adminPage, '管理员商品审核确认')
    await getMessageBox(adminPage).getByRole('button', { name: '确定' }).click()
    const auditResponse = await auditResponsePromise
    expect(auditResponse.ok(), `审核商品失败: ${auditResponse.status()} ${auditResponse.url()}`).toBeTruthy()
    const auditPayload = await auditResponse.json()
    expect(auditPayload?.code).toBe(200)
    expect(auditRequests).toBe(1)

    await sellerPage.reload({ waitUntil: 'domcontentloaded' })
    await expect(sellerPage.getByTestId(`my-product-card-${createdProductId}`)).toContainText('已通过', { timeout: 15_000 })
    await expect(sellerPage.getByTestId(`my-product-edit-${createdProductId}`)).toBeEnabled()

    const buyerSession = await login(buyerPage, E2E_USERS.buyer, E2E_PASSWORD)
    buyerToken = buyerSession.token
    await authedDelete(buyerPage.request, buyerToken, '/api/cart/clear').catch(() => {})
    await buyerPage.goto(`/category?keyword=${encodeURIComponent(uniqueName)}`, { waitUntil: 'domcontentloaded' })
    await neutralizeFloatingUi(buyerPage)
    await expect(buyerPage.getByTestId('category-view')).toBeVisible({ timeout: 15_000 })
    await buyerPage.reload({ waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId(`category-product-${createdProductId}`)).toBeVisible({ timeout: 15_000 })

    await sellerPage.getByTestId(`my-product-edit-${createdProductId}`).click()
    const editDialog = sellerPage.getByRole('dialog', { name: /发布商品|编辑商品/ })
    await expect(editDialog).toBeVisible({ timeout: 10_000 })
    await editDialog.getByPlaceholder('请输入商品名称').fill(editedName)
    await sellerPage.getByTestId('my-product-price-input').locator('input').fill('96')
    await sellerPage.getByTestId('my-product-stock-input').locator('input').fill('9')

    const editResponsePromise = sellerPage.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/products/${createdProductId}`)
    )
    await sellerPage.getByTestId('my-product-submit').click()
    const editResponse = await editResponsePromise
    expect(editResponse.ok(), `编辑商品失败: ${editResponse.status()} ${editResponse.url()}`).toBeTruthy()
    const editPayload = await editResponse.json()
    expect(editPayload?.code).toBe(200)

    const editedProductCard = sellerPage.getByTestId(`my-product-card-${createdProductId}`)
    await expect(editedProductCard).toContainText(editedName, { timeout: 15_000 })
    await expect(editedProductCard).toContainText('待审核')
    await expect(editedProductCard).toContainText('待审核价格')
    await expect(sellerPage.getByTestId(`my-product-edit-${createdProductId}`)).toBeDisabled()

    await buyerPage.goto(`/category?keyword=${encodeURIComponent(editedName)}`, { waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId('category-view')).toBeVisible({ timeout: 15_000 })
    await expect(buyerPage.getByTestId(`category-product-${createdProductId}`)).toHaveCount(0)

    await buyerPage.goto(`/product/${createdProductId}`, { waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId('product-unavailable')).toBeVisible({ timeout: 15_000 })
    await expect(buyerPage.getByTestId('product-add-to-cart')).toHaveCount(0)
    const pendingCartResponse = await authedPost(buyerPage.request, buyerToken, '/api/cart', {
      productId: createdProductId,
      quantity: 1
    })
    expect(pendingCartResponse.ok(), `待审核商品加购请求异常: ${pendingCartResponse.status()} ${pendingCartResponse.url()}`).toBeTruthy()
    const pendingCartPayload = await pendingCartResponse.json()
    expect(pendingCartPayload?.code, '待审核商品不应允许加入购物车').not.toBe(200)

    await adminPage.goto('/admin/products?tab=pending', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByTestId('admin-products-view')).toBeVisible({ timeout: 15_000 })
    await adminPage.getByPlaceholder('搜索商品名称').fill(editedName)
    await adminPage.getByPlaceholder('搜索商品名称').press('Enter')
    const editedPendingRow = adminPage.locator('.el-table__row', { hasText: editedName }).first()
    await expect(editedPendingRow).toBeVisible({ timeout: 15_000 })

    const rejectDialogRequestsBefore = auditRequests
    await editedPendingRow.getByRole('button', { name: '拒绝' }).click()
    await expect(adminPage.getByRole('dialog', { name: '拒绝原因' })).toBeVisible({ timeout: 10_000 })
    await adminPage.getByRole('dialog', { name: '拒绝原因' }).getByRole('button', { name: '取消' }).click()
    await expect(adminPage.getByRole('dialog', { name: '拒绝原因' })).toHaveCount(0)
    expect(auditRequests, '拒绝弹窗关闭不应变更审核状态').toBe(rejectDialogRequestsBefore)
    await expect(editedPendingRow).toBeVisible()

    const rejectResponsePromise = adminPage.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/api/products/${createdProductId}/audit`)
    )
    await editedPendingRow.getByRole('button', { name: '拒绝' }).click()
    const rejectDialog = adminPage.getByRole('dialog', { name: '拒绝原因' })
    await expect(rejectDialog).toBeVisible({ timeout: 10_000 })
    await rejectDialog.getByPlaceholder('请输入拒绝原因（可选）').fill('演示验证：拒绝后买家不可见')
    await rejectDialog.getByRole('button', { name: '确认拒绝' }).click()
    const rejectResponse = await rejectResponsePromise
    expect(rejectResponse.ok(), `拒绝商品失败: ${rejectResponse.status()} ${rejectResponse.url()}`).toBeTruthy()
    const rejectPayload = await rejectResponse.json()
    expect(rejectPayload?.code).toBe(200)

    await sellerPage.reload({ waitUntil: 'domcontentloaded' })
    await expect(sellerPage.getByTestId(`my-product-card-${createdProductId}`)).toContainText('已拒绝', { timeout: 15_000 })
    await expect(sellerPage.getByTestId(`my-product-card-${createdProductId}`)).toContainText('拒绝原因')

    await buyerPage.goto(`/category?keyword=${encodeURIComponent(editedName)}`, { waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId(`category-product-${createdProductId}`)).toHaveCount(0)
    await buyerPage.goto(`/product/${createdProductId}`, { waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId('product-unavailable')).toBeVisible({ timeout: 15_000 })

    await sellerPage.getByTestId(`my-product-edit-${createdProductId}`).click()
    await expect(editDialog).toBeVisible({ timeout: 10_000 })
    await editDialog.getByPlaceholder('请输入商品描述').fill('拒绝后重新修改并提交，用于验证管理员再审核通过后三端刷新一致。')
    const resubmitResponsePromise = sellerPage.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/products/${createdProductId}`)
    )
    await sellerPage.getByTestId('my-product-submit').click()
    const resubmitResponse = await resubmitResponsePromise
    expect(resubmitResponse.ok(), `重新提交商品失败: ${resubmitResponse.status()} ${resubmitResponse.url()}`).toBeTruthy()
    await expect(sellerPage.getByTestId(`my-product-card-${createdProductId}`)).toContainText('待审核', { timeout: 15_000 })

    await adminPage.goto('/admin/products?tab=pending', { waitUntil: 'domcontentloaded' })
    await adminPage.getByPlaceholder('搜索商品名称').fill(editedName)
    await adminPage.getByPlaceholder('搜索商品名称').press('Enter')
    const resubmittedRow = adminPage.locator('.el-table__row', { hasText: editedName }).first()
    await expect(resubmittedRow).toBeVisible({ timeout: 15_000 })
    const finalAuditResponsePromise = adminPage.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/api/products/${createdProductId}/audit`)
    )
    await resubmittedRow.getByRole('button', { name: '通过' }).click()
    await expectMessageBoxCentered(adminPage, '管理员重新审核通过确认')
    await getMessageBox(adminPage).getByRole('button', { name: '确定' }).click()
    const finalAuditResponse = await finalAuditResponsePromise
    expect(finalAuditResponse.ok(), `重新审核商品失败: ${finalAuditResponse.status()} ${finalAuditResponse.url()}`).toBeTruthy()

    await sellerPage.reload({ waitUntil: 'domcontentloaded' })
    await expect(sellerPage.getByTestId(`my-product-card-${createdProductId}`)).toContainText('已通过', { timeout: 15_000 })

    await buyerPage.goto(`/category?keyword=${encodeURIComponent(editedName)}`, { waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId(`category-product-${createdProductId}`)).toBeVisible({ timeout: 15_000 })
    await buyerPage.goto(`/product/${createdProductId}`, { waitUntil: 'domcontentloaded' })
    await expect(buyerPage.getByTestId('product-detail-view')).toBeVisible({ timeout: 15_000 })
    await expect(buyerPage.getByTestId('product-unavailable')).toHaveCount(0)
    const addToCartResponsePromise = buyerPage.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/cart')
    )
    await buyerPage.getByTestId('product-add-to-cart').click()
    const addToCartResponse = await addToCartResponsePromise
    expect(addToCartResponse.ok(), `审核通过后加购失败: ${addToCartResponse.status()} ${addToCartResponse.url()}`).toBeTruthy()
    const addToCartPayload = await addToCartResponse.json()
    expect(addToCartPayload?.code).toBe(200)
    await authedDelete(buyerPage.request, buyerToken, '/api/cart/clear').catch(() => {})

    const deleteResponse = await authedDelete(adminPage.request, adminSession.token, `/api/products/${createdProductId}`)
    expect(deleteResponse.ok(), `清理临时商品失败: ${deleteResponse.status()} ${deleteResponse.url()}`).toBeTruthy()
    productDeleted = true

    expectNoBlockingBrowserIssues(sellerWatchers.consoleErrors, sellerWatchers.failedRequests)
    expectNoBlockingBrowserIssues(adminWatchers.consoleErrors, adminWatchers.failedRequests)
    expectNoBlockingBrowserIssues(buyerWatchers.consoleErrors, buyerWatchers.failedRequests)
  } finally {
    if (buyerToken) {
      await authedDelete(buyerPage.request, buyerToken, '/api/cart/clear').catch(() => {})
    }
    if (!productDeleted && createdProductId) {
      await authedDelete(adminPage.request, adminSession.token, `/api/products/${createdProductId}`).catch(() => {})
    }
    await sellerContext.close()
    await adminContext.close()
    await buyerContext.close()
  }
})
