<template>
  <div class="detail-page" data-testid="product-detail-view">
    <div class="deco-layer">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <div class="container">
        <!-- 返回按钮 -->
        <div class="back-bar">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">&larr;</span>
            <span>返回</span>
          </button>
          <button class="back-btn secondary" @click="router.push('/category')">
            <span>全部商品</span>
          </button>
        </div>
        
        <div class="product-layout">
          <!-- 图片区 -->
          <div class="gallery glass-card">
            <div class="main-img">
              <img :src="currentImage" :alt="product.name" @error="imgErr" />
            </div>
            <div class="thumb-list" v-if="product.images?.length > 1">
              <div v-for="(img, i) in product.images" :key="i" :class="['thumb', { active: currentImage === img }]" @click="currentImage = img">
                <img :src="img" :alt="`${product.name} 预览图 ${i + 1}`" @error="imgErr" />
              </div>
            </div>
            
            <!-- 广告视频区域 -->
            <div class="ad-section">
              <div v-if="product.adVideo && product.adVideoEnabled === 1" class="ad-video-mini" @click="openAdVideo">
                <video :src="getVideoUrl(product.adVideo)" muted loop autoplay playsinline class="ad-preview"></video>
                <div class="ad-overlay">
                  <span class="ad-tag">广告</span>
                  <span class="ad-expand">点击放大</span>
                </div>
              </div>
              <div v-else class="ad-placeholder">
                <span class="ad-tag">广告位</span>
                <span class="ad-text">暂无广告</span>
              </div>
            </div>
          </div>

          <!-- 信息区 -->
          <div class="info-panel">
            <h1 class="text-title">{{ product.name }}</h1>
            <p class="desc">{{ product.description }}</p>
            
            <div class="price-box glass-card">
              <span class="price">¥{{ product.price }}</span>
              <span class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
              <span class="sales">已售 {{ product.sales || 0 }}</span>
            </div>
            
            <!-- 价格历史与降价提醒 -->
            <div class="price-history-section glass-card">
              <p v-if="hasPriceDataIssue" class="price-data-hint">价格历史数据暂未同步，请稍后刷新重试。</p>
              <div class="price-stats" v-if="priceStatsAvailable && priceStats">
                <div class="stat-item">
                  <span class="stat-label">历史最低</span>
                  <span class="stat-value lowest">¥{{ priceStats.lowestPrice }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">历史最高</span>
                  <span class="stat-value highest">¥{{ priceStats.highestPrice }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均价格</span>
                  <span class="stat-value avg">¥{{ priceStats.avgPrice }}</span>
                </div>
                <div class="stat-badge" v-if="priceStats.isLowestPrice">
                  <span class="lowest-badge">当前历史最低价</span>
                </div>
              </div>
              
              <div class="price-actions">
                <button class="price-chart-btn" @click="togglePriceChart">
                  <span class="chart-icon">📈</span>
                  <span>{{ showPriceChart ? '收起' : '查看' }}价格走势</span>
                </button>
                <button 
                  v-if="!priceAlert || priceAlert.status !== 0" 
                  class="alert-btn" 
                  data-testid="product-price-alert-open"
                  @click="openAlertDialog"
                >
                  <span class="bell-icon">🔔</span>
                  <span>降价提醒</span>
                </button>
                <button 
                  v-else 
                  class="alert-btn active" 
                  @click="cancelAlert"
                >
                  <span class="bell-icon">🔕</span>
                  <span>已设提醒 ¥{{ priceAlert.targetPrice }}</span>
                </button>
              </div>
              
              <!-- 价格走势图 -->
              <div v-show="showPriceChart" class="price-chart-container">
                <div v-if="priceHistoryAvailable" ref="priceChartRef" class="price-chart"></div>
                <div v-if="!priceHistoryAvailable" class="no-history">
                  <p>价格走势暂未同步</p>
                </div>
                <div v-else-if="priceHistory.length === 0" class="no-history">
                  <p>暂无价格历史记录</p>
                </div>
              </div>
            </div>

            <div class="info-row">
              <span class="label">库存</span>
              <span class="value">{{ product.stock }} 件</span>
            </div>

            <div class="info-row">
              <span class="label">数量</span>
              <div class="qty-control">
                <button @click="quantity > 1 && quantity--" :disabled="product.stock === 0">-</button>
                <input 
                  type="number" 
                  v-model.number="quantity" 
                  min="1" 
                  :max="product.stock" 
                  :disabled="product.stock === 0"
                  @blur="validateQuantityInput"
                />
                <button @click="quantity < product.stock && quantity++" :disabled="product.stock === 0">+</button>
              </div>
            </div>

            <div class="action-row">
              <button 
                class="btn btn-glass" 
                data-testid="product-add-to-cart"
                @click.prevent.stop="addToCart"
                :disabled="!canAddToCart || addingToCart"
              >
                {{ isOwnProduct ? '这是您的商品' : (addingToCart ? '添加中...' : '加入购物车') }}
              </button>
              <button 
                class="btn btn-primary" 
                data-testid="product-buy-now"
                @click.prevent.stop="buyNow"
                :disabled="!canBuyNow"
              >
                {{ isOwnProduct ? '这是您的商品' : '立即购买' }}
              </button>
            </div>

            <!-- 想要清单按钮 -->
            <div class="wishlist-action">
              <button 
                class="btn-wishlist" 
                :class="{ 'in-wishlist': isInWishlist }"
                data-testid="product-add-to-wishlist"
                @click="handleWishlistClick"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{{ isInWishlist ? '已在想要清单' : '加入想要清单' }}</span>
                <span class="wishlist-tip" v-if="!isInWishlist">设置冷静期，避免冲动消费</span>
                <span class="wishlist-tip" v-else>点击查看清单</span>
              </button>
            </div>

            <div class="service-row">
              <span>正品保障</span>
              <span>7天无理由</span>
              <span>极速发货</span>
            </div>
            
            <!-- 重复购买提醒 -->
            <div v-if="duplicateWarnings.length > 0" class="duplicate-warning glass-card">
              <div class="warning-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>理性消费提醒</span>
              </div>
              <div class="warning-list">
                <div v-for="(warn, idx) in duplicateWarnings" :key="idx" class="warning-item">
                  <span class="warning-type" :class="warn.type">{{ warn.type === 'same' ? '重复购买' : '同类商品' }}</span>
                  <span class="warning-msg">{{ warn.message }}</span>
                </div>
              </div>
              <router-link to="/rational-consumption" class="warning-link">查看消费报告</router-link>
            </div>
          </div>
        </div>

        <!-- 详情 -->
        <div class="detail-section glass-card">
          <div class="tabs">
            <button :class="{ active: tab === 'detail' }" @click="tab = 'detail'">商品详情</button>
            <button :class="{ active: tab === 'spec' }" @click="tab = 'spec'">规格参数</button>
            <button :class="{ active: tab === 'review' }" @click="tab = 'review'">用户评价</button>
          </div>
          <div class="tab-content">
            <div v-if="tab === 'detail'" class="detail-content">
              <h3>{{ product.name }}</h3>
              <p>{{ product.description || '优质商品，品质保证' }}</p>
            </div>
            <div v-else-if="tab === 'spec'" class="spec-content">
              <table>
                <tbody>
                  <tr><td>商品名称</td><td>{{ product.name }}</td></tr>
                  <tr><td>商品编号</td><td>{{ product.id }}</td></tr>
                  <tr><td>库存</td><td>{{ product.stock }} 件</td></tr>
                </tbody>
              </table>
            </div>
            <div v-else class="review-content">
              <!-- 评价统计 -->
              <div class="review-stats" v-if="reviewStats.total > 0">
                <div class="stats-left">
                  <span class="avg-rating">{{ reviewStats.avgRating }}</span>
                  <div class="rating-stars">
                    <span v-for="i in 5" :key="i" :class="['star', { filled: i <= Math.round(reviewStats.avgRating) }]">★</span>
                  </div>
                  <span class="total-count">{{ reviewStats.total }} 条评价</span>
                </div>
                <div class="stats-right">
                  <span class="good-rate">{{ reviewStats.goodRate }}% 好评率</span>
                </div>
              </div>
              
              <!-- 评价列表 -->
              <div v-if="reviews.length > 0">
                <div class="review-item" v-for="r in reviews" :key="r.id" :class="{ 'own-review': isOwnReview(r) }">
                  <div class="review-head">
                    <div class="user-info">
                    <img v-if="r.avatar" :src="getImageUrl(r.avatar)" :alt="`${r.username || '用户'}头像`" class="user-avatar" @error="imgErr" />
                      <span class="user-avatar-placeholder" v-else>{{ (r.username || '匿名')[0] }}</span>
                      <span class="username">{{ r.username || '匿名用户' }}</span>
                      <span v-if="isOwnReview(r)" class="own-tag">我的评价</span>
                    </div>
                    <div class="review-actions">
                      <span class="review-time">{{ formatTime(r.createdTime) }}</span>
                      <button v-if="isOwnReview(r)" class="delete-review-btn" @click="deleteReview(r)" title="删除评价">
                        删除
                      </button>
                    </div>
                  </div>
                  <div class="review-rating">
                    <span v-for="i in 5" :key="i" :class="['star', { filled: i <= r.rating }]">★</span>
                  </div>
                  <p class="review-text">{{ r.content || '用户未填写评价内容' }}</p>
                  <div class="review-images" v-if="r.images">
                    <img v-for="(img, idx) in parseImages(r.images)" :key="idx" :src="getImageUrl(img)" :alt="`${r.username || '用户'}评价图 ${idx + 1}`" @error="imgErr" />
                  </div>
                  <div class="review-reply" v-if="r.reply">
                    <span class="reply-label">商家回复：</span>
                    <span>{{ r.reply }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-review">
                <p>暂无评价，快来购买并留下您的评价吧</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 广告视频全屏弹窗 -->
    <div v-if="showAdVideo" class="ad-video-modal" @click.self="closeAdVideo">
      <div class="ad-video-container">
        <div class="ad-video-header">
          <span class="ad-badge">广告</span>
          <span class="ad-timer" v-if="adCountdown > 0">{{ adCountdown }}s 后可关闭</span>
          <button v-else class="ad-close-btn" @click="closeAdVideo">关闭</button>
        </div>
        <video 
          ref="adVideoRef"
          :src="getVideoUrl(product.adVideo)" 
          controls 
          autoplay 
          class="ad-video-player"
          @ended="onAdEnded"
        ></video>
      </div>
    </div>
    
    <!-- 降价提醒设置对话框 -->
    <div v-if="showAlertDialog" class="alert-dialog-overlay" @click.self="showAlertDialog = false">
      <div class="alert-dialog glass-card">
        <div class="alert-dialog-header">
          <h3>设置降价提醒</h3>
          <button class="close-btn" @click="showAlertDialog = false">×</button>
        </div>
        <div class="alert-dialog-body">
          <div class="current-price-info">
            <span class="label">当前价格</span>
            <span class="value">¥{{ product.price }}</span>
          </div>
          <div class="target-price-input">
            <span class="label">目标价格</span>
            <div class="input-wrapper">
              <span class="currency">¥</span>
              <input 
                type="number" 
                data-testid="product-price-alert-input"
                v-model.number="targetPrice" 
                :max="product.price - 0.01"
                min="0.01"
                step="0.01"
                placeholder="输入期望价格"
              />
            </div>
          </div>
          <div class="quick-select">
            <span class="label">快捷选择</span>
            <div class="quick-btns">
              <button @click="targetPrice = Math.floor(product.price * 0.95 * 100) / 100">降5%</button>
              <button @click="targetPrice = Math.floor(product.price * 0.9 * 100) / 100">降10%</button>
              <button @click="targetPrice = Math.floor(product.price * 0.8 * 100) / 100">降20%</button>
              <button v-if="priceStats" @click="targetPrice = priceStats.lowestPrice">历史最低</button>
            </div>
          </div>
          <p class="alert-tip">当商品价格降至目标价格时，我们将通过站内消息通知您</p>
        </div>
        <div class="alert-dialog-footer">
          <button class="btn btn-glass" @click="showAlertDialog = false">取消</button>
          <button class="btn btn-primary" data-testid="product-price-alert-confirm" @click="setAlert">确认设置</button>
        </div>
      </div>
    </div>
    
    <!-- 想要清单弹窗 -->
    <div v-if="showWishlistDialog" class="wishlist-dialog-overlay" @click.self="showWishlistDialog = false">
      <div class="wishlist-dialog glass-card">
        <div class="wishlist-dialog-header">
          <h3>加入想要清单</h3>
          <button class="close-btn" @click="showWishlistDialog = false">×</button>
        </div>
        <div class="wishlist-dialog-body">
          <div class="wishlist-product">
            <img :src="currentImage" :alt="product.name" />
            <div class="wp-info">
              <h4>{{ product.name }}</h4>
              <span class="wp-price">{{ formatMoney(product.price) }}</span>
            </div>
          </div>
          <div class="cooling-select">
            <span class="label">冷静期</span>
            <div class="cooling-options">
              <button 
                v-for="d in [1, 3, 7, 14]" 
                :key="d"
                :class="['cooling-btn', { active: wishlistForm.coolingDays === d }]"
                @click="wishlistForm.coolingDays = d"
              >
                {{ d }}天
              </button>
            </div>
            <p class="cooling-tip">冷静期内无法购买，帮助您避免冲动消费</p>
          </div>
          <div class="reason-input">
            <span class="label">想要原因（选填）</span>
            <textarea 
              v-model="wishlistForm.reason" 
              placeholder="记录一下为什么想要这个商品..."
              maxlength="200"
            ></textarea>
          </div>
        </div>
        <div class="wishlist-dialog-footer">
          <button class="btn btn-glass" @click="showWishlistDialog = false">取消</button>
          <button class="btn btn-primary" data-testid="product-wishlist-confirm" @click="addToWishlist" :disabled="addingWishlist">
            {{ addingWishlist ? '添加中...' : '加入清单' }}
          </button>
        </div>
      </div>
    </div>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { graphic, init, type ECharts, type EChartsCoreOption } from 'echarts/core'
import productApi from '../api/productApi'
import reviewApi from '../api/reviewApi'
import fileApi from '../api/fileApi'
import priceApi from '../api/priceApi'
import rationalApi from '../api/rationalApi'
import type { PriceHistory, PriceStats, PriceAlert } from '../api/priceApi'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { debugError, debugLog } from '@/utils/debug'
import { buildLoginLocation, goBackOr } from '@/utils/navigation'

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent])

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const product = ref<any>({})
const quantity = ref(1)
const tab = ref('detail')
const currentImage = ref('')
const reviews = ref<any[]>([])
const reviewStats = ref<any>({ total: 0, avgRating: 0, goodRate: 100, ratingCounts: {} })

// 价格历史相关
const priceHistory = ref<PriceHistory[]>([])
const priceStats = ref<PriceStats | null>(null)
const priceHistoryAvailable = ref(true)
const priceStatsAvailable = ref(true)
const priceAlert = ref<PriceAlert | null>(null)
const showPriceChart = ref(false)
const priceChartRef = ref<HTMLDivElement>()
let priceChart: ECharts | null = null
const targetPrice = ref<number>(0)
const showAlertDialog = ref(false)

// 广告视频相关
const showAdVideo = ref(false)
const adCountdown = ref(0)
const adVideoRef = ref<HTMLVideoElement>()
let adTimer: ReturnType<typeof setInterval> | null = null

// 重复购买检测
const duplicateWarnings = ref<any[]>([])

// 想要清单
const showWishlistDialog = ref(false)
const addingWishlist = ref(false)
const wishlistForm = ref({
  coolingDays: 3,
  reason: ''
})
const isInWishlist = ref(false)
let latestProductRequestId = 0
let latestReviewsRequestId = 0
let latestPriceHistoryRequestId = 0
let latestPriceAlertRequestId = 0
let latestDuplicateRequestId = 0
let latestWishlistStatusRequestId = 0
const invalidateReviewsRequests = () => {
  latestReviewsRequestId += 1
}
const invalidatePriceAlertRequests = () => {
  latestPriceAlertRequestId += 1
}
const invalidateWishlistStatusRequests = () => {
  latestWishlistStatusRequestId += 1
}

// 返回按钮相关
const goBack = () => {
  goBackOr(router, '/category')
}

const userId = computed(() => userStore.userInfo?.id)

// 判断是否是自己的商品
const isOwnProduct = computed(() => {
  return product.value?.sellerId && userId.value && product.value.sellerId === userId.value
})
const hasPriceDataIssue = computed(() => !priceHistoryAvailable.value || !priceStatsAvailable.value)

const getErrorMessage = (error: any, fallback: string) => {
  const response = error?.response as { data?: { message?: string } } | undefined
  const message = typeof error?.message === 'string' ? error.message : ''
  return response?.data?.message || message || fallback
}

// 按钮可用状态 - 添加空指针保护和卖家判断
const canAddToCart = computed(() => product.value?.stock > 0 && !isOwnProduct.value)
const canBuyNow = computed(() => product.value?.stock > 0 && !isOwnProduct.value)

// 添加loading状态防止并发请求
const addingToCart = ref(false)
// 添加一个非响应式的锁，用于更快的并发控制
let isAddingToCart = false

// 验证数量输入 - 增强版：处理NaN、小数、负数
const validateQuantityInput = () => {
  // 处理NaN、null、undefined、空字符串
  if (Number.isNaN(quantity.value) || quantity.value === null || quantity.value === undefined) {
    quantity.value = 1
    return
  }
  
  // 处理小数：向下取整
  quantity.value = Math.floor(quantity.value)
  
  // 处理超过库存的情况
  if (quantity.value > product.value.stock) {
    quantity.value = product.value.stock
    ElMessage.warning(`数量已调整为最大库存 ${product.value.stock} 件`)
  }
  
  // 处理小于1的情况（包括负数）
  if (quantity.value < 1) {
    quantity.value = 1
  }
}

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  // 使用 data URI 作为占位图，避免外部服务不可用
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f8f8fc" width="400" height="400"/><text fill="#ccc" font-family="Arial" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

const getImageUrl = (path?: string) => fileApi.getImageUrl(path || '')

const getVideoUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? path : `/${path}`
}

