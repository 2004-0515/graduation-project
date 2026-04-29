<template>
  <div class="payment-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div v-if="order && !showPayModal" class="payment-card glass-card">
          <div class="payment-header">
            <h1>订单支付</h1>
            <p class="order-no">订单号：{{ order.orderNo }}</p>
          </div>

          <div class="order-info">
            <div class="info-section">
              <h3>商品信息</h3>
              <div class="items-list">
                <div v-for="item in order.items" :key="item.id" class="item-row">
                  <img :src="getImageUrl(item.productImage)" :alt="item.productName" @error="imgErr" />
                  <div class="item-detail">
                    <span class="name">{{ item.productName }}</span>
                    <span class="qty">x{{ item.quantity }}</span>
                  </div>
                  <span class="price">¥{{ formatMoney(item.price * item.quantity) }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>收货信息</h3>
              <div v-if="order.shippingAddress" class="address-info">
                <p>
                  <strong>{{ order.shippingAddress.receiver || order.shippingAddress.name }}</strong>
                  {{ order.shippingAddress.phone }}
                </p>
                <p>
                  {{ order.shippingAddress.province }}
                  {{ order.shippingAddress.city }}
                  {{ order.shippingAddress.district }}
                  {{ order.shippingAddress.detail }}
                </p>
              </div>
            </div>
          </div>

          <div class="payment-section">
            <h3>选择支付方式</h3>
            <div class="payment-methods">
              <div
                v-for="method in paymentMethods"
                :key="method.value"
                :class="['method-item', { active: selectedMethod === method.value }]"
                @click="selectedMethod = method.value"
              >
                <div class="method-icon" :style="{ color: method.color }">{{ method.icon }}</div>
                <span>{{ method.label }}</span>
                <div v-if="selectedMethod === method.value" class="check-mark">已选</div>
              </div>
            </div>
          </div>

          <div class="payment-footer">
            <div class="total-section">
              <div v-if="Number(order.couponDiscount || 0) > 0" class="price-detail">
                <span class="original">商品金额：¥{{ formatMoney(order.totalAmount || 0) }}</span>
                <span class="discount">优惠金额：¥{{ formatMoney(order.couponDiscount || 0) }}</span>
              </div>
              <span>应付金额：</span>
              <em class="total-amount">¥{{ formatMoney(actualPayAmount) }}</em>
            </div>
            <div class="action-buttons">
              <button class="btn btn-glass" @click="goBack">返回</button>
              <button
                class="btn btn-primary"
                :disabled="isPaid || order.orderStatus !== 0"
                @click="openPayModal"
              >
                {{ isPaid ? '已支付' : '确认支付' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="showPayModal" class="pay-modal-overlay" @click.self="handleOverlayClick">
          <div class="pay-modal glass-card">
            <div class="modal-header" :style="{ background: currentMethod?.gradient }">
              <span class="modal-icon">{{ currentMethod?.icon }}</span>
              <h2>{{ currentMethod?.label }}</h2>
              <button v-if="payStep === 'scan'" class="close-btn" @click="handleCloseModal">x</button>
            </div>

            <div class="modal-body">
              <div v-if="payStep === 'scan'" class="qr-section">
                <p class="scan-tip">请使用 {{ currentMethod?.label }} 扫码完成支付。</p>
                <div class="qr-code">
                  <div class="qr-placeholder">
                    <div class="qr-grid">
                      <div
                        v-for="i in 81"
                        :key="i"
                        class="qr-cell"
                        :class="{ filled: qrPattern[i - 1] }"
                      ></div>
                    </div>
                    <div class="qr-logo" :style="{ background: currentMethod?.color }">
                      {{ currentMethod?.icon }}
                    </div>
                  </div>
                </div>
                <div class="pay-amount">
                  <span>支付金额</span>
                  <em>¥{{ formatMoney(actualPayAmount) }}</em>
                </div>
                <p class="expire-tip">二维码剩余有效时间 <span>{{ formatTime(countdown) }}</span></p>
                <button class="btn btn-primary btn-block" @click="simulatePay">
                  模拟支付
                </button>
              </div>

              <div v-if="payStep === 'paying'" class="paying-section">
                <div class="paying-animation">
                  <div class="spinner" :style="{ borderTopColor: currentMethod?.color }"></div>
                </div>
                <p>支付处理中...</p>
                <p class="sub-tip">正在等待 {{ currentMethod?.label }} 返回结果</p>
              </div>

              <div v-if="payStep === 'success'" class="success-section">
                <div class="success-icon">成功</div>
                <h3>支付成功</h3>
                <p class="pay-info">支付金额：¥{{ formatMoney(actualPayAmount) }}</p>
                <p class="pay-info">支付方式：{{ currentMethod?.label }}</p>
                <p class="pay-info">交易单号：{{ transactionNo }}</p>
                <button class="btn btn-primary btn-block" @click="goToOrders">查看订单</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="loading-state">
          <p>正在加载订单信息...</p>
        </div>

        <div v-else-if="!order" class="error-state">
          <h3>未找到订单</h3>
          <router-link to="/orders" class="btn btn-primary">返回订单列表</router-link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import orderApi from '../api/orderApi'
import fileApi from '../api/fileApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()

const order = ref<any>(null)
const loading = ref(true)
const selectedMethod = ref(1)
const showPayModal = ref(false)
const payStep = ref<'scan' | 'paying' | 'success'>('scan')
const countdown = ref(300)
const transactionNo = ref('')
const isPaid = ref(false)
const qrPattern = ref<boolean[]>([])
let countdownTimer: ReturnType<typeof setInterval> | null = null

const paymentMethods = [
  {
    value: 1,
    label: '微信支付',
    icon: 'W',
    color: '#07C160',
    gradient: 'linear-gradient(135deg, #07C160, #00a854)'
  },
  {
    value: 2,
    label: '支付宝',
    icon: 'A',
    color: '#1677FF',
    gradient: 'linear-gradient(135deg, #1677FF, #0958d9)'
  }
]

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const formatMoney = (amount: number | string) => Number(amount || 0).toFixed(2)

const currentMethod = computed(() =>
  paymentMethods.find((item) => item.value === selectedMethod.value)
)

const actualPayAmount = computed(() => {
  if (!order.value) return 0
  if (order.value.payAmount != null) {
    return Math.max(0, Number(order.value.payAmount))
  }
  return Math.max(0, Number(order.value.totalAmount || 0) - Number(order.value.couponDiscount || 0))
})

const generateQrPattern = () => {
  qrPattern.value = Array.from({ length: 81 }, () => Math.random() > 0.4)
  const corners = [0, 1, 2, 6, 7, 8, 9, 18, 27, 54, 63, 72, 73, 74, 78, 79, 80]
  corners.forEach((index) => {
    qrPattern.value[index] = true
  })
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return `${minutes}:${String(remain).padStart(2, '0')}`
}

const generateTransactionNo = () => {
  const prefix = selectedMethod.value === 1 ? 'WX' : 'ALI'
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

const imgErr = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect fill="#f8f8fc" width="60" height="60"/><text fill="#ccc" font-family="Arial" font-size="10" x="50%" y="50%" text-anchor="middle" dy=".3em">Item</text></svg>'
    )
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const cancelPay = () => {
  stopCountdown()
  showPayModal.value = false
  payStep.value = 'scan'
}

const startCountdown = () => {
  stopCountdown()
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      cancelPay()
      ElMessage.warning('二维码已过期，请重新发起支付')
    }
  }, 1000)
}

