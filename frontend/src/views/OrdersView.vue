<template>
  <div class="orders-page" data-testid="orders-view">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <div class="header-content">
            <h1>我的订单</h1>
            <p>在这里查看、筛选并管理你的全部订单。</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-num">{{ orders.length }}</span>
              <span class="stat-label">全部订单</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ pendingCount }}</span>
              <span class="stat-label">进行中</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              :class="['tab-btn', { active: activeTab === tab.value }]"
              @click="switchTab(tab.value)"
            >
              {{ tab.label }}
              <span v-if="getTabCount(tab.value) > 0" class="tab-count">
                {{ getTabCount(tab.value) }}
              </span>
            </button>
          </div>
          <div class="filter-actions">
            <div class="search-box">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索订单号或商品名称"
                data-testid="orders-search-input"
              />
            </div>
          </div>
        </div>

        <div v-if="loading" class="empty-state">
          <h3>加载中...</h3>
          <p>正在获取你的最新订单。</p>
        </div>

        <div v-else-if="errorMsg" class="empty-state">
          <h3>加载失败</h3>
          <p class="error-text">{{ errorMsg }}</p>
          <button class="browse-btn" @click="fetchOrders()">重试</button>
        </div>

        <div v-else-if="filteredOrders.length > 0" class="orders-list">
          <div
            v-for="order in paginatedOrders"
            :key="order.id"
            class="order-card"
            :data-testid="`order-card-${order.id}`"
          >
            <div class="order-header">
              <div class="header-left">
                <span class="order-no">订单号：{{ order.orderNo }}</span>
                <span class="order-time">{{ formatDate(order.createdTime) }}</span>
              </div>
              <div class="header-right">
                <span class="order-status" :class="getStatusClass(order.orderStatus)">
                  <span class="status-dot"></span>
                  {{ getStatusText(order.orderStatus) }}
                </span>
              </div>
            </div>

            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item">
                <div class="item-image">
                  <img :src="getImageUrl(item.productImage)" :alt="item.productName" />
                </div>
                <div class="item-info">
                  <h4>{{ item.productName }}</h4>
                  <p class="item-price">¥{{ formatMoney(item.price) }} x {{ item.quantity }}</p>
                </div>
                <div class="item-subtotal">¥{{ formatMoney(item.price * item.quantity) }}</div>
                <button
                  v-if="order.orderStatus === 3"
                  class="btn-review"
                  :class="{ reviewed: item.reviewed }"
                  :disabled="item.reviewed"
                  @click="openReviewDialog(order, item)"
                >
                  {{ item.reviewed ? '已评价' : '去评价' }}
                </button>
              </div>
            </div>

            <div class="order-footer">
              <div class="footer-left">
                <div v-if="order.remark" class="order-remark-inline">
                  <span class="remark-tag">备注</span>
                  <span class="remark-content">{{ order.remark }}</span>
                </div>
              </div>
              <div class="footer-right">
                <div class="order-total">
                  共 {{ getTotalQuantity(order) }} 件商品，
                  <span v-if="Number(order.couponDiscount || 0) > 0" class="discount-info">
                    原价 ¥{{ formatMoney(order.totalAmount || 0) }}，
                    优惠 ¥{{ formatMoney(order.couponDiscount || 0) }}
                  </span>
                  实付 <em>¥{{ formatMoney(getActualPayAmount(order)) }}</em>
                </div>
                <div class="order-actions">
                  <button
                    v-if="order.orderStatus === 0"
                    class="btn-cancel"
                    :data-testid="`order-cancel-${order.id}`"
                    @click="cancelOrder(order)"
                  >
                    取消订单
                  </button>
                  <button
                    v-if="order.orderStatus === 1"
                    class="btn-cancel"
                    :data-testid="`order-request-cancel-${order.id}`"
                    @click="requestCancelOrder(order)"
                  >
                    申请取消
                  </button>
                  <button
                    v-if="order.orderStatus === 0"
                    class="btn-pay"
                    :data-testid="`order-pay-${order.id}`"
                    @click="payOrder(order)"
                  >
                    立即支付
                  </button>
                  <button
                    v-if="order.orderStatus === 2"
                    class="btn-confirm"
                    :data-testid="`order-confirm-${order.id}`"
                    @click="confirmReceive(order)"
                  >
                    确认收货
                  </button>
                  <span v-if="order.orderStatus === 6" class="status-tip">
                    等待管理员审核
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <h3>还没有订单</h3>
          <p>去逛逛商品，完成你的第一笔下单吧。</p>
          <router-link to="/category" class="browse-btn">去浏览商品</router-link>
        </div>

        <div v-if="!loading && !errorMsg && filteredOrders.length > 0" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20]"
            :total="filteredOrders.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>

        <el-dialog v-model="reviewDialogVisible" title="发表评价" width="500px" class="review-dialog">
          <div v-if="currentReviewItem" class="review-form">
            <div class="review-product">
              <img :src="getImageUrl(currentReviewItem.productImage)" :alt="currentReviewItem.productName || '商品图片'" class="product-thumb" />
              <span>{{ currentReviewItem.productName }}</span>
            </div>
            <div class="form-item">
              <label>评分</label>
              <div class="rating-select">
                <span
                  v-for="i in 5"
                  :key="i"
                  :class="['star', { filled: i <= reviewForm.rating }]"
                  @click="reviewForm.rating = i"
                >
                  *
                </span>
                <span class="rating-text">{{ ratingTexts[reviewForm.rating - 1] }}</span>
              </div>
            </div>
            <div class="form-item">
              <label>评价内容</label>
              <el-input
                v-model="reviewForm.content"
                type="textarea"
                :rows="4"
                placeholder="分享你对这件商品的真实体验"
                maxlength="500"
                show-word-limit
              />
            </div>
            <div class="form-item">
              <label>评价图片</label>
              <div class="review-images">
                <el-upload
                  class="review-upload"
                  :show-file-list="false"
                  :before-upload="beforeReviewImageUpload"
                  :http-request="handleReviewImageUpload"
                  accept="image/*"
                >
                  <div class="review-upload-trigger">
                    <el-icon><Plus /></el-icon>
                    <span>上传图片</span>
                  </div>
                </el-upload>
                <div v-if="reviewForm.images.length > 0" class="review-image-grid">
                  <div v-for="image in reviewForm.images" :key="image" class="review-image-card">
                    <img :src="getImageUrl(image)" alt="评价图片" />
                    <button type="button" class="remove-review-image" @click.stop="removeReviewImage(image)">删除</button>
                  </div>
                </div>
                <div class="review-image-tip">最多 3 张，审核通过后会展示在商品详情页</div>
              </div>
            </div>
            <div class="form-item">
              <el-checkbox v-model="reviewForm.anonymous">匿名发表</el-checkbox>
            </div>
          </div>
          <template #footer>
            <el-button @click="closeReviewDialog">取消</el-button>
            <el-button type="primary" :loading="submittingReview" @click="submitReview">
              提交评价
            </el-button>
          </template>
        </el-dialog>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import orderApi from '../api/orderApi'
