<template>
  <div class="orders-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <div class="header-content">
            <h1>我的订单</h1>
            <p>查看和管理您的所有订单</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-num">{{ orders.length }}</span>
              <span class="stat-label">全部订单</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ pendingCount }}</span>
              <span class="stat-label">待处理</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-tabs">
            <button v-for="tab in tabs" :key="tab.value" :class="['tab-btn', { active: activeTab === tab.value }]" @click="activeTab = tab.value; currentPage = 1">
              {{ tab.label }}
              <span class="tab-count" v-if="getTabCount(tab.value) > 0">{{ getTabCount(tab.value) }}</span>
            </button>
          </div>
          <div class="filter-actions">
            <div class="search-box">
              <input type="text" v-model="searchKeyword" placeholder="搜索订单号/商品名" />
            </div>
          </div>
        </div>

        <div v-if="loading" class="empty-state">
          <h3>加载中...</h3>
          <p>正在获取订单数据</p>
        </div>

        <div v-else-if="errorMsg" class="empty-state">
          <h3>加载失败</h3>
          <p style="color: #e74c3c;">{{ errorMsg }}</p>
          <button @click="fetchOrders" class="browse-btn">重试</button>
        </div>

        <div class="orders-list" v-else-if="filteredOrders.length > 0">
          <div v-for="order in paginatedOrders" :key="order.id" class="order-card">
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
                  <p class="item-price">¥{{ item.price }} x {{ item.quantity }}</p>
                </div>
                <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                <!-- 评价按钮 -->
                <button 
                  v-if="order.orderStatus === 3" 
                  class="btn-review"
                  :class="{ reviewed: item.reviewed }"
                  @click="openReviewDialog(order, item)"
                  :disabled="item.reviewed"
                >
                  {{ item.reviewed ? '已评价' : '评价' }}
                </button>
              </div>
            </div>
            <div class="order-footer">
              <div class="footer-left">
                <!-- 备注显示 -->
                <div class="order-remark-inline" v-if="order.remark">
                  <span class="remark-tag">📝 备注</span>
                  <span class="remark-content">{{ order.remark }}</span>
                </div>
              </div>
              <div class="footer-right">
                <div class="order-total">
                  共 {{ getTotalQuantity(order) }} 件，
                  <span v-if="order.couponDiscount && order.couponDiscount > 0" class="discount-info">
                    原价 ¥{{ order.totalAmount?.toFixed(2) }}，优惠 ¥{{ order.couponDiscount?.toFixed(2) }}，
                  </span>
                  实付 <em>¥{{ getActualPayAmount(order).toFixed(2) }}</em>
                </div>
                <div class="order-actions">
                  <button v-if="order.orderStatus === 0" class="btn-cancel" @click="cancelOrder(order)">取消订单</button>
                  <button v-if="order.orderStatus === 1" class="btn-cancel" @click="requestCancelOrder(order)">申请取消</button>
                  <button v-if="order.orderStatus === 0" class="btn-pay" @click="payOrder(order)">立即支付</button>
                  <button v-if="order.orderStatus === 2" class="btn-confirm" @click="confirmReceive(order)">确认收货</button>
                  <span v-if="order.orderStatus === 6" class="status-tip">等待管理员审核</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <h3>暂无订单</h3>
          <p>快去挑选心仪的商品吧</p>
          <router-link to="/category" class="browse-btn">去逛逛</router-link>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="!loading && !errorMsg && filteredOrders.length > 0">
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

        <!-- 评价弹窗 -->
        <el-dialog v-model="reviewDialogVisible" title="发表评价" width="500px" class="review-dialog">
          <div class="review-form" v-if="currentReviewItem">
            <div class="review-product">
              <img :src="getImageUrl(currentReviewItem.productImage)" class="product-thumb" />
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
                >★</span>
                <span class="rating-text">{{ ratingTexts[reviewForm.rating - 1] }}</span>
              </div>
            </div>
            <div class="form-item">
              <label>评价内容</label>
              <el-input
                v-model="reviewForm.content"
                type="textarea"
                :rows="4"
                placeholder="分享您的使用体验，帮助其他买家做出选择"
                maxlength="500"
                show-word-limit
              />
            </div>
            <div class="form-item">
              <el-checkbox v-model="reviewForm.anonymous">匿名评价</el-checkbox>
            </div>
          </div>
          <template #footer>
            <el-button @click="reviewDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitReview" :loading="submittingReview">提交评价</el-button>
          </template>
        </el-dialog>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import orderApi from '../api/orderApi'
import reviewApi from '../api/reviewApi'
import fileApi from '../api/fileApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const tabs = [
  { label: '全部', value: -1 },
  { label: '待付款', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
  { label: '申请取消中', value: 6 }
]

const activeTab = ref(-1)
const orders = ref<any[]>([])
const searchKeyword = ref('')
const loading = ref(true)
const errorMsg = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

