import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  E2E_PASSWORD,
  E2E_USERS,
  attachPageWatchers,
  authedDelete,
  authedPost,
  expectNoBlockingBrowserIssues,
  getSession,
  login,
  neutralizeFloatingUi,
  resolveProduct
} from './helpers/session'

async function clearCart(token: string, request: APIRequestContext) {
  const response = await request.delete('/api/cart/clear', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  expect(response.ok(), `清空购物车失败: ${response.status()} ${response.url()}`).toBeTruthy()
  const payload = await response.json()
  expect(payload?.code).toBe(200)
}

test('普通用户可在购物车页查看、改数量并删除商品', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const buyerSession = await getSession(page, E2E_USERS.buyer, E2E_PASSWORD)

  await clearCart(buyerSession.token, page.request)

  const product = await resolveProduct(page, 'cart-management', {
    excludeSellerUsername: E2E_USERS.buyer
  })

  const addResponse = await authedPost(page.request, buyerSession.token, '/api/cart', {
    productId: Number(product.id),
    quantity: 1
  })
  expect(addResponse.ok(), `加入购物车失败: ${addResponse.status()} ${addResponse.url()}`).toBeTruthy()
  const addPayload = await addResponse.json()
  expect(addPayload?.code).toBe(200)
  const cartItemId = Number(addPayload?.data?.id || 0)
  expect(cartItemId).toBeGreaterThan(0)

  try {
    await login(page, E2E_USERS.buyer, E2E_PASSWORD)
    await page.goto('/cart')
    await neutralizeFloatingUi(page)

    await expect(page.getByTestId('cart-view')).toBeVisible()
    const cartItem = page.getByTestId(`cart-item-${cartItemId}`)
    await expect(cartItem).toBeVisible({ timeout: 15_000 })
    await expect(cartItem).toContainText(product.name || '')
    await expect(page.getByTestId('cart-selected-count')).toContainText('共 1 件')

    const quantity = page.getByTestId(`cart-item-quantity-${cartItemId}`)
    await expect(quantity).toHaveText('1')

    const updateResponse = page.waitForResponse((response) =>
      response.request().method() === 'PUT' &&
      response.url().includes(`/api/cart/${cartItemId}`)
    )
    await page.getByTestId(`cart-item-increase-${cartItemId}`).click()
    await updateResponse
    await expect(quantity).toHaveText('2')

    const deleteResponse = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' &&
      response.url().includes(`/api/cart/${cartItemId}`)
    )
    await page.getByTestId(`cart-item-delete-${cartItemId}`).click()
    await page.getByRole('button', { name: '确定' }).click()
    await deleteResponse

    await expect(page.getByTestId(`cart-item-${cartItemId}`)).toHaveCount(0)
    await expect(page.getByTestId('cart-empty')).toBeVisible({ timeout: 15_000 })

    expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
  } finally {
    await clearCart(buyerSession.token, page.request).catch(() => {})
  }
})