const openAdVideo = () => {
  showAdVideo.value = true
  // 设置倒计时（使用管理员设置的时长，默认5秒）
  adCountdown.value = product.value.adVideoDuration || 5
  adTimer = setInterval(() => {
    if (adCountdown.value > 0) {
      adCountdown.value--
    } else if (adTimer) {
      clearInterval(adTimer)
      adTimer = null
    }
  }, 1000)
}

const closeAdVideo = () => {
  if (adCountdown.value > 0) return // 倒计时未结束不能关闭
  showAdVideo.value = false
  if (adTimer) {
    clearInterval(adTimer)
    adTimer = null
  }
  if (adVideoRef.value) {
    adVideoRef.value.pause()
  }
}

const onAdEnded = () => {
  adCountdown.value = 0 // 视频播放完毕可以关闭
}

const forceResetAdVideoState = () => {
  showAdVideo.value = false
  adCountdown.value = 0
  if (adTimer) {
    clearInterval(adTimer)
    adTimer = null
  }
  if (adVideoRef.value) {
    adVideoRef.value.pause()
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  return time.substring(0, 10)
}

const parseImages = (images: unknown) => {
  if (!images) return []
  if (Array.isArray(images)) {
    return images.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof images !== 'string') {
    return []
  }
  try {
    const parsed = JSON.parse(images)
    if (!Array.isArray(parsed)) {
      debugError('评价图片不是数组格式', parsed)
      return images.split(',').filter(Boolean)
    }
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch (error) {
    debugError('解析评价图片失败', error)
    return images.split(',').filter(Boolean)
  }
}

const parseProductImages = (images: unknown, mainImage: string) => {
  const normalizedMain = mainImage ? getImageUrl(mainImage) : ''
  let parsed: string[] = []

  if (Array.isArray(images)) {
    parsed = images.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } else if (typeof images === 'string' && images.trim()) {
    try {
      const payload = JSON.parse(images)
      if (Array.isArray(payload)) {
        parsed = payload.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      } else {
        debugError('商品图片字段不是 JSON 数组，按历史兼容只读展示', payload)
        parsed = images.split(',').filter(Boolean)
      }
    } catch (error) {
      debugError('商品图片字段不是规范 JSON 数组，按历史兼容只读展示', error)
      parsed = images.split(',').filter(Boolean)
    }
  }

  const mapped = parsed.map((img) => getImageUrl(img))
  if (normalizedMain && !mapped.includes(normalizedMain)) {
    mapped.unshift(normalizedMain)
  }
  return mapped.length > 0 ? mapped : (normalizedMain ? [normalizedMain] : [])
}

const buildReviewStatsFromList = (reviewList: any[]) => {
  const total = reviewList.length
  const ratingCounts = reviewList.reduce(
    (counts, current) => {
      const rating = Number(current?.rating || 0)
      if (rating >= 1 && rating <= 5) {
        counts[rating] = (counts[rating] || 0) + 1
      }
      return counts
    },
    {} as Record<number, number>
  )
  const totalRating = reviewList.reduce((sum, current) => sum + Number(current?.rating || 0), 0)
  const goodCount = reviewList.filter((current) => Number(current?.rating || 0) >= 4).length

  return {
    total,
    avgRating: total > 0 ? Number((totalRating / total).toFixed(1)) : 0,
    goodRate: total > 0 ? Math.round((goodCount / total) * 100) : 100,
    ratingCounts
  }
}

const fetchProduct = async () => {
  const requestId = ++latestProductRequestId
  try {
    const res: any = await productApi.getProductById(Number(route.params.id))
    if (requestId !== latestProductRequestId) {
      return
    }
    if (res?.code === 200) {
      product.value = res.data
      product.value.images = parseProductImages(product.value.images, product.value.mainImage)
      currentImage.value = product.value.images[0] || getImageUrl(product.value.mainImage)
    }
  } catch (error) {
    if (requestId !== latestProductRequestId) {
      return
    }
    debugError('获取商品信息失败', error)
    ElMessage.error(getErrorMessage(error, '获取商品信息失败'))
  }
}

const fetchReviews = async () => {
  const productId = Number(route.params.id)
  const requestId = ++latestReviewsRequestId
  try {
    const [reviewsRes, statsRes]: any[] = await Promise.all([
      reviewApi.getAllProductReviews(productId),
      reviewApi.getProductReviewStats(productId)
    ])
    if (requestId !== latestReviewsRequestId) {
      return
    }
    if (reviewsRes?.code === 200) {
      reviews.value = reviewsRes.data || []
    } else {
      debugError('获取评价失败', reviewsRes?.message || '评价列表返回异常')
    }
    if (statsRes?.code === 200) {
      reviewStats.value = statsRes.data || { total: 0, avgRating: 0, goodRate: 100 }
    } else {
      debugError('获取评价失败', statsRes?.message || '评价统计返回异常')
    }
  } catch (e) {
    if (requestId !== latestReviewsRequestId) {
      return
    }
    debugError('获取评价失败', e)
  }
}

const addToCart = async () => {
  // 双重锁：先检查非响应式锁（更快）
  if (isAddingToCart) {
    debugLog('防止并发：非响应式锁生效')
    return
  }
  
  // 再检查响应式锁
  if (addingToCart.value) {
    debugLog('防止并发：响应式锁生效')
    return
  }
  
  // 立即设置两个锁
  isAddingToCart = true
  addingToCart.value = true
  
  try {
    if (!userStore.isLoggedIn) { 
      ElMessage.warning('请先登录')
      router.push(buildLoginLocation(route.fullPath))
      return 
    }
    
    // 先验证并调整数量
    validateQuantityInput()
    
    // 验证库存
    if (product.value.stock === 0) {
      ElMessage.warning('商品已售罄')
      return
    }
    
    if (quantity.value > product.value.stock) {
      ElMessage.warning(`库存不足，当前库存仅剩 ${product.value.stock} 件`)
      return
    }
    
    await cartStore.addToCart(userId.value, product.value.id, quantity.value) 
  } catch (error: any) {
    // 提取后端错误消息
    const errorMsg = error?.response?.data?.message || error?.message || '加入购物车失败'
    debugError('加入购物车失败', error)
    ElMessage.error(errorMsg)
  } finally {
    // 确保两个锁都被释放
    isAddingToCart = false
    addingToCart.value = false
  }
}

const buyNow = () => {
  if (!userStore.isLoggedIn) { 
    ElMessage.warning('请先登录')
    router.push(buildLoginLocation(route.fullPath))
    return 
  }
  
  // 先验证并调整数量
  validateQuantityInput()
  
  // 验证库存
  if (product.value.stock === 0) {
    ElMessage.warning('商品已售罄')
    return
  }
  
  if (quantity.value > product.value.stock) {
    ElMessage.warning(`库存不足，当前库存仅剩 ${product.value.stock} 件`)
    return
  }
  
  router.push(`/checkout?productId=${product.value.id}&quantity=${quantity.value}`)
}

// 判断是否是自己的评价
const isOwnReview = (review: any) => {
  if (!userStore.isLoggedIn || !userStore.userInfo?.id) return false
  return review.userId === userStore.userInfo.id
}

const refreshReviewsAfterSuccess = async () => {
  try {
    await fetchReviews()
  } catch (error) {
    debugError('删除评价成功后刷新评价失败', error)
  }
}

const applyLocalReviewDeletion = (reviewId: number) => {
  const nextReviews = reviews.value.filter((current) => current.id !== reviewId)
  if (nextReviews.length === reviews.value.length) {
    return
  }
  reviews.value = nextReviews
  reviewStats.value = buildReviewStatsFromList(nextReviews)
}

// 删除评价
const deleteReview = async (review: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', { type: 'warning' })
    const res: any = await reviewApi.deleteReview(review.id)
    if (res?.code === 200) {
      invalidateReviewsRequests()
      applyLocalReviewDeletion(review.id)
      ElMessage.success('评价已删除')
      await refreshReviewsAfterSuccess()
    } else {
      const message = res?.message || '删除失败'
      debugError('删除评价失败', message)
      ElMessage.error(message)
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      debugError('删除评价失败', e)
      ElMessage.error(getErrorMessage(e, '删除失败'))
    }
  }
}

// 获取价格历史
const fetchPriceHistory = async () => {
  const productId = Number(route.params.id)
  const requestId = ++latestPriceHistoryRequestId
  try {
    const [historyRes, statsRes]: any[] = await Promise.all([
      priceApi.getPriceHistory(productId),
      priceApi.getPriceStats(productId)
    ])
    if (requestId !== latestPriceHistoryRequestId) {
      return
    }
    if (historyRes?.code === 200) {
      priceHistory.value = historyRes.data || []
      priceHistoryAvailable.value = true
    } else {
      priceHistoryAvailable.value = false
      debugError('获取价格历史失败', historyRes?.message || '价格历史返回异常')
    }
    if (statsRes?.code === 200) {
      priceStats.value = statsRes.data
      priceStatsAvailable.value = true
    } else {
      priceStatsAvailable.value = false
      debugError('获取价格历史失败', statsRes?.message || '价格统计返回异常')
    }
  } catch (e) {
    if (requestId !== latestPriceHistoryRequestId) {
      return
    }
    priceHistoryAvailable.value = false
    priceStatsAvailable.value = false
    debugError('获取价格历史失败', e)
  }
}

// 获取用户的降价提醒
const fetchPriceAlert = async () => {
  if (!userStore.isLoggedIn) {
    priceAlert.value = null
    return
  }
  const productId = Number(route.params.id)
  const requestId = ++latestPriceAlertRequestId
  try {
    const res: any = await priceApi.getUserProductAlert(productId)
    if (requestId !== latestPriceAlertRequestId) {
      return
    }
    if (res?.code === 200) {
      priceAlert.value = res.data
    } else {
      debugError('获取降价提醒失败', res?.message || '降价提醒返回异常')
    }
  } catch (e) {
    if (requestId !== latestPriceAlertRequestId) {
      return
    }
    debugError('获取降价提醒失败', e)
  }
}

const refreshPriceAlertAfterSuccess = async (actionLabel: string) => {
  try {
    await fetchPriceAlert()
  } catch (error) {
    debugError(`${actionLabel}成功后刷新降价提醒失败`, error)
  }
}

// 检测重复购买
const checkDuplicatePurchase = async () => {
  if (!userStore.isLoggedIn) {
    duplicateWarnings.value = []
    return
  }
  const productId = Number(route.params.id)
  const requestId = ++latestDuplicateRequestId
  try {
    const res: any = await rationalApi.checkDuplicate(productId)
    if (requestId !== latestDuplicateRequestId) {
      return
    }
    if (res?.code === 200) {
      duplicateWarnings.value = res.data || []
    } else {
      debugError('检测重复购买失败', res?.message || '重复购买检查返回异常')
    }
  } catch (e) {
    if (requestId !== latestDuplicateRequestId) {
      return
    }
    debugError('检测重复购买失败', e)
  }
}

// 初始化价格图表
const initPriceChart = () => {
  if (!priceChartRef.value || priceHistory.value.length === 0) return
  
  if (priceChart) {
    priceChart.dispose()
  }
  
  priceChart = init(priceChartRef.value)
  
  const dates = priceHistory.value.map(h => h.recordedTime.substring(0, 10))
  const prices = priceHistory.value.map(h => h.price)
  
  const option: EChartsCoreOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const date = params[0].axisValue
        let html = `<div style="font-weight:600;margin-bottom:8px">${date}</div>`
        params.forEach((item: any) => {
          const color = item.color
          const name = item.seriesName
          const value = item.value
          html += `<div style="display:flex;align-items:center;margin:4px 0">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px"></span>
            <span style="flex:1">${name}</span>
            <span style="font-weight:600;margin-left:12px">¥${value}</span>
          </div>`
        })
        return html
      }
    },
    legend: {
      data: ['价格走势', '平均价格', '历史最低'],
      bottom: 0,
      textStyle: {
        fontSize: 12,
        color: '#666'
      },
      itemWidth: 20,
      itemHeight: 10
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        fontSize: 11,
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
        fontSize: 11,
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(200,200,220,0.2)'
        }
      }
    },
    series: [
      {
        name: '价格走势',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: 'var(--primary)',
          width: 2
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(155, 135, 245, 0.3)' },
            { offset: 1, color: 'rgba(155, 135, 245, 0.05)' }
          ])
        },
        itemStyle: {
          color: 'var(--primary)'
        },
        data: prices
      },
      {
        name: '平均价格',
        type: 'line',
        symbol: 'none',
        lineStyle: {
          color: '#faad14',
          type: 'dashed',
          width: 1.5
        },
        data: priceStats.value ? dates.map(() => priceStats.value!.avgPrice) : []
      },
      {
        name: '历史最低',
        type: 'line',
        symbol: 'none',
        lineStyle: {
          color: '#52c41a',
          type: 'dashed',
          width: 1.5
        },
        data: priceStats.value ? dates.map(() => priceStats.value!.lowestPrice) : []
      }
    ]
  }
  
  priceChart.setOption(option)
}

