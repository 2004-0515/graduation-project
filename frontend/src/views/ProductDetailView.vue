<template>
  <div class="detail-page">
    <div class="deco-layer">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <div class="container">
        <!-- 返回按钮 -->
        <div class="back-bar" v-if="canGoBack">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">&larr;</span>
            <span>返回</span>
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
                <img :src="img" @error="imgErr" />
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

            <div class="info-row">
              <span class="label">库存</span>
              <span class="value">{{ product.stock }} 件</span>
            </div>

            <div class="info-row">
              <span class="label">数量</span>
              <div class="qty-control">
                <button @click="quantity > 1 && quantity--">-</button>
                <input type="number" v-model.number="quantity" min="1" :max="product.stock" />
                <button @click="quantity < product.stock && quantity++">+</button>
              </div>
            </div>

            <div class="action-row">
              <button class="btn btn-glass" @click="addToCart">加入购物车</button>
              <button class="btn btn-primary" @click="buyNow">立即购买</button>
            </div>

            <div class="service-row">
              <span>正品保障</span>
              <span>7天无理由</span>
              <span>极速发货</span>
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
                      <img v-if="r.avatar" :src="getImageUrl(r.avatar)" class="user-avatar" @error="imgErr" />
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
                    <img v-for="(img, idx) in parseImages(r.images)" :key="idx" :src="getImageUrl(img)" @error="imgErr" />
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
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import productApi from '../api/productApi'
import reviewApi from '../api/reviewApi'
import fileApi from '../api/fileApi'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

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

// 广告视频相关
const showAdVideo = ref(false)
const adCountdown = ref(0)
const adVideoRef = ref<HTMLVideoElement>()
let adTimer: ReturnType<typeof setInterval> | null = null

// 返回按钮相关
const canGoBack = computed(() => window.history.length > 1)
const goBack = () => {
  router.back()
}

const userId = computed(() => userStore.userInfo?.id)

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  // 使用 data URI 作为占位图，避免外部服务不可用
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f8f8fc" width="400" height="400"/><text fill="#ccc" font-family="Arial" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const getVideoUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `http://localhost:8080/api${normalizedPath}`
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

const formatTime = (time: string) => {
  if (!time) return ''
  return time.substring(0, 10)
}

const parseImages = (images: string) => {
  if (!images) return []
  try {
    return JSON.parse(images)
  } catch {
    return images.split(',').filter(Boolean)
  }
}

const fetchProduct = async () => {
  try {
    const res: any = await productApi.getProductById(Number(route.params.id))
    if (res?.code === 200) {
      product.value = res.data
      currentImage.value = getImageUrl(product.value.mainImage)
      if (!product.value.images) product.value.images = [product.value.mainImage]
      else if (typeof product.value.images === 'string') {
        product.value.images = product.value.images.split(',').filter(Boolean)
      }
      // 转换所有图片URL
      product.value.images = product.value.images.map((img: string) => getImageUrl(img))
    }
  } catch { ElMessage.error('获取商品信息失败') }
}

const fetchReviews = async () => {
  const productId = Number(route.params.id)
  try {
    const [reviewsRes, statsRes]: any[] = await Promise.all([
      reviewApi.getAllProductReviews(productId),
      reviewApi.getProductReviewStats(productId)
    ])
    if (reviewsRes?.code === 200) {
      reviews.value = reviewsRes.data || []
    }
    if (statsRes?.code === 200) {
      reviewStats.value = statsRes.data || { total: 0, avgRating: 0, goodRate: 100 }
    }
  } catch (e) {
    console.error('获取评价失败', e)
  }
}

const addToCart = async () => {
  if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); router.push('/login'); return }
  try { await cartStore.addToCart(userId.value, product.value.id, quantity.value) } catch { ElMessage.error('加入购物车失败') }
}

const buyNow = () => {
  if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); router.push('/login'); return }
  router.push(`/checkout?productId=${product.value.id}&quantity=${quantity.value}`)
}

// 判断是否是自己的评价
const isOwnReview = (review: any) => {
  if (!userStore.isLoggedIn || !userStore.userInfo?.id) return false
  return review.userId === userStore.userInfo.id
}

// 删除评价
const deleteReview = async (review: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', { type: 'warning' })
    const res: any = await reviewApi.deleteReview(review.id)
    if (res?.code === 200) {
      ElMessage.success('评价已删除')
      // 重新获取评价列表
      fetchReviews()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchProduct()
  fetchReviews()
})
</script>

<style scoped>
.detail-page { min-height: 100vh; background: var(--white); position: relative; }