import reviewApi from '../api/reviewApi'
import fileApi from '../api/fileApi'
import { debugError } from '../utils/debug'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import type { ApiResponse, Order, OrderItem, PageResponse } from '../types'

const route = useRoute()
const router = useRouter()

const orders = ref<Order[]>([])
const activeTab = ref(-1)
const searchKeyword = ref('')
const loading = ref(true)
const errorMsg = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
let latestOrdersRequestId = 0
const invalidateOrderRequests = () => {
  latestOrdersRequestId += 1
}
const RETRYABLE_ORDER_ERROR_CODES = new Set([0, 429, 500, 502, 503, 504])

const reviewDialogVisible = ref(false)
const currentReviewOrder = ref<Order | null>(null)
const currentReviewItem = ref<OrderItem | null>(null)
const submittingReview = ref(false)
const ratingTexts = ['很差', '较差', '一般', '不错', '非常好']
const reviewForm = reactive({
  rating: 5,
  content: '',
  anonymous: false,
  images: [] as string[]
})

const tabs = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
  { label: '申请取消中', value: 6 }
]

const getImageUrl = (path?: string) => fileApi.getImageUrl(path || '')
const formatMoney = (amount: number | string) => Number(amount || 0).toFixed(2)

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  if (error instanceof Error) {
    const response = (error as Error & { response?: { data?: { message?: string } } }).response
    return response?.data?.message || error.message || fallback
  }
  return fallback
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const isRetryableOrderError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const code = Number((error as { code?: number | string }).code)
    if (RETRYABLE_ORDER_ERROR_CODES.has(code)) {
      return true
    }
    const responseCode = Number(
      (error as { response?: { data?: { code?: number | string } } }).response?.data?.code
    )
    if (RETRYABLE_ORDER_ERROR_CODES.has(responseCode)) {
      return true
    }
  }
  return false
}