// 切换价格图表显示
const togglePriceChart = () => {
  showPriceChart.value = !showPriceChart.value
  if (showPriceChart.value) {
    setTimeout(() => initPriceChart(), 100)
  }
}

// 打开降价提醒对话框
const openAlertDialog = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push(buildLoginLocation(route.fullPath))
    return
  }
  targetPrice.value = Math.floor(product.value.price * 0.9 * 100) / 100
  showAlertDialog.value = true
}

// 设置降价提醒
const setAlert = async () => {
  if (targetPrice.value >= product.value.price) {
    ElMessage.warning('目标价格必须低于当前价格')
    return
  }
  if (targetPrice.value <= 0) {
    ElMessage.warning('请输入有效的目标价格')
    return
  }
  
  try {
    const res: any = await priceApi.createAlert(product.value.id, targetPrice.value)
    if (res?.code === 200) {
      invalidatePriceAlertRequests()
      priceAlert.value = {
        id: priceAlert.value?.id || 0,
        userId: priceAlert.value?.userId || Number(userId.value || 0),
        productId: product.value.id,
        targetPrice: targetPrice.value,
        currentPrice: product.value.price,
        status: 0,
        triggeredTime: priceAlert.value?.triggeredTime || null,
        triggeredPrice: priceAlert.value?.triggeredPrice || null,
        notified: priceAlert.value?.notified || false,
        createdTime: priceAlert.value?.createdTime || new Date().toISOString(),
        updatedTime: new Date().toISOString()
      }
      ElMessage.success('降价提醒设置成功')
      await refreshPriceAlertAfterSuccess('设置降价提醒')
      showAlertDialog.value = false
    } else {
      const message = res?.message || '设置失败'
      debugError('设置降价提醒失败', message)
      ElMessage.error(message)
    }
  } catch (e) {
    debugError('设置降价提醒失败', e)
    ElMessage.error(getErrorMessage(e, '设置降价提醒失败'))
  }
}