const fetchOrder = async () => {
  const orderId = Number(route.params.id)
  if (!orderId) {
    loading.value = false
    return
  }

  try {
    const res: any = await orderApi.getOrderById(orderId)
    if (res?.code === 200) {
      order.value = res.data
      isPaid.value = order.value?.orderStatus !== 0
      if (order.value?.orderStatus !== 0) {
        ElMessage.warning('该订单当前不是待支付状态')
        router.push('/orders')
      }
    } else {
      ElMessage.error(res?.message || '获取订单详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const openPayModal = () => {
  if (isPaid.value || order.value?.orderStatus !== 0) {
    ElMessage.warning('该订单已支付或当前不可支付')
    return
  }
  showPayModal.value = true
  payStep.value = 'scan'
  countdown.value = 300
  generateQrPattern()
  startCountdown()
}

const handleOverlayClick = () => {
  if (payStep.value === 'scan') {
    cancelPay()
  }
}

const handleCloseModal = () => {
  if (payStep.value === 'scan') {
    cancelPay()
  }
}

const simulatePay = async () => {
  if (!order.value || isPaid.value || payStep.value === 'paying') return

  payStep.value = 'paying'
  stopCountdown()

  await new Promise((resolve) => setTimeout(resolve, 2000))

  try {
    const res: any = await orderApi.payOrder(order.value.id, selectedMethod.value)
    if (res?.code === 200) {
      transactionNo.value = generateTransactionNo()
      payStep.value = 'success'
      isPaid.value = true
      order.value = res.data || order.value
      order.value.orderStatus = 1
    } else {
      ElMessage.error(res?.message || '支付失败')
      payStep.value = 'scan'
      startCountdown()
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '支付失败')
    payStep.value = 'scan'
    startCountdown()
  }
}

const goToOrders = () => {
  router.push('/orders')
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchOrder()
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.payment-page { min-height: 100vh; background: var(--white); }
.main-content { padding: 100px 0 60px; }
.container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
.payment-card { padding: 32px; }
.payment-header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(200,200,220,0.2); }
.payment-header h1 { font-size: 1.75rem; margin: 0 0 8px; color: var(--text-title); }
.order-no { color: var(--text-muted); font-size: 14px; }
.info-section { margin-bottom: 24px; }
.info-section h3 { font-size: 16px; color: var(--text-title); margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(200,200,220,0.15); }
.items-list { display: flex; flex-direction: column; gap: 12px; }
.item-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.5); border-radius: 8px; }
.item-row img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; }
.item-detail { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.item-detail .name { font-size: 14px; color: var(--text-body); }
.item-detail .qty { font-size: 13px; color: var(--text-muted); }
.item-row .price { font-size: 15px; font-weight: 600; color: var(--primary); }
.address-info { padding: 16px; background: rgba(255,255,255,0.5); border-radius: 8px; }
.address-info p { margin: 0 0 8px; font-size: 14px; color: var(--text-body); }
.address-info p:last-child { margin: 0; color: var(--text-muted); }
.payment-section { margin: 32px 0; }
.payment-section h3 { font-size: 16px; color: var(--text-title); margin: 0 0 16px; }
.payment-methods { display: flex; gap: 16px; }
.method-item { flex: 1; display: flex; align-items: center; gap: 12px; padding: 20px; background: rgba(255,255,255,0.6); border: 2px solid rgba(200,200,220,0.3); border-radius: 12px; cursor: pointer; transition: all 0.3s; position: relative; }
.method-item:hover { border-color: var(--primary); }
.method-item.active { border-color: var(--primary); background: rgba(155, 135, 245, 0.05); }
.method-icon { font-size: 20px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.05); border-radius: 8px; font-weight: bold; }
.method-item span { font-size: 15px; color: var(--text-body); }
.check-mark { position: absolute; right: 16px; width: 24px; height: 24px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.payment-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid rgba(200,200,220,0.2); margin-top: 24px; }
.total-section { font-size: 16px; color: var(--text-body); }
.price-detail { margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; }
.price-detail .original { font-size: 14px; color: var(--text-muted); }
.price-detail .discount { font-size: 14px; color: #e74c3c; }
.total-amount { font-style: normal; font-size: 28px; font-weight: 600; color: var(--primary); }
.action-buttons { display: flex; gap: 12px; }
.action-buttons .btn { padding: 12px 32px; }
.pay-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.pay-modal { width: 400px; max-width: 90vw; overflow: hidden; }
.modal-header { padding: 24px; color: white; display: flex; align-items: center; gap: 12px; position: relative; }
.modal-icon { font-size: 24px; width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.modal-header h2 { margin: 0; font-size: 20px; flex: 1; }
.close-btn { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
.close-btn:hover { background: rgba(255,255,255,0.3); }
.modal-body { padding: 32px; }
.qr-section { text-align: center; }
.scan-tip { color: var(--text-body); margin: 0 0 24px; font-size: 15px; }
.qr-code { display: flex; justify-content: center; margin-bottom: 24px; }
.qr-placeholder { width: 200px; height: 200px; background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
.qr-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 2px; width: 100%; height: 100%; }
.qr-cell { background: #f0f0f0; border-radius: 1px; }
.qr-cell.filled { background: #333; }
.qr-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.pay-amount { margin-bottom: 16px; }
.pay-amount span { display: block; color: var(--text-muted); font-size: 14px; margin-bottom: 4px; }
.pay-amount em { font-style: normal; font-size: 32px; font-weight: 600; color: var(--text-title); }
.expire-tip { color: var(--text-muted); font-size: 13px; margin: 0 0 24px; }
.expire-tip span { color: #e74c3c; font-weight: 500; }
.btn-block { width: 100%; padding: 14px; font-size: 16px; }
.paying-section { text-align: center; padding: 40px 0; }
.paying-animation { margin-bottom: 24px; }
.spinner { width: 50px; height: 50px; border: 4px solid rgba(0,0,0,0.1); border-top-width: 4px; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.paying-section p { color: var(--text-body); margin: 0 0 8px; font-size: 16px; }
.sub-tip { color: var(--text-muted); font-size: 14px; }
.success-section { text-align: center; }
.success-icon { width: 70px; height: 70px; background: linear-gradient(135deg, #52c41a, #389e0d); color: white; font-size: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-weight: 700; }
.success-section h3 { font-size: 22px; color: var(--text-title); margin: 0 0 20px; }
.pay-info { color: var(--text-muted); font-size: 14px; margin: 0 0 8px; }
.pay-info:last-of-type { margin-bottom: 28px; }
.loading-state, .error-state { text-align: center; padding: 80px 20px; }
.error-state h3 { margin-bottom: 24px; }
@media (max-width: 600px) {
  .payment-methods { flex-direction: column; }
  .payment-footer { flex-direction: column; gap: 20px; text-align: center; }
  .pay-modal { width: 95vw; }
}
</style>
