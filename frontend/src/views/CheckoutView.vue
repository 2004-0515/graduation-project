<template>
  <div class="checkout-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>确认订单</h1>
        </div>

        <div class="checkout-layout">
          <div class="checkout-main">
            <!-- 收货地址 -->
            <div class="section-card">
              <div class="section-header">
                <h3>收货地址</h3>
                <button class="link-btn" @click="$router.push('/address')">管理地址</button>
              </div>
              <div class="address-list" v-if="addresses.length > 0">
                <div 
                  v-for="addr in addresses" 
                  :key="addr.id"
                  :class="['address-item', { selected: selectedAddress === addr.id }]"
                  @click="selectedAddress = addr.id"
                >
                  <div class="addr-info">
                    <span class="name">{{ addr.name }}</span>
                    <span class="phone">{{ addr.phone }}</span>
                    <span class="default-tag" v-if="addr.isDefault">默认</span>
                  </div>
                  <p class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
                </div>
              </div>
              <div v-else class="empty-tip">
                <p>暂无收货地址</p>
                <router-link to="/address">添加地址</router-link>
              </div>
            </div>

            <!-- 商品清单 -->
            <div class="section-card">
              <div class="section-header">
                <h3>商品清单</h3>
              </div>
              <div class="product-list">
                <div v-for="item in orderItems" :key="item.id" class="product-item">
                  <el-image :src="item.mainImage" fit="cover" class="item-image" />
                  <div class="item-info">
                    <h4>{{ item.name }}</h4>
                    <p>¥{{ item.price }} × {{ item.quantity }}</p>
                  </div>
                  <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- 备注 -->
            <div class="section-card">
              <div class="section-header">
                <h3>订单备注</h3>
              </div>
              <el-input v-model="remark" type="textarea" :rows="2" placeholder="选填，可填写您的特殊需求" />
            </div>
          </div>

          <!-- 结算栏 -->
          <div class="checkout-sidebar">
            <div class="summary-card">
              <h3>订单汇总</h3>
              <div class="summary-row">
                <span>商品金额</span>
                <span>¥{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="summary-row">
                <span>运费</span>
                <span>¥{{ shipping.toFixed(2) }}</span>
              </div>
              <div class="summary-total">
                <span>应付金额</span>
                <em>¥{{ total.toFixed(2) }}</em>
              </div>
              <button class="submit-btn" @click="submitOrder" :disabled="!selectedAddress || orderItems.length === 0">
                提交订单
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import addressApi from '../api/addressApi'
import orderApi from '../api/orderApi'
import productApi from '../api/productApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const addresses = ref<any[]>([])
const selectedAddress = ref<number | null>(null)
const orderItems = ref<any[]>([])
const remark = ref('')
const shipping = ref(0)

const subtotal = computed(() => orderItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const total = computed(() => subtotal.value + shipping.value)

const fetchAddresses = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const res: any = await addressApi.getUserAddresses(userStore.userInfo.id)
    if (res?.code === 200) {
      addresses.value = res.data || []
      const defaultAddr = addresses.value.find(a => a.isDefault)
      if (defaultAddr) selectedAddress.value = defaultAddr.id
      else if (addresses.value.length > 0) selectedAddress.value = addresses.value[0].id
    }
  } catch (error) {
    console.error('获取地址失败:', error)
  }
}

const loadOrderItems = async () => {
  const productId = route.query.productId
  const quantity = Number(route.query.quantity) || 1
  
  if (productId) {
    try {
      const res: any = await productApi.getProductById(Number(productId))
      if (res?.code === 200) {
        const product = res.data
        orderItems.value = [{ ...product, quantity }]
      }
    } catch (error) {
      console.error('获取商品失败:', error)
    }
  } else {
    // 从购物车获取选中的商品
    orderItems.value = cartStore.items
      .filter(item => item.selected !== false)
      .map(item => ({
        id: item.productId,
        name: item.productName,
        mainImage: item.productImage,
        price: item.price,
        quantity: item.quantity
      }))
  }
}

const submitOrder = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  try {
    const orderData = {
      addressId: selectedAddress.value,
      paymentMethod: 1, // 默认微信支付
      items: orderItems.value.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    }
    
    const res: any = await orderApi.createOrder(orderData)
    if (res?.code === 200) {
      ElMessage.success('订单创建成功')
      // 清空购物车中已下单的商品
      if (!route.query.productId) {
        cartStore.clearCart()
      }
      router.push('/orders')
    } else {
      ElMessage.error(res?.message || '创建订单失败')
    }
  } catch (error) {
    ElMessage.error('创建订单失败')
  }
}

onMounted(() => {
  fetchAddresses()
  loadOrderItems()
})
</script>

<style scoped>
.checkout-page { min-height: 100vh; background: var(--white); position: relative; }

.checkout-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite;
}

.checkout-page::after {
  content: '';
  position: fixed;
  bottom: 5%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite reverse;
}

@keyframes floatAnim {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 24px; }

.checkout-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }

.section-card { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  margin-bottom: 20px;
}
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.section-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-title); }
.link-btn { background: none; border: none; color: var(--sakura); font-size: 14px; cursor: pointer; font-weight: 500; }

.address-list { padding: 16px; }
.address-item { padding: 20px; border: 2px solid rgba(200, 220, 255, 0.4); border-radius: var(--radius-md); margin-bottom: 12px; cursor: pointer; transition: all 0.3s; }
.address-item:last-child { margin-bottom: 0; }
.address-item:hover { border-color: rgba(90, 143, 212, 0.6); }
.address-item.selected { border-color: var(--sakura); background: rgba(230, 242, 255, 0.3); }
.addr-info { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.name { font-weight: 600; font-size: 16px; color: var(--text-title); }
.phone { color: var(--text-body); font-size: 15px; }
.default-tag { padding: 4px 12px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; font-size: 12px; border-radius: 12px; }
.addr-detail { margin: 0; font-size: 15px; color: var(--text-body); }
.empty-tip { padding: 40px; text-align: center; color: var(--text-muted); font-size: 15px; }
.empty-tip a { color: var(--sakura); font-weight: 500; }

.product-list { padding: 16px; }
.product-item { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.product-item:last-child { border-bottom: none; }
.item-image { width: 72px; height: 72px; border-radius: var(--radius-md); flex-shrink: 0; }
.item-info { flex: 1; }
.item-info h4 { margin: 0 0 6px; font-size: 16px; font-weight: 600; color: var(--text-title); }
.item-info p { margin: 0; font-size: 14px; color: var(--text-muted); }
.item-subtotal { font-size: 17px; font-weight: 600; color: #5A8FD4; }

.section-card :deep(.el-textarea__inner) { border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(200, 220, 255, 0.4); }
.section-card :deep(.el-textarea__inner:focus) { border-color: var(--sakura); }
.section-card > .el-input { padding: 16px; }

.summary-card { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  padding: 28px;
  position: sticky;
  top: 88px;
}
.summary-card h3 { margin: 0 0 24px; font-size: 18px; font-weight: 600; color: var(--text-title); }
.summary-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 15px; color: var(--text-body); }
.summary-total { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; margin-top: 12px; border-top: 1px solid rgba(200, 220, 255, 0.3); font-size: 15px; color: var(--text-title); }
.summary-total em { font-style: normal; font-size: 26px; font-weight: 600; color: #5A8FD4; }
.submit-btn { width: 100%; padding: 16px; margin-top: 20px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; border: none; border-radius: var(--radius-xl); font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.submit-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(90, 143, 212, 0.5); transform: translateY(-2px); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .summary-card { position: static; }
}
</style>