// 取消降价提醒
const cancelAlert = async () => {
  try {
    await ElMessageBox.confirm('确定要取消降价提醒吗？', '提示', { type: 'warning' })
    const res: any = await priceApi.cancelAlert(product.value.id)
    if (res?.code === 200) {
      invalidatePriceAlertRequests()
      priceAlert.value = null
      ElMessage.success('已取消降价提醒')
      await refreshPriceAlertAfterSuccess('取消降价提醒')
    } else {
      const message = res?.message || '取消失败'
      debugError('取消降价提醒失败', message)
      ElMessage.error(message)
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      debugError('取消降价提醒失败', e)
      ElMessage.error(getErrorMessage(e, '取消失败'))
    }
  }
}

// 格式化金额
const formatMoney = (val: number | undefined) => {
  if (val === undefined || val === null) return '¥0.00'
  return `¥${Number(val).toFixed(2)}`
}

// 添加到想要清单
const addToWishlist = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push(buildLoginLocation(route.fullPath))
    return
  }
  
  addingWishlist.value = true
  try {
    const res: any = await rationalApi.addToWishlist(
      product.value.id,
      wishlistForm.value.coolingDays,
      wishlistForm.value.reason
    )
    if (res?.code === 200) {
      invalidateWishlistStatusRequests()
      isInWishlist.value = true
      ElMessage.success('已加入想要清单，冷静期' + wishlistForm.value.coolingDays + '天')
      showWishlistDialog.value = false
      wishlistForm.value = { coolingDays: 3, reason: '' }
      await refreshWishlistStatusAfterSuccess()
    } else {
      const message = res?.message || '添加失败'
      debugError('添加想要清单失败', message)
      ElMessage.error(message)
    }
  } catch (e) {
    debugError('添加想要清单失败', e)
    ElMessage.error(getErrorMessage(e, '添加失败'))
  } finally {
    addingWishlist.value = false
  }
}