const isRetryableOrderPayload = (response: ApiResponse<PageResponse<Order>> | null | undefined) => {
  const code = Number(response?.code)
  return RETRYABLE_ORDER_ERROR_CODES.has(code)
}

const extractPagedOrders = (response: ApiResponse<PageResponse<Order>>): Order[] => {
  return Array.isArray(response.data?.content) ? response.data.content : []
}

const pendingCount = computed(() =>
  orders.value.filter((item) => [0, 1, 2, 6].includes(item.orderStatus)).length
)

const filteredOrders = computed(() => {
  let result = [...orders.value]

  if (activeTab.value !== -1) {
    result = result.filter((item) => item.orderStatus === activeTab.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter((order) => {
      const orderNoMatched = String(order.orderNo || '').toLowerCase().includes(keyword)
      const productMatched = (order.items || []).some((item) =>
        String(item.productName || '').toLowerCase().includes(keyword)
      )
      return orderNoMatched || productMatched
    })
  }

  return result
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})

const switchTab = (value: number) => {
  activeTab.value = value
  currentPage.value = 1
}

const handleSizeChange = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getTabCount = (value: number) =>
  value === -1
    ? orders.value.length
    : orders.value.filter((item) => item.orderStatus === value).length

const getTotalQuantity = (order: Order) =>
  (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)

const getActualPayAmount = (order: Order) => {
  if (order.payAmount != null) {
    return Math.max(0, Number(order.payAmount))
  }
  return Math.max(0, Number(order.totalAmount || 0) - Number(order.couponDiscount || 0))
}

const getStatusText = (status: number) =>
  (
    {
      0: '待支付',
      1: '待发货',
      2: '待收货',
      3: '已完成',
      4: '已取消',
      5: '退款中',
      6: '申请取消中'
    } as Record<number, string>
  )[status] || '未知状态'

const getStatusClass = (status: number) =>
  (
    {
      0: 'pending',
      1: 'processing',
      2: 'shipping',
      3: 'completed',
      4: 'cancelled',
      5: 'refunding',
      6: 'cancel-requested'
    } as Record<number, string>
  )[status] || ''

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`
}

const fetchOrders = async (allowRetry: boolean = true) => {
  const requestId = ++latestOrdersRequestId
  loading.value = true
  errorMsg.value = ''
  try {
    const res = (await orderApi.getUserOrders()) as ApiResponse<PageResponse<Order>>
    if (requestId !== latestOrdersRequestId) {
      return
    }
    if (res?.code === 200) {
      orders.value = extractPagedOrders(res)
      reconcileReviewContext()
    } else {
      if (allowRetry && isRetryableOrderPayload(res)) {
        debugError('获取订单列表失败，准备重试:', res?.message || '业务返回异常')
        await wait(600)
        if (requestId !== latestOrdersRequestId) {
          return
        }
        await fetchOrders(false)
        return
      }
      debugError('获取订单列表失败:', res?.message || '业务返回异常')
      errorMsg.value = res?.message || '获取订单失败'
    }
  } catch (error: unknown) {
    if (requestId !== latestOrdersRequestId) {
      return
    }
    if (allowRetry && isRetryableOrderError(error)) {
      debugError('获取订单列表失败，准备重试:', error)
      await wait(600)
      if (requestId !== latestOrdersRequestId) {
        return
      }
      await fetchOrders(false)
      return
    }
    debugError('获取订单列表失败:', error)
    errorMsg.value = getErrorMessage(error, '获取订单失败')
  } finally {
    if (requestId === latestOrdersRequestId) {
      loading.value = false
    }
  }
}

const payOrder = (order: Order) => {
  router.push(`/payment/${order.id}`)
}

const refreshOrdersAfterSuccess = async (actionLabel: string) => {
  try {
    await fetchOrders()
  } catch (error) {
    debugError(`${actionLabel}后刷新订单列表失败:`, error)
  }
}

const closeReviewDialog = () => {
  reviewDialogVisible.value = false
  currentReviewOrder.value = null
  currentReviewItem.value = null
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewForm.anonymous = false
  reviewForm.images = []
}

const reconcileReviewContext = () => {
  if (!currentReviewOrder.value || !currentReviewItem.value) return
  const nextOrder = orders.value.find((item) => item.id === currentReviewOrder.value?.id) || null
  if (!nextOrder) {
    closeReviewDialog()
    return
  }
  const nextItem = (nextOrder.items || []).find((item) => item.id === currentReviewItem.value?.id) || null
  if (!nextItem || nextItem.reviewed) {
    closeReviewDialog()
    return
  }
  currentReviewOrder.value = nextOrder
  currentReviewItem.value = nextItem
}

const applyLocalOrder = (orderId: number, updater: (order: Order) => Order) => {
  orders.value = orders.value.map((item) => (item.id === orderId ? updater(item) : item))
  reconcileReviewContext()
}

const cancelOrder = async (order: Order) => {
  try {
    const res = await orderApi.cancelOrder(order.id)
    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder(order.id, (item) => ({
        ...item,
        orderStatus: 4,
        orderStatusName: '已取消'
      }))
      ElMessage.success('订单已取消')
      await refreshOrdersAfterSuccess('取消订单')
      return
    }
    const message = res?.message || '取消订单失败'
    debugError('取消订单失败:', message)
    ElMessage.error(message)
  } catch (error: unknown) {
    debugError('取消订单失败:', error)
    ElMessage.error(getErrorMessage(error, '取消订单失败'))
  }
}

const requestCancelOrder = async (order: Order) => {
  try {
    const res = await orderApi.requestCancelOrder(order.id)
    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder(order.id, (item) => ({
        ...item,
        orderStatus: 6,
        orderStatusName: '申请取消中'
      }))
      ElMessage.success('取消申请已提交')
      await refreshOrdersAfterSuccess('提交取消申请')
      return
    }
    const message = res?.message || '提交申请失败'
    debugError('提交取消申请失败:', message)
    ElMessage.error(message)
  } catch (error: unknown) {
    debugError('提交取消申请失败:', error)
    ElMessage.error(getErrorMessage(error, '提交申请失败'))
  }
}

const confirmReceive = async (order: Order) => {
  try {
    const res = await orderApi.confirmReceive(order.id)
    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder(order.id, (item) => ({
        ...item,
        orderStatus: 3,
        orderStatusName: '已完成'
      }))
      ElMessage.success('已确认收货')
      await refreshOrdersAfterSuccess('确认收货')
      return
    }
    const message = res?.message || '操作失败'
    debugError('确认收货失败:', message)
    ElMessage.error(message)
  } catch (error: unknown) {
    debugError('确认收货失败:', error)
    ElMessage.error(getErrorMessage(error, '操作失败'))
  }
}

const openReviewDialog = (order: Order, item: OrderItem) => {
  if (item.reviewed) return
  currentReviewOrder.value = order
  currentReviewItem.value = item
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewForm.anonymous = false
  reviewForm.images = []
  reviewDialogVisible.value = true
}

const beforeReviewImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

const handleReviewImageUpload = async (options: any) => {
  if (reviewForm.images.length >= 3) {
    ElMessage.warning('最多上传 3 张评价图片')
    return
  }
  try {
    const res: any = await fileApi.uploadReviewImage(options.file)
    if (res?.code === 200 && res.data) {
      if (!reviewForm.images.includes(res.data)) {
        reviewForm.images = [...reviewForm.images, res.data]
      }
      ElMessage.success(res?.message || '图片上传成功')
      return
    }
    const message = res?.message || '图片上传失败'
    debugError('上传评价图片失败:', message)
    ElMessage.error(message)
  } catch (error) {
    debugError('上传评价图片失败:', error)
    ElMessage.error(getErrorMessage(error, '图片上传失败'))
  }
}

const removeReviewImage = (image: string) => {
  reviewForm.images = reviewForm.images.filter((item) => item !== image)
}

const submitReview = async () => {
  if (!currentReviewItem.value || !currentReviewOrder.value) return
  if (reviewForm.rating < 1) {
    ElMessage.warning('请选择评分')
    return
  }

  const reviewOrderId = currentReviewOrder.value.id
  const reviewItemId = currentReviewItem.value.id
  const reviewProductId = currentReviewItem.value.productId
  submittingReview.value = true
  try {
    const res: any = await reviewApi.createReview({
      productId: reviewProductId,
      orderId: reviewOrderId,
      orderItemId: reviewItemId,
      rating: reviewForm.rating,
      content: reviewForm.content,
      images: [...reviewForm.images],
      anonymous: reviewForm.anonymous
    })

    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder(reviewOrderId, (item) => ({
        ...item,
        items: item.items.map((orderItem) =>
          orderItem.id === reviewItemId
            ? { ...orderItem, reviewed: true }
            : orderItem
        )
      }))
      ElMessage.success('评价提交成功')
      closeReviewDialog()
      await refreshOrdersAfterSuccess('提交评价')
    } else {
      const message = res?.message || '评价提交失败'
      debugError('提交评价失败:', message)
      ElMessage.error(message)
    }
  } catch (error: unknown) {
    debugError('提交评价失败:', error)
    ElMessage.error(getErrorMessage(error, '评价提交失败'))
  } finally {
    submittingReview.value = false
  }
}

watch(searchKeyword, () => {
  currentPage.value = 1
})

watch(
  () => route.query.status,
  (value) => {
    activeTab.value = value !== undefined ? Number(value) : -1
    currentPage.value = 1
  }
)

watch(
  () => route.query.search,
  (value) => {
    searchKeyword.value = value ? String(value) : ''
  }
)

onMounted(async () => {
  activeTab.value = route.query.status !== undefined ? Number(route.query.status) : -1
  searchKeyword.value = route.query.search ? String(route.query.search) : ''
  await fetchOrders()
})
</script>

<style scoped>
.orders-page { min-height: 100vh; background: var(--white); }
.main-content { padding: 100px 0 80px; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 32px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.header-content h1 { font-size: 1.75rem; margin: 0 0 6px; }
.header-content p { color: #666; margin: 0; }
.header-stats { display: flex; gap: 32px; }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 32px; font-weight: 600; color: var(--primary); }
.stat-label { font-size: 14px; color: #999; }
.filter-section { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { padding: 10px 20px; background: #fff; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; transition: all 0.3s; }
.tab-btn:hover { border-color: var(--primary); color: var(--primary); }
.tab-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.tab-count { margin-left: 4px; padding: 2px 8px; background: rgba(255,255,255,0.3); border-radius: 10px; font-size: 12px; }
.search-box input { padding: 10px 16px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
.search-box input:focus { border-color: var(--primary); }
.orders-list { display: flex; flex-direction: column; gap: 16px; }
.order-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
.order-header { display: flex; justify-content: space-between; padding: 16px 20px; background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%); border-bottom: 1px solid #e8f0fe; }
.header-left { display: flex; gap: 16px; align-items: center; }
.order-no { font-weight: 600; color: var(--primary); background: rgba(155, 135, 245, 0.1); padding: 4px 12px; border-radius: 6px; font-size: 14px; border: 1px solid rgba(155, 135, 245, 0.2); }
.order-time { color: #999; }
.order-status { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.order-status.pending { color: #e67e22; }
.order-status.pending .status-dot { background: #e67e22; }
.order-status.processing { color: var(--primary); }
.order-status.processing .status-dot { background: var(--primary); }
.order-status.shipping { color: #3498db; }
.order-status.shipping .status-dot { background: #3498db; }
.order-status.completed { color: #27ae60; }
.order-status.completed .status-dot { background: #27ae60; }
.order-status.cancelled { color: #999; }
.order-status.cancelled .status-dot { background: #999; }
.order-status.refunding { color: #f56c6c; }
.order-status.refunding .status-dot { background: #f56c6c; }
.order-status.cancel-requested { color: #e67e22; }
.order-status.cancel-requested .status-dot { background: #e67e22; }
.status-tip { font-size: 13px; color: #e67e22; font-weight: 500; }
.order-items { padding: 16px 20px; }
.order-item { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eee; }
.order-item:last-child { border-bottom: none; }
.item-image { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background: #f5f5f5; }
.item-image img { width: 100%; height: 100%; object-fit: cover; }
.item-info { flex: 1; }
.item-info h4 { margin: 0 0 8px; font-size: 15px; }
.item-price { margin: 0; color: #666; }
.item-subtotal { font-size: 16px; font-weight: 600; color: var(--primary); }
.order-footer { display: flex; justify-content: space-between; padding: 16px 20px; border-top: 1px solid #e8f0fe; background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%); }
.footer-right { display: flex; align-items: center; gap: 20px; }
.order-total em { font-style: normal; font-size: 20px; font-weight: 600; color: var(--primary); }
.discount-info { color: #e67e22; font-size: 13px; }
.order-actions { display: flex; gap: 10px; }
.order-actions button { padding: 8px 20px; border-radius: 20px; cursor: pointer; transition: all 0.3s; }
.btn-pay { background: var(--primary); color: #fff; border: none; }
.btn-confirm { background: #27ae60; color: #fff; border: none; }
.btn-cancel { background: transparent; border: 1px solid #999; color: #999; }
.empty-state { text-align: center; padding: 80px 20px; background: #fff; border-radius: 12px; }
.empty-state h3 { font-size: 20px; margin: 0 0 8px; }
.empty-state p { color: #999; margin: 0 0 24px; }
.error-text { color: #e74c3c !important; }
.browse-btn { display: inline-block; padding: 12px 32px; background: var(--primary); color: #fff; border-radius: 24px; text-decoration: none; border: none; cursor: pointer; }
.order-remark-inline { display: flex; align-items: center; gap: 8px; }
.remark-tag { background: rgba(155, 135, 245, 0.1); color: var(--primary); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid rgba(155, 135, 245, 0.2); }
.remark-content { color: #666; font-size: 14px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 32px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
:deep(.el-pagination) { --el-pagination-button-bg-color: #fff; --el-pagination-hover-color: var(--primary); }
:deep(.el-pagination .el-pager li) { background: #fff; border: 1px solid #e0e0e0; color: #666; }
:deep(.el-pagination .el-pager li:hover) { color: var(--primary); border-color: var(--primary); }
:deep(.el-pagination .el-pager li.is-active) { background: var(--primary); border-color: var(--primary); color: #fff; }
:deep(.el-pagination button) { background: #fff; border: 1px solid #e0e0e0; color: #666; }
:deep(.el-pagination button:hover:not(:disabled)) { color: var(--primary); border-color: var(--primary); }
:deep(.el-pagination button:disabled) { background: #f5f5f5; border-color: #e0e0e0; color: #ccc; }
:deep(.el-pagination .el-pagination__jump) { color: #666; }
:deep(.el-pagination .el-input__wrapper) { border: 1px solid #e0e0e0; box-shadow: none; }
:deep(.el-pagination .el-input__wrapper:hover),
:deep(.el-pagination .el-input__wrapper.is-focus) { border-color: var(--primary); }
.btn-review { padding: 6px 16px; border-radius: 16px; font-size: 13px; cursor: pointer; transition: all 0.3s; background: var(--primary); color: #fff; border: none; }
.btn-review:hover:not(:disabled) { background: var(--primary-dark); }
.btn-review.reviewed { background: #e0e0e0; color: #999; cursor: default; }
.review-dialog .review-product { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px; }
.review-dialog .product-thumb { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
.review-dialog .form-item { margin-bottom: 20px; }
.review-dialog .form-item label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
.review-dialog .rating-select { display: flex; align-items: center; gap: 8px; }
.review-dialog .rating-select .star { font-size: 28px; color: #ddd; cursor: pointer; transition: all 0.2s; }
.review-dialog .rating-select .star:hover,
.review-dialog .rating-select .star.filled { color: #ffc107; }
.review-dialog .rating-text { margin-left: 12px; color: #666; font-size: 14px; }
.review-images { display: flex; flex-direction: column; gap: 10px; }
.review-upload { width: 110px; height: 110px; }
.review-upload :deep(.el-upload) {
  width: 110px;
  height: 110px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}
.review-upload-trigger {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
}
.review-image-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.review-image-card { position: relative; border-radius: 8px; overflow: hidden; background: #f5f5f5; }
.review-image-card img { width: 100%; height: 92px; object-fit: cover; display: block; }
.remove-review-image {
  position: absolute;
  right: 8px;
  bottom: 8px;
  border: none;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}
.review-image-tip { color: #666; font-size: 12px; }
@media (max-width: 768px) {
  .page-header,
  .order-footer {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .footer-right {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