/* 返回按钮 */
.back-bar { margin-bottom: 20px; }
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(90, 143, 212, 0.1);
  border: 1px solid rgba(90, 143, 212, 0.2);
  border-radius: 8px;
  color: #5A8FD4;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.back-btn:hover {
  background: #5A8FD4;
  color: #fff;
}
.back-icon { font-size: 16px; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; will-change: transform; }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; will-change: transform; }
.s1 { width: 600px; height: 600px; top: 5%; right: -10%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -10%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }

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
.thumb:hover, .thumb.active { border-color: var(--sakura); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Info */
.info-panel h1 { font-size: 2rem; font-weight: 500; margin: 0 0 12px; }
.desc { font-size: 15px; color: var(--text-body); margin: 0 0 24px; line-height: 1.7; }

.price-box { display: flex; align-items: baseline; gap: 12px; padding: 20px; margin-bottom: 24px; }
.price { font-size: 32px; font-weight: 600; color: #5A8FD4; }
.original { font-size: 17px; color: var(--text-muted); text-decoration: line-through; }
.sales { margin-left: auto; font-size: 14px; color: var(--text-muted); }

.info-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(200,200,220,0.2); }
.label { width: 80px; font-size: 15px; color: var(--text-muted); }
.value { font-size: 15px; color: var(--text-body); }

.qty-control { display: flex; align-items: center; }
.qty-control button { width: 32px; height: 32px; border: 1px solid rgba(200,200,220,0.3); background: rgba(255,255,255,0.6); cursor: pointer; }
.qty-control button:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.qty-control button:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.qty-control button:hover { border-color: var(--sakura); color: var(--sakura); }
.qty-control input { width: 80px; height: 32px; border: 1px solid rgba(200,200,220,0.3); border-left: none; border-right: none; text-align: center; font-size: 14px; background: rgba(255,255,255,0.6); }

.action-row { display: flex; gap: 16px; margin-top: 32px; }
.action-row .btn { flex: 1; padding: 14px 0; }

.service-row { display: flex; gap: 20px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(200,200,220,0.2); font-size: 13px; color: var(--text-muted); }

/* Detail Section */
.detail-section { overflow: hidden; }
.tabs { display: flex; border-bottom: 1px solid rgba(200,200,220,0.2); }
.tabs button { padding: 16px 32px; background: none; border: none; font-size: 14px; color: var(--text-muted); cursor: pointer; position: relative; }
.tabs button.active { color: var(--text-title); }
.tabs button.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 2px; background: var(--sakura); }
.tab-content { padding: 32px; min-height: 200px; }
.detail-content h3 { font-size: 18px; font-weight: 500; color: var(--text-title); margin: 0 0 12px; }
.detail-content p { font-size: 14px; color: var(--text-body); line-height: 1.8; margin: 0; }
.spec-content table { width: 100%; border-collapse: collapse; }
.spec-content tr { border-bottom: 1px solid rgba(200,200,220,0.15); }
.spec-content td { padding: 12px 16px; font-size: 14px; }
.spec-content td:first-child { width: 120px; color: var(--text-muted); background: rgba(255,255,255,0.3); }
.review-item { padding: 16px 0; border-bottom: 1px solid rgba(200,200,220,0.15); }
.review-item.own-review { background: rgba(90, 143, 212, 0.05); padding: 16px; margin: 0 -16px; border-radius: var(--radius-md); }
.review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.user-info { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.user-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: var(--sakura); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.username { font-size: 14px; color: var(--text-title); }
.own-tag { padding: 2px 8px; background: linear-gradient(135deg, #5A8FD4, #7BA8E8); color: #fff; font-size: 11px; border-radius: 10px; }
.review-actions { display: flex; align-items: center; gap: 12px; }
.review-time { font-size: 13px; color: var(--text-muted); }
.delete-review-btn { padding: 4px 10px; background: transparent; border: 1px solid #e74c3c; color: #e74c3c; font-size: 12px; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
.delete-review-btn:hover { background: #e74c3c; color: #fff; }
.review-rating { margin-bottom: 8px; }
.review-rating .star { font-size: 14px; color: #ddd; }
.review-rating .star.filled { color: #ffc107; }
.review-text { margin: 0 0 10px; font-size: 14px; color: var(--text-body); line-height: 1.7; }
.review-images { display: flex; gap: 8px; margin-bottom: 10px; }
.review-images img { width: 80px; height: 80px; border-radius: var(--radius-sm); object-fit: cover; cursor: pointer; }
.review-reply { padding: 12px; background: rgba(245, 250, 255, 0.5); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-body); }
.reply-label { color: var(--sakura-deep); font-weight: 500; }

/* 评价统计 */
.review-stats { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(245, 250, 255, 0.5); border-radius: var(--radius-md); margin-bottom: 20px; }
.stats-left { display: flex; align-items: center; gap: 16px; }
.avg-rating { font-size: 36px; font-weight: 600; color: var(--sakura-deep); }
.rating-stars .star { font-size: 18px; color: #ddd; }
.rating-stars .star.filled { color: #ffc107; }
.total-count { font-size: 14px; color: var(--text-muted); }
.good-rate { font-size: 16px; font-weight: 500; color: var(--sakura-deep); }
.empty-review { text-align: center; padding: 40px; color: var(--text-muted); }

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
  background: rgba(90, 143, 212, 0.1);
  color: #5A8FD4;
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
  background: linear-gradient(135deg, #5A8FD4, #7BA3D9);
  color: #fff;
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
</style>