// 检查商品是否在想要清单中
const checkWishlistStatus = async () => {
  if (!userStore.isLoggedIn) {
    isInWishlist.value = false
    return
  }
  const productId = Number(route.params.id)
  const requestId = ++latestWishlistStatusRequestId
  try {
    const res: any = await rationalApi.checkInWishlist(productId)
    if (requestId !== latestWishlistStatusRequestId) {
      return
    }
    if (res?.code === 200) {
      isInWishlist.value = res.data?.inWishlist || false
    } else {
      debugError('检查想要清单状态失败', res?.message || '想要清单状态返回异常')
    }
  } catch (e) {
    if (requestId !== latestWishlistStatusRequestId) {
      return
    }
    debugError('检查想要清单状态失败', e)
  }
}

const refreshWishlistStatusAfterSuccess = async () => {
  try {
    await checkWishlistStatus()
  } catch (error) {
    debugError('添加想要清单成功后刷新清单状态失败', error)
  }
}

// 处理想要清单按钮点击
const handleWishlistClick = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push(buildLoginLocation(route.fullPath))
    return
  }
  
  if (isInWishlist.value) {
    // 已在清单中，跳转到理性消费页面
    router.push('/rational-consumption?tab=wishlist')
  } else {
    // 打开添加弹窗
    showWishlistDialog.value = true
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (priceChart) {
    priceChart.resize()
  }
}