// 评价相关
const reviewDialogVisible = ref(false)
const currentReviewOrder = ref<any>(null)
const currentReviewItem = ref<any>(null)
const submittingReview = ref(false)
const ratingTexts = ['非常差', '差', '一般', '好', '非常好']
const reviewForm = reactive({
  rating: 5,
  content: '',
  anonymous: false
})

const pendingCount = computed(() => orders.value.filter(o => o.orderStatus === 0 || o.orderStatus === 1 || o.orderStatus === 2).length)

const filteredOrders = computed(() => {
  let result = orders.value
  if (activeTab.value !== -1) result = result.filter(o => o.orderStatus === activeTab.value)
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(o => o.orderNo?.toLowerCase().includes(keyword) || o.items?.some((item: any) => item.productName?.toLowerCase().includes(keyword)))
  }
  return result
})

// 分页后的订单
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredOrders.value.slice(start, end)
})

// 分页变化时重置到第一页
const handleSizeChange = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 搜索时重置页码
watch(searchKeyword, () => {
  currentPage.value = 1
})

const getTabCount = (value: number) => value === -1 ? orders.value.length : orders.value.filter(o => o.orderStatus === value).length
const getTotalQuantity = (order: any) => order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0
const getActualPayAmount = (order: any) => {
  const total = Number(order.totalAmount) || 0
  const discount = Number(order.couponDiscount) || 0
  return Math.max(0, total - discount)
}
const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 6: '申请取消中' }[status] || '未知')
const getStatusClass = (status: number) => ({ 0: 'pending', 1: 'processing', 2: 'shipping', 3: 'completed', 4: 'cancelled', 6: 'cancel-requested' }[status] || '')

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const payOrder = (order: any) => router.push(`/payment/${order.id}`)
const cancelOrder = async (order: any) => { 
  try { 
    await orderApi.cancelOrder(order.id)
    ElMessage.success('订单已取消')
    await fetchOrders()
  } catch { 
    ElMessage.error('取消失败') 
  } 
}

const requestCancelOrder = async (order: any) => { 
  try { 
    await orderApi.requestCancelOrder(order.id)
    ElMessage.success('取消申请已提交，等待管理员审核')
    await fetchOrders()
  } catch { 
    ElMessage.error('申请失败') 
  } 
}
const confirmReceive = async (order: any) => { 
  try { 
    await orderApi.confirmReceive(order.id)
    ElMessage.success('已确认收货')
    // 重新获取订单列表，确保数据同步
    await fetchOrders()
  } catch { 
    ElMessage.error('操作失败') 
  } 
}

