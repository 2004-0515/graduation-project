<template>
  <div class="order-detail-page" data-testid="order-detail-view">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            返回
          </button>
          <button class="back-btn secondary" @click="router.push('/orders')">订单列表</button>
          <h1>订单详情</h1>
        </div>

        <div class="detail-layout" v-if="order">
          <!-- 订单状态 -->
          <div class="status-card glass-card">
            <div class="status-info">
              <span class="status-label" :class="getStatusClass(order.orderStatus)" data-testid="order-detail-status">{{ getStatusText(order.orderStatus) }}</span>
              <p class="status-desc">{{ getStatusDesc(order.orderStatus) }}</p>
            </div>
            <div class="status-actions">
              <button v-if="order.orderStatus === 0" class="btn btn-primary" data-testid="order-detail-pay" @click="payOrder">立即支付</button>
              <button v-if="order.orderStatus === 0" class="btn btn-glass" data-testid="order-detail-cancel" @click="cancelOrder">取消订单</button>
              <button v-if="order.orderStatus === 1 && order.paymentStatus === 1" class="btn btn-glass" data-testid="order-detail-request-cancel" @click="requestCancelOrder">申请取消</button>
              <button v-if="order.orderStatus === 2" class="btn btn-primary" data-testid="order-detail-confirm" @click="confirmReceive">确认收货</button>
            </div>
          </div>

          <!-- 收货信息 -->
          <div class="info-card glass-card">
            <h3>收货信息</h3>
            <div class="address-info" v-if="order.shippingAddress">
              <p><strong>{{ order.shippingAddress.receiver || order.shippingAddress.name }}</strong> {{ order.shippingAddress.phone }}</p>
              <p>{{ order.shippingAddress.province }}{{ order.shippingAddress.city }}{{ order.shippingAddress.district }}{{ order.shippingAddress.detail }}</p>
            </div>
            <div v-else class="no-address">暂无收货地址信息</div>
          </div>

          <!-- 商品列表 -->
          <div class="items-card glass-card">
            <h3>商品信息</h3>
            <div class="items-list">
              <div v-for="item in order.items" :key="item.id" class="order-item" @click="$router.push(`/product/${item.productId}`)">
                <img :src="getImageUrl(item.productImage)" :alt="item.productName || '商品图片'" class="item-img" @error="imgErr" />
                <div class="item-info">
                  <h4>{{ item.productName }}</h4>
                  <p>¥{{ item.price }} × {{ item.quantity }}</p>
                </div>
                <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- 订单信息 -->
          <div class="order-info-card glass-card">
            <h3>订单信息</h3>
            <div class="info-row"><span>订单编号</span><span data-testid="order-detail-order-no">{{ order.orderNo }}</span></div>
            <div class="info-row"><span>下单时间</span><span>{{ formatDate(order.createdTime) }}</span></div>
            <div class="info-row" v-if="order.paymentTime"><span>支付时间</span><span>{{ formatDate(order.paymentTime) }}</span></div>
            <div class="info-row" v-if="order.shippingTime"><span>发货时间</span><span>{{ formatDate(order.shippingTime) }}</span></div>
            <div class="info-row" v-if="order.remark"><span>订单备注</span><span>{{ order.remark }}</span></div>
            <div class="info-row total"><span>订单总额</span><em>¥{{ order.totalAmount?.toFixed(2) }}</em></div>
          </div>
        </div>

        <div v-else class="loading">加载中...</div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import orderApi from '../api/orderApi'
import fileApi from '../api/fileApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { debugError } from '@/utils/debug'
import type { Order } from '@/types'
import { goBackOr } from '@/utils/navigation'

const getImageUrl = (path?: string) => fileApi.getImageUrl(path || '')

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
let latestOrderRequestId = 0
const invalidateOrderRequests = () => {
  latestOrderRequestId += 1
}

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#f8f8fc" width="80" height="80"/><text fill="#ccc" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em">商品</text></svg>')
}

const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '申请取消中' }[status] || '未知')
const getStatusClass = (status: number) => ({ 0: 'pending', 1: 'processing', 2: 'shipping', 3: 'completed', 4: 'cancelled', 5: 'refunding', 6: 'cancel-requested' }[status] || '')
const getStatusDesc = (status: number) => ({
  0: '请尽快完成支付，超时订单将自动取消',
  1: '订单已支付，等待发货。您可在发货前申请取消',
  2: '商品已发出，请注意查收',
  3: '订单已完成，感谢您的购买',
  4: '订单已取消',
  6: '取消申请已提交，等待管理员审核'
}[status] || '')

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const payOrder = () => {
  if (!order.value) return
  router.push(`/payment/${order.value.id}`)
}

const goBack = () => {
  goBackOr(router, '/orders')
}

const resetOrderDetailState = () => {
  order.value = null
}

const refreshOrderAfterSuccess = async (actionLabel: string) => {
  try {
    await fetchOrder()
  } catch (error) {
    debugError(`${actionLabel}后刷新订单详情失败:`, error)
  }
}

const applyLocalOrder = (updater: (current: Order) => Order) => {
  if (!order.value) return
  order.value = updater(order.value as Order)
}

const fetchOrder = async () => {
  const orderId = Number(route.params.id)
  if (!orderId) {
    ElMessage.error('订单不存在')
    goBackOr(router, '/orders')
    return
  }

  const requestId = ++latestOrderRequestId
  const res = await orderApi.getOrderById(orderId)
  if (requestId !== latestOrderRequestId) {
    return
  }
  if (res?.code === 200) {
    order.value = res.data
    return
  }

  debugError('获取订单详情失败:', res?.message || '订单详情返回异常')
  throw new Error(res?.message || '获取订单详情失败')
}