const resetProductDetailPageState = () => {
  product.value = {}
  quantity.value = 1
  tab.value = 'detail'
  currentImage.value = ''
  reviews.value = []
  reviewStats.value = { total: 0, avgRating: 0, goodRate: 100, ratingCounts: {} }
  priceHistory.value = []
  priceStats.value = null
  priceHistoryAvailable.value = true
  priceStatsAvailable.value = true
  priceAlert.value = null
  showPriceChart.value = false
  targetPrice.value = 0
  showAlertDialog.value = false
  duplicateWarnings.value = []
  showWishlistDialog.value = false
  addingWishlist.value = false
  wishlistForm.value = { coolingDays: 3, reason: '' }
  isInWishlist.value = false
  forceResetAdVideoState()
  if (priceChart) {
    priceChart.dispose()
    priceChart = null
  }
}

const reloadProductDetailFromRoute = () => {
  resetProductDetailPageState()
  fetchProduct()
  fetchReviews()
  fetchPriceHistory()
  fetchPriceAlert()
  checkDuplicatePurchase()
  checkWishlistStatus()
}

// 监听价格历史变化，更新图表
watch(priceHistory, () => {
  if (showPriceChart.value) {
    setTimeout(() => initPriceChart(), 100)
  }
})

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      reloadProductDetailFromRoute()
    }
  }
)

onMounted(() => {
  reloadProductDetailFromRoute()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  forceResetAdVideoState()
  if (priceChart) {
    priceChart.dispose()
    priceChart = null
  }
})
</script>

<style scoped>
.detail-page { min-height: 100vh; background: var(--white); position: relative; }

/* 返回按钮 */
.back-bar { margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; }
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(155, 135, 245, 0.1);
  border: 1px solid rgba(155, 135, 245, 0.2);
  border-radius: 8px;
  color: var(--primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.back-btn:hover {
  background: var(--primary);
  color: var(--white);
}
.back-btn.secondary {
  background: rgba(255, 255, 255, 0.84);
}
.back-icon { font-size: 16px; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; will-change: transform; }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; will-change: transform; }
.s1 { width: 600px; height: 600px; top: 5%; right: -10%; background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent); opacity: 0.5; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -10%; background: radial-gradient(circle, rgba(155, 135, 245, 0.12), transparent); opacity: 0.5; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main { position: relative; z-index: 1; padding: 100px 0 60px; }

.product-layout { display: grid; grid-template-columns: minmax(300px, 480px) 1fr; gap: 48px; margin-bottom: 48px; align-items: start; }