// 评价相关方法
const openReviewDialog = (order: any, item: any) => {
  if (item.reviewed) return
  currentReviewOrder.value = order
  currentReviewItem.value = item
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewForm.anonymous = false
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (reviewForm.rating < 1) {
    ElMessage.warning('请选择评分')
    return
  }
  
  submittingReview.value = true
  try {
    const res: any = await reviewApi.createReview({
      productId: currentReviewItem.value.productId,
      orderId: currentReviewOrder.value.id,
      orderItemId: currentReviewItem.value.id,
      rating: reviewForm.rating,
      content: reviewForm.content,
      anonymous: reviewForm.anonymous
    })
    
    if (res?.code === 200) {
      ElMessage.success('评价成功')
      currentReviewItem.value.reviewed = true
      reviewDialogVisible.value = false
    } else {
      ElMessage.error(res?.message || '评价失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '评价失败')
  } finally {
    submittingReview.value = false
  }
}

const fetchOrders = async () => {
  console.log('开始获取订单...')
  loading.value = true
  errorMsg.value = ''
  try {
    const res: any = await orderApi.getUserOrders()
    console.log('获取订单响应:', res)
    if (res?.code === 200) {
      orders.value = res.data || []
      console.log('订单列表:', orders.value)
      // 调试：打印每个订单的备注
      orders.value.forEach((o: any) => {
        console.log(`订单 ${o.orderNo} 备注:`, o.remark)
      })
    } else {
      errorMsg.value = res?.message || '获取订单失败'
      console.log('获取订单失败，响应码:', res?.code, '消息:', res?.message)
    }
  } catch (error: any) { 
    errorMsg.value = error?.message || '获取订单异常'
    console.error('获取订单异常:', error) 
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('=== OrdersView onMounted 开始 ===')
  // 从URL参数读取状态筛选
  const statusParam = route.query.status
  if (statusParam !== undefined) {
    activeTab.value = Number(statusParam)
  }
  // 从URL参数读取搜索关键词
  const searchParam = route.query.search
  if (searchParam) {
    searchKeyword.value = String(searchParam)
  }
  await fetchOrders()
  console.log('=== OrdersView onMounted 完成 ===')
})

// 监听路由参数变化
watch(() => route.query.status, (newStatus) => {
  if (newStatus !== undefined) {
    activeTab.value = Number(newStatus)
  } else {
    activeTab.value = -1
  }
})

// 监听搜索参数变化
watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    searchKeyword.value = String(newSearch)
  }
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
.stat-num { display: block; font-size: 32px; font-weight: 600; color: #5A8FD4; }
.stat-label { font-size: 14px; color: #999; }
.filter-section { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { padding: 10px 20px; background: #fff; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; transition: all 0.3s; }
.tab-btn:hover { border-color: #5A8FD4; color: #5A8FD4; }
.tab-btn.active { background: #5A8FD4; color: #fff; border-color: #5A8FD4; }
.tab-count { margin-left: 4px; padding: 2px 8px; background: rgba(255,255,255,0.3); border-radius: 10px; font-size: 12px; }
.search-box input { padding: 10px 16px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
.search-box input:focus { border-color: #5A8FD4; }
.orders-list { display: flex; flex-direction: column; gap: 16px; }
.order-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
.order-header { display: flex; justify-content: space-between; padding: 16px 20px; background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%); border-bottom: 1px solid #e8f0fe; }
.header-left { display: flex; gap: 16px; align-items: center; }
.order-no { 
  font-weight: 600; 
  color: #5A8FD4;
  background: linear-gradient(135deg, #e8f2ff 0%, #d4e8ff 100%);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  border: 1px solid rgba(90, 143, 212, 0.2);
}
.order-time { color: #999; }
.order-status { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.order-status.pending { color: #e67e22; }
.order-status.pending .status-dot { background: #e67e22; }
.order-status.processing { color: #5A8FD4; }
.order-status.processing .status-dot { background: #5A8FD4; }
.order-status.shipping { color: #3498db; }
.order-status.shipping .status-dot { background: #3498db; }
.order-status.completed { color: #27ae60; }
.order-status.completed .status-dot { background: #27ae60; }
.order-status.cancelled { color: #999; }
.order-status.cancelled .status-dot { background: #999; }
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
.item-subtotal { font-size: 16px; font-weight: 600; color: #5A8FD4; }
.order-footer { 
  display: flex; 
  justify-content: space-between; 
  padding: 16px 20px; 
  border-top: 1px solid #e8f0fe; 
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%); 
}
.footer-right { display: flex; align-items: center; gap: 20px; }
.order-total em { font-style: normal; font-size: 20px; font-weight: 600; color: #5A8FD4; }
.discount-info { color: #e67e22; font-size: 13px; }
.order-actions { display: flex; gap: 10px; }
.order-actions button { padding: 8px 20px; border-radius: 20px; cursor: pointer; transition: all 0.3s; }
.btn-pay { background: #5A8FD4; color: #fff; border: none; }
.btn-confirm { background: #27ae60; color: #fff; border: none; }
.btn-cancel { background: transparent; border: 1px solid #999; color: #999; }
.empty-state { text-align: center; padding: 80px 20px; background: #fff; border-radius: 12px; }
.empty-state h3 { font-size: 20px; margin: 0 0 8px; }
.empty-state p { color: #999; margin: 0 0 24px; }
.browse-btn { display: inline-block; padding: 12px 32px; background: #5A8FD4; color: #fff; border-radius: 24px; text-decoration: none; }
.order-remark { padding: 14px 20px; background: linear-gradient(135deg, #fffbf0, #fff8e6); border-top: 1px dashed #f0e6d0; display: flex; align-items: center; }
.remark-label { color: #e67e22; font-size: 14px; font-weight: 600; white-space: nowrap; }
.remark-text { color: #555; font-size: 14px; margin-left: 8px; }
.order-remark-inline { display: flex; align-items: center; gap: 8px; }
.remark-tag { 
  background: linear-gradient(135deg, #e8f2ff 0%, #d4e8ff 100%); 
  color: #5A8FD4; 
  padding: 4px 10px; 
  border-radius: 12px; 
  font-size: 12px; 
  font-weight: 500;
  border: 1px solid rgba(90, 143, 212, 0.2);
}
.remark-content { color: #666; font-size: 14px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 32px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
:deep(.el-pagination) { --el-pagination-button-bg-color: #fff; }
:deep(.el-pagination .el-pager li.is-active) { background: #5A8FD4; }

/* 评价按钮 */
.btn-review { padding: 6px 16px; border-radius: 16px; font-size: 13px; cursor: pointer; transition: all 0.3s; background: #5A8FD4; color: #fff; border: none; }
.btn-review:hover:not(:disabled) { background: #4a7fc4; }
.btn-review.reviewed { background: #e0e0e0; color: #999; cursor: default; }

/* 评价弹窗 */
.review-dialog .review-product { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px; }
.review-dialog .product-thumb { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
.review-dialog .form-item { margin-bottom: 20px; }
.review-dialog .form-item label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
.review-dialog .rating-select { display: flex; align-items: center; gap: 8px; }
.review-dialog .rating-select .star { font-size: 28px; color: #ddd; cursor: pointer; transition: all 0.2s; }
.review-dialog .rating-select .star:hover, .review-dialog .rating-select .star.filled { color: #ffc107; }
.review-dialog .rating-text { margin-left: 12px; color: #666; font-size: 14px; }
</style>