const cancelOrder = async () => {
  if (!order.value) return
  try {
    const res = await orderApi.cancelOrder(order.value.id)
    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder((current) => ({
        ...current,
        orderStatus: 4,
        orderStatusName: '已取消'
      }))
      ElMessage.success('订单已取消')
      await refreshOrderAfterSuccess('取消订单')
      return
    }
    const message = res?.message || '取消订单失败'
    debugError('取消订单失败:', message)
    ElMessage.error(message)
  } catch (error) {
    debugError('取消订单失败:', error)
    ElMessage.error(getErrorMessage(error, '取消订单失败'))
  }
}
const requestCancelOrder = async () => {
  if (!order.value) return
  try {
    const res = await orderApi.requestCancelOrder(order.value.id)
    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder((current) => ({
        ...current,
        orderStatus: 6,
        orderStatusName: '申请取消中'
      }))
      ElMessage.success('取消申请已提交')
      await refreshOrderAfterSuccess('提交取消申请')
      return
    }
    const message = res?.message || '申请取消失败'
    debugError('申请取消订单失败:', message)
    ElMessage.error(message)
  } catch (error) {
    debugError('申请取消订单失败:', error)
    ElMessage.error(getErrorMessage(error, '申请取消失败'))
  }
}
const confirmReceive = async () => {
  if (!order.value) return
  try {
    const res = await orderApi.confirmReceive(order.value.id)
    if (res?.code === 200) {
      invalidateOrderRequests()
      applyLocalOrder((current) => ({
        ...current,
        orderStatus: 3,
        orderStatusName: '已完成'
      }))
      ElMessage.success('已确认收货')
      await refreshOrderAfterSuccess('确认收货')
      return
    }
    const message = res?.message || '确认收货失败'
    debugError('确认收货失败:', message)
    ElMessage.error(message)
  } catch (error) {
    debugError('确认收货失败:', error)
    ElMessage.error(getErrorMessage(error, '确认收货失败'))
  }
}

const reloadOrderDetailFromRoute = async () => {
  resetOrderDetailState()
  await fetchOrder()
}

onMounted(async () => {
  try {
    await reloadOrderDetailFromRoute()
  } catch (error) {
    debugError('初始化订单详情失败:', error)
    ElMessage.error(getErrorMessage(error, '获取订单详情失败'))
    goBackOr(router, '/orders')
  }
})

watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId === oldId) {
      return
    }
    try {
      await reloadOrderDetailFromRoute()
    } catch (error) {
      debugError('切换订单详情失败:', error)
      ElMessage.error(getErrorMessage(error, '获取订单详情失败'))
      goBackOr(router, '/orders')
    }
  }
)
</script>

<style scoped>
.order-detail-page { min-height: 100vh; background: var(--white); position: relative; }
.order-detail-page::before { content: ''; position: fixed; top: 5%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent); opacity: 0.15; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.container { max-width: 900px; margin: 0 auto; padding: 0 20px; }

.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: none; border: 1px solid rgba(200, 220, 255, 0.5); border-radius: 20px; font-size: 14px; color: var(--text-body); cursor: pointer; }
.back-btn.secondary { background: rgba(255, 255, 255, 0.82); }
.back-btn:hover { border-color: var(--sakura); color: var(--sakura); }
.page-header h1 { font-size: 1.5rem; font-weight: 600; color: var(--text-title); margin: 0; }

.glass-card { background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); border: 1px solid rgba(200, 220, 255, 0.5); border-radius: var(--radius-lg); box-shadow: 0 8px 32px rgba(155, 135, 245, 0.08); padding: 24px; margin-bottom: 20px; }
.glass-card h3 { font-size: 16px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }

.status-card { display: flex; justify-content: space-between; align-items: center; }
.status-label { font-size: 24px; font-weight: 600; }
.status-label.pending { color: #e67e22; }
.status-label.processing { color: var(--sakura); }
.status-label.shipping { color: #3498db; }
.status-label.completed { color: #27ae60; }
.status-label.cancelled { color: var(--text-muted); }
.status-label.cancel-requested { color: #e67e22; }
.status-desc { font-size: 14px; color: var(--text-muted); margin: 8px 0 0; }
.status-actions { display: flex; gap: 12px; }
.status-actions .btn { padding: 12px 28px; }

.address-info p { margin: 0 0 6px; font-size: 15px; color: var(--text-body); }
.no-address { color: var(--text-muted); font-size: 14px; }

.items-list { display: flex; flex-direction: column; gap: 12px; }
.order-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: rgba(245, 250, 255, 0.5); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; }
.order-item:hover { background: rgba(230, 242, 255, 0.6); }
.item-img { width: 72px; height: 72px; border-radius: var(--radius-md); object-fit: cover; }
.item-info { flex: 1; }
.item-info h4 { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: var(--text-title); }
.item-info p { margin: 0; font-size: 14px; color: var(--text-muted); }
.item-subtotal { font-size: 17px; font-weight: 600; color: var(--primary); }

.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(200, 220, 255, 0.2); font-size: 14px; }
.info-row:last-child { border-bottom: none; }
.info-row span:first-child { color: var(--text-muted); }
.info-row span:last-child { color: var(--text-body); }
.info-row.total { padding-top: 16px; margin-top: 8px; border-top: 1px solid rgba(200, 220, 255, 0.3); }
.info-row.total em { font-style: normal; font-size: 22px; font-weight: 600; color: var(--primary); }

.loading { text-align: center; padding: 60px; color: var(--text-muted); }

@media (max-width: 768px) {
  .status-card { flex-direction: column; gap: 20px; text-align: center; }
  .status-actions { width: 100%; }
  .status-actions .btn { flex: 1; }
}
</style>