/* Gallery */
.gallery { padding: 24px; max-width: 480px; overflow: hidden; }
.main-img { width: 100%; max-width: 432px; max-height: 432px; aspect-ratio: 1; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; background: rgba(255,255,255,0.5); }
.main-img img { width: 100%; height: 100%; object-fit: contain; }
.thumb-list { display: flex; gap: 12px; }
.thumb { width: 72px; height: 72px; border-radius: var(--radius-sm); overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.3s; }
.thumb:hover, .thumb.active { border-color: var(--primary); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Info */
.info-panel h1 { font-size: 2rem; font-weight: 500; margin: 0 0 12px; }
.desc { font-size: 15px; color: var(--text-secondary); margin: 0 0 24px; line-height: 1.7; }

.price-box { display: flex; align-items: baseline; gap: 12px; padding: 20px; margin-bottom: 24px; }
.price { font-size: 32px; font-weight: 600; color: var(--primary); }
.original { font-size: 17px; color: var(--text-tertiary); text-decoration: line-through; }
.sales { margin-left: auto; font-size: 14px; color: var(--text-tertiary); }

.info-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--gray-200); }
.label { width: 80px; font-size: 15px; color: var(--text-tertiary); }
.value { font-size: 15px; color: var(--text-secondary); }

.qty-control { display: flex; align-items: center; }
.qty-control button { width: 32px; height: 32px; border: 1px solid var(--gray-300); background: var(--white); cursor: pointer; }
.qty-control button:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.qty-control button:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.qty-control button:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.qty-control button:disabled { opacity: 0.5; cursor: not-allowed; }
.qty-control input { width: 80px; height: 32px; border: 1px solid var(--gray-300); border-left: none; border-right: none; text-align: center; font-size: 14px; background: var(--white); }
.qty-control input:disabled { opacity: 0.5; cursor: not-allowed; background: var(--gray-100); }

.action-row { display: flex; gap: 16px; margin-top: 32px; }
.action-row .btn { flex: 1; padding: 14px 0; }
.action-row .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-200);
  color: var(--text-tertiary);
  border-color: var(--gray-300);
}
.action-row .btn.btn-primary:disabled {
  background: var(--gray-300);
}

.service-row { display: flex; gap: 20px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--gray-200); font-size: 13px; color: var(--text-tertiary); }

/* 重复购买提醒 */
.duplicate-warning {
  margin-top: 20px;
  padding: 16px;
  background: rgba(245, 166, 35, 0.08);
  border: 1px solid rgba(245, 166, 35, 0.3);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #e67e22;
  font-weight: 500;
  font-size: 14px;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.warning-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.warning-type.same {
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
}

.warning-type.similar {
  background: rgba(245, 166, 35, 0.15);
  color: #e67e22;
}

.warning-msg {
  color: var(--text-secondary);
}

.warning-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--primary);
  text-decoration: none;
}

.warning-link:hover {
  text-decoration: underline;
}

