<template>
  <div class="order-detail-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <button class="back-btn" @click="$router.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            返回
          </button>
          <h1>订单详情</h1>
        </div>

        <div class="detail-layout" v-if="order">
          <!-- 订单状态 -->
          <div class="status-card glass-card">
            <div class="status-info">
              <span class="status-label" :class="getStatusClass(order.orderStatus)">{{ getStatusText(order.orderStatus) }}</span>
              <p class="status-desc">{{ getStatusDesc(order.orderStatus) }}</p>
            </div>
            <div class="status-actions">
              <button v-if="order.orderStatus === 0" class="btn btn-primary" @click="payOrder">立即支付</button>
              <button v-if="order.orderStatus === 0" class="btn btn-glass" @click="cancelOrder">取消订单</button>
              <button v-if="order.orderStatus === 2" class="btn btn-primary" @click="confirmReceive">确认收货</button>
            </div>
          </div>

          <!-- 收货信息 -->
          <div class="info-card glass-card">
            <h3>收货信息</h3>
            <div class="address-info" v-if="order.shippingAddress">
              <p><strong>{{ order.shippingAddress.name }}</strong> {{ order.shippingAddress.phone }}</p>
              <p>{{ order.shippingAddress.province }}{{ order.shippingAddress.city }}{{ order.shippingAddress.district }}{{ order.shippingAddress.detail }}</p>
            </div>
            <div v-else class="no-address">暂无收货地址信息</div>
          </div>

          <!-- 商品列表 -->
          <div class="items-card glass-card">
            <h3>商品信息</h3>
            <div class="items-list">
              <div v-for="item in order.items" :key="item.id" class="order-item" @click="$router.push(`/product/${item.productId}`)">
                <img :src="item.productImage" class="item-img" @error="imgErr" />
                <div class="item-info">
                  <h4>{{ item.productName }}</h4>
                  <p>¥{{ item.productPrice }} × {{ item.quantity }}</p>
                </div>
                <div class="item-subtotal">¥{{ (item.productPrice * item.quantity).toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- 订单信息 -->
          <div class="order-info-card glass-card">
            <h3>订单信息</h3>
            <div class="info-row"><span>订单编号</span><span>{{ order.orderNo }}</span></div>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import orderApi from '../api/orderApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const order = ref<any>(null)

const imgErr = (e: Event) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80/f8f8fc/ccc?text=商品' }

const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '已退款' }[status] || '未知')
const getStatusClass = (status: number) => ({ 0: 'pending', 1: 'processing', 2: 'shipping', 3: 'completed', 4: 'cancelled' }[status] || '')
const getStatusDesc = (status: number) => ({
  0: '请尽快完成支付，超时订单将自动取消',
  1: '商家正在准备商品，请耐心等待',
  2: '商品已发出，请注意查收',
  3: '订单已完成，感谢您的购买',
  4: '订单已取消'
}[status] || '')

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const payOrder = () => ElMessage.info('跳转支付页面...')
const cancelOrder = async () => {
  try {
    await orderApi.cancelOrder(order.value.id)
    order.value.orderStatus = 4
    ElMessage.success('订单已取消')
  } catch { ElMessage.error('取消失败') }
}
const confirmReceive = async () => {
  try {
    await orderApi.confirmReceive(order.value.id)
    order.value.orderStatus = 3
    ElMessage.success('已确认收货')
  } catch { ElMessage.error('操作失败') }
}

onMounted(async () => {
  try {
    const res: any = await orderApi.getOrderById(Number(route.params.id))
    if (res?.code === 200) order.value = res.data
  } catch { ElMessage.error('获取订单详情失败'); router.back() }
})
</script>

<style scoped>
.order-detail-page { min-height: 100vh; background: var(--white); position: relative; }
.order-detail-page::before { content: ''; position: fixed; top: 5%; right: -10%; width: 600px; height: 600px; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.container { max-width: 900px; margin: 0 auto; padding: 0 20px; }

.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: none; border: 1px solid rgba(200, 220, 255, 0.5); border-radius: 20px; font-size: 14px; color: var(--text-body); cursor: pointer; }
.back-btn:hover { border-color: var(--sakura); color: var(--sakura); }
.page-header h1 { font-size: 1.5rem; font-weight: 600; color: var(--text-title); margin: 0; }

.glass-card { background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); border: 1px solid rgba(200, 220, 255, 0.5); border-radius: var(--radius-lg); box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08); padding: 24px; margin-bottom: 20px; }
.glass-card h3 { font-size: 16px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }

.status-card { display: flex; justify-content: space-between; align-items: center; }
.status-label { font-size: 24px; font-weight: 600; }
.status-label.pending { color: #e67e22; }
.status-label.processing { color: var(--sakura); }
.status-label.shipping { color: #3498db; }
.status-label.completed { color: #27ae60; }
.status-label.cancelled { color: var(--text-muted); }
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
.item-subtotal { font-size: 17px; font-weight: 600; color: #5A8FD4; }

.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(200, 220, 255, 0.2); font-size: 14px; }
.info-row:last-child { border-bottom: none; }
.info-row span:first-child { color: var(--text-muted); }
.info-row span:last-child { color: var(--text-body); }
.info-row.total { padding-top: 16px; margin-top: 8px; border-top: 1px solid rgba(200, 220, 255, 0.3); }
.info-row.total em { font-style: normal; font-size: 22px; font-weight: 600; color: #5A8FD4; }

.loading { text-align: center; padding: 60px; color: var(--text-muted); }

@media (max-width: 768px) {
  .status-card { flex-direction: column; gap: 20px; text-align: center; }
  .status-actions { width: 100%; }
  .status-actions .btn { flex: 1; }
}
</style>
