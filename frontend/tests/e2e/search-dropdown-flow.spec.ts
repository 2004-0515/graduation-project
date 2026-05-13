import { expect, test, type Page } from '@playwright/test'
import {
  attachPageWatchers,
  E2E_PASSWORD,
  E2E_USERS,
  expectNoBlockingBrowserIssues,
  login,
  neutralizeFloatingUi
} from './helpers/session'

type SearchScenario = {
  productName: string
  keyword: string
  descriptionOnly: boolean
}

type ProductCandidate = {
  name?: string
  description?: string
}

function buildCandidateKeywords(text: string) {
  const candidates = new Set<string>()
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  candidates.add(trimmed)

  const tokens = trimmed.match(/[A-Za-z0-9\u4e00-\u9fa5]+/g) || []
  for (const token of tokens) {
    const normalized = token.trim()
    if (!normalized) {
      continue
    }

    if (normalized.length <= 4) {
      candidates.add(normalized)
    } else {
      candidates.add(normalized.slice(0, 2))
      candidates.add(normalized.slice(0, 3))
      candidates.add(normalized.slice(0, 4))
    }

    if (/^[\u4e00-\u9fa5]+$/.test(normalized) && normalized.length >= 2) {
      for (let i = 0; i <= normalized.length - 2 && i < 8; i++) {
        candidates.add(normalized.slice(i, i + 2))
      }
    }
  }

  return Array.from(candidates).filter((value) => value.length > 0 && value.length <= 20)
}

async function fetchSuggestions(page: Page, keyword: string) {
  const suggestionsResponse = await page.request.get(`/api/search/suggestions?keyword=${encodeURIComponent(keyword)}`)
  if (!suggestionsResponse.ok()) {
    return []
  }

  const suggestionsPayload = await suggestionsResponse.json()
  if (suggestionsPayload?.code !== 200 || !Array.isArray(suggestionsPayload?.data)) {
    return []
  }

  return suggestionsPayload.data as Array<{ keyword?: string; type?: string }>
}

async function resolveSearchScenario(page: Page): Promise<SearchScenario> {
  const productsResponse = await page.request.get('/api/products?page=0&size=100')
  expect(productsResponse.ok(), `获取商品列表失败: ${productsResponse.status()} ${productsResponse.url()}`).toBeTruthy()

  const productsPayload = await productsResponse.json()
  expect(productsPayload?.code).toBe(200)

  const rawData = productsPayload?.data
  const products = (Array.isArray(rawData?.content) ? rawData.content : Array.isArray(rawData) ? rawData : []) as ProductCandidate[]

  let fallbackScenario: SearchScenario | null = null

  for (const item of products) {
    const productName = String(item?.name || '').trim()
    const description = String(item?.description || '').trim()
    if (!productName) {
      continue
    }

    const descriptionCandidates = buildCandidateKeywords(description).filter((keyword) => !productName.includes(keyword))
    for (const keyword of descriptionCandidates) {
      const suggestions = await fetchSuggestions(page, keyword)
      const matched = suggestions.some((suggestion) => suggestion.type === 'product' && suggestion.keyword === productName)
      if (matched) {
        return { productName, keyword, descriptionOnly: true }
      }
    }

    const nameCandidates = buildCandidateKeywords(productName)
    for (const keyword of nameCandidates) {
      const suggestions = await fetchSuggestions(page, keyword)
      const matched = suggestions.some((suggestion) => suggestion.type === 'product' && suggestion.keyword === productName)
      if (matched) {
        fallbackScenario = { productName, keyword, descriptionOnly: false }
        break
      }
    }
  }

  if (fallbackScenario) {
    return fallbackScenario
  }

  throw new Error('真实环境中未找到可用于搜索建议的商品关键词')
}

test('匿名用户可通过搜索建议和本地历史进入分类结果页', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const scenario = await resolveSearchScenario(page)
  const keyword = scenario.keyword
  const selectedKeyword = scenario.productName

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('home-view')).toBeVisible()

  const searchInput = page.getByTestId('navbar-search-input')
  await searchInput.click()
  await expect(page.getByTestId('search-dropdown')).toBeVisible()

  await searchInput.fill(keyword)
  await expect(page.getByTestId('search-suggestions-list')).toBeVisible({ timeout: 15_000 })

  const matchingSuggestion = page.locator('[data-testid^="search-suggestion-item-"]', {
    hasText: selectedKeyword
  }).first()
  await expect(matchingSuggestion).toBeVisible()
  await matchingSuggestion.click()

  await page.waitForURL(/\/category\?q=/)
  await expect(page.getByTestId('category-view')).toBeVisible()
  await expect(page.getByTestId('category-search-hint')).toContainText(selectedKeyword)
  await expect(page.locator('[data-testid^="category-product-"]', { hasText: scenario.productName }).first()).toBeVisible()

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await searchInput.click()
  await expect(page.getByTestId('search-history-list')).toBeVisible({ timeout: 15_000 })

  const historyItem = page.locator('[data-testid^="search-history-item-"]', {
    hasText: selectedKeyword
  }).first()
  await expect(historyItem).toBeVisible()
  await historyItem.click()

  await page.waitForURL(/\/category\?q=/)
  await expect(page.getByTestId('category-view')).toBeVisible()
  await expect(page.getByTestId('category-search-hint')).toContainText(selectedKeyword)

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})

test('登录用户可通过搜索建议写入并回显服务端搜索历史', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)
  const scenario = await resolveSearchScenario(page)
  const keyword = scenario.keyword
  const selectedKeyword = scenario.productName

  await login(page, E2E_USERS.buyer, E2E_PASSWORD)
  await page.goto('/')
  await neutralizeFloatingUi(page)
  await expect(page.getByTestId('home-view')).toBeVisible()

  const searchInput = page.getByTestId('navbar-search-input')
  await searchInput.click()
  await expect(page.getByTestId('search-dropdown')).toBeVisible()

  await searchInput.fill(keyword)
  await expect(page.getByTestId('search-suggestions-list')).toBeVisible({ timeout: 15_000 })

  const matchingSuggestion = page.locator('[data-testid^="search-suggestion-item-"]', {
    hasText: selectedKeyword
  }).first()
  await expect(matchingSuggestion).toBeVisible()
  await matchingSuggestion.click()

  await page.waitForURL(/\/category\?q=/)
  await expect(page.getByTestId('category-view')).toBeVisible()
  await expect(page.locator('[data-testid^="category-product-"]', { hasText: scenario.productName }).first()).toBeVisible()

  await page.goto('/')
  await neutralizeFloatingUi(page)
  await searchInput.click()
  await expect(page.getByTestId('search-history-list')).toBeVisible({ timeout: 15_000 })

  const historyItem = page.locator('[data-testid^="search-history-item-"]', {
    hasText: selectedKeyword
  }).first()
  await expect(historyItem).toBeVisible()

  expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