/* Detail Section */
.detail-section { overflow: hidden; }
.tabs { display: flex; border-bottom: 1px solid var(--gray-200); }
.tabs button { padding: 16px 32px; background: none; border: none; font-size: 14px; color: var(--text-tertiary); cursor: pointer; position: relative; }
.tabs button.active { color: var(--text-primary); }
.tabs button.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 2px; background: var(--primary); }
.tab-content { padding: 32px; min-height: 200px; }
.detail-content h3 { font-size: 18px; font-weight: 500; color: var(--text-primary); margin: 0 0 12px; }
.detail-content p { font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 0; }
.spec-content table { width: 100%; border-collapse: collapse; }
.spec-content tr { border-bottom: 1px solid var(--gray-200); }
.spec-content td { padding: 12px 16px; font-size: 14px; }
.spec-content td:first-child { width: 120px; color: var(--text-tertiary); background: var(--gray-50); }
.review-item { padding: 16px 0; border-bottom: 1px solid var(--gray-200); }
.review-item.own-review { background: rgba(155, 135, 245, 0.05); padding: 16px; margin: 0 -16px; border-radius: var(--radius-md); }
.review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.user-info { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.user-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 14px; }
.username { font-size: 14px; color: var(--text-primary); }
.own-tag { padding: 2px 8px; background: var(--primary); color: var(--white); font-size: 11px; border-radius: 10px; }
.review-actions { display: flex; align-items: center; gap: 12px; }
.review-time { font-size: 13px; color: var(--text-tertiary); }
.delete-review-btn { padding: 4px 10px; background: transparent; border: 1px solid #e74c3c; color: #e74c3c; font-size: 12px; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
.delete-review-btn:hover { background: #e74c3c; color: #fff; }
.review-rating { margin-bottom: 8px; }
.review-rating .star { font-size: 14px; color: #ddd; }
.review-rating .star.filled { color: #ffc107; }
.review-text { margin: 0 0 10px; font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
.review-images { display: flex; gap: 8px; margin-bottom: 10px; }
.review-images img { width: 80px; height: 80px; border-radius: var(--radius-sm); object-fit: cover; cursor: pointer; }
.review-reply { padding: 12px; background: var(--gray-50); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-secondary); }
.reply-label { color: var(--primary); font-weight: 500; }

/* 评价统计 */
.review-stats { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius-md); margin-bottom: 20px; }
.stats-left { display: flex; align-items: center; gap: 16px; }
.avg-rating { font-size: 36px; font-weight: 600; color: var(--primary); }
.rating-stars .star { font-size: 18px; color: #ddd; }
.rating-stars .star.filled { color: #ffc107; }
.total-count { font-size: 14px; color: var(--text-tertiary); }
.good-rate { font-size: 16px; font-weight: 500; color: var(--primary); }
.empty-review { text-align: center; padding: 40px; color: var(--text-tertiary); }

@media (max-width: 900px) {
  .product-layout { grid-template-columns: 1fr; gap: 24px; }
  .gallery { max-width: 100%; padding: 16px; }
  .main-img { max-width: 100%; max-height: 400px; aspect-ratio: 1; }
  .main-img img { width: 100%; height: 100%; object-fit: contain; }
  .action-row { flex-direction: column; }
  .info-panel h1 { font-size: 1.5rem; }
  .price { font-size: 24px; }
}

/* 广告视频区域 */
.ad-section {
  margin-top: 16px;
}

/* 广告视频小窗口 */
.ad-video-mini {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  max-width: 200px;
  aspect-ratio: 16/9;
  background: #000;
}

/* 广告占位区域 */
.ad-placeholder {
  max-width: 200px;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #f0f4f8, #e8eef5);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed #ccd5e0;
}

.ad-placeholder .ad-tag {
  padding: 2px 8px;
  background: rgba(155, 135, 245, 0.1);
  color: var(--primary);
  font-size: 10px;
  border-radius: 3px;
}

.ad-placeholder .ad-text {
  color: #999;
  font-size: 12px;
}

.ad-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ad-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8px;
  transition: background 0.3s;
}

.ad-video-mini:hover .ad-overlay {
  background: rgba(0,0,0,0.4);
}

.ad-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  background: rgba(255,255,255,0.9);
  color: #666;
  font-size: 10px;
  border-radius: 3px;
}

.ad-expand {
  color: #fff;
  font-size: 12px;
  text-align: center;
}

/* 广告视频全屏弹窗 */
.ad-video-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-video-container {
  width: 90%;
  max-width: 900px;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ad-video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0,0,0,0.8);
}

.ad-badge {
  padding: 4px 10px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}

.ad-timer {
  color: #999;
  font-size: 13px;
}

.ad-close-btn {
  padding: 6px 16px;
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s;
}

.ad-close-btn:hover {
  transform: scale(1.05);
}

.ad-video-player {
  width: 100%;
  max-height: 70vh;
  background: #000;
}

/* 价格历史区域 */
.price-history-section {
  padding: 16px;
  margin-bottom: 24px;
}

.price-data-hint {
  margin: 0 0 14px;
  padding: 10px 12px;
  border: 1px solid rgba(245, 166, 35, 0.28);
  border-radius: 10px;
  background: rgba(245, 166, 35, 0.08);
  color: #b26a00;
  font-size: 13px;
}

.price-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--gray-200);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.stat-value.lowest { color: #52c41a; }
.stat-value.highest { color: #ff4d4f; }
.stat-value.avg { color: #faad14; }

.stat-badge {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.lowest-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
  font-size: 12px;
  border-radius: 12px;
  font-weight: 500;
}

.price-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.price-chart-btn,
.alert-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(155, 135, 245, 0.1);
  border: 1px solid rgba(155, 135, 245, 0.2);
  border-radius: 8px;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.price-chart-btn:hover,
.alert-btn:hover {
  background: rgba(155, 135, 245, 0.2);
}

.alert-btn.active {
  background: var(--primary);
  color: var(--white);
  border-color: transparent;
}

.chart-icon,
.bell-icon {
  font-size: 14px;
}

.price-chart-container {
  margin-top: 16px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
}

.price-chart {
  width: 100%;
  height: 250px;
}

.no-history {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
}

/* 降价提醒对话框 */
.alert-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-dialog {
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.alert-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-200);
}

.alert-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.alert-dialog-header .close-btn,
.wishlist-dialog-header .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(155, 135, 245, 0.08);
  font-size: 18px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.alert-dialog-header .close-btn::before,
.wishlist-dialog-header .close-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255, 183, 213, 0.3) 0%, 
    rgba(199, 163, 255, 0.3) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 50%;
}

.alert-dialog-header .close-btn:hover,
.wishlist-dialog-header .close-btn:hover {
  background: rgba(155, 135, 245, 0.15);
  color: var(--primary);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 2px 8px rgba(155, 135, 245, 0.2);
}

.alert-dialog-header .close-btn:hover::before,
.wishlist-dialog-header .close-btn:hover::before {
  opacity: 1;
}

.alert-dialog-header .close-btn:active,
.wishlist-dialog-header .close-btn:active {
  transform: rotate(90deg) scale(0.95);
}

.alert-dialog-body {
  padding: 20px;
}

.current-price-info,
.target-price-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.current-price-info .label,
.target-price-input .label,
.quick-select .label {
  font-size: 14px;
  color: var(--text-secondary);
}

.current-price-info .value {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary);
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  overflow: hidden;
}

.input-wrapper .currency {
  padding: 8px 12px;
  background: var(--gray-50);
  color: var(--text-tertiary);
  font-size: 14px;
}

.input-wrapper input {
  width: 120px;
  padding: 8px 12px;
  border: none;
  font-size: 16px;
  outline: none;
}

.quick-select {
  margin-bottom: 16px;
}

.quick-select .label {
  display: block;
  margin-bottom: 8px;
}

.quick-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-btns button {
  padding: 6px 12px;
  background: rgba(155, 135, 245, 0.1);
  border: 1px solid rgba(155, 135, 245, 0.2);
  border-radius: 6px;
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-btns button:hover {
  background: var(--primary);
  color: var(--white);
}

.alert-tip {
  margin: 0;
  padding: 12px;
  background: rgba(250, 173, 20, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #d48806;
  line-height: 1.5;
}

.alert-dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--gray-200);
}

.alert-dialog-footer .btn {
  flex: 1;
  padding: 10px 0;
}

/* 想要清单按钮 */
.wishlist-action {
  margin-top: 16px;
}

.btn-wishlist {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(155, 135, 245, 0.08);
  border: 1px dashed rgba(155, 135, 245, 0.4);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.btn-wishlist:hover {
  background: rgba(155, 135, 245, 0.15);
  border-style: solid;
}

.btn-wishlist.in-wishlist {
  background: rgba(155, 135, 245, 0.15);
  border: 1px solid var(--primary);
  border-style: solid;
}

.btn-wishlist.in-wishlist:hover {
  background: rgba(155, 135, 245, 0.25);
}

.btn-wishlist svg {
  flex-shrink: 0;
}

.wishlist-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: 8px;
}

/* 想要清单弹窗 */
.wishlist-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.wishlist-dialog {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.wishlist-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-200);
}

.wishlist-dialog-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.wishlist-dialog-body {
  padding: 20px;
}

.wishlist-product {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(155, 135, 245, 0.08);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.wishlist-product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.wp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.wp-info h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wp-price {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}

.cooling-select {
  margin-bottom: 20px;
}

.cooling-select .label,
.reason-input .label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.cooling-options {
  display: flex;
  gap: 10px;
}

.cooling-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--gray-300);
  background: var(--white);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.cooling-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.cooling-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--white);
}

.cooling-tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.reason-input textarea {
  width: 100%;
  height: 80px;
  padding: 12px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.reason-input textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.wishlist-dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--gray-200);
}

.wishlist-dialog-footer .btn {
  flex: 1;
  padding: 10px 0;
}

@media (max-width: 900px) {
  .price-stats {
    gap: 12px;
  }
  
  .stat-badge {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }
  
  .price-actions {
    flex-direction: column;
  }
  
  .price-chart {
    height: 200px;
  }
}
</style>
