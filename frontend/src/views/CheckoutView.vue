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
                  <el-image :src="getImageUrl(item.mainImage)" fit="cover" class="item-image" />
                  <div class="item-info">
                    <h4>{{ item.name }}</h4>
                    <p>¥{{ item.price }} × {{ item.quantity }}</p>
                  </div>
                  <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- 优惠券 -->
            <div class="section-card">
              <div class="section-header">
                <h3>优惠券</h3>
                <span class="coupon-count" v-if="availableCoupons.length > 0">{{ availableCoupons.length }}张可用</span>
              </div>
              <div class="coupon-selector">
                <div v-if="availableCoupons.length > 0" class="coupon-list">
                  <div 
                    v-for="c in availableCoupons" 
                    :key="c.id"
                    :class="['coupon-option', { selected: selectedCoupon === c.id }]"
                    @click="selectCoupon(c)"
                  >
                    <div class="coupon-badge" :class="getCouponTypeClass(c.type)">
                      <template v-if="c.type === 2">{{ (c.discountRate * 10).toFixed(0) }}折</template>
                      <template v-else>¥{{ c.discountAmount }}</template>
                    </div>
                    <div class="coupon-info">
                      <span class="coupon-name">{{ c.name }}</span>
                      <span class="coupon-cond" v-if="c.minAmount > 0">满{{ c.minAmount }}可用</span>
                    </div>
                    <div class="coupon-discount">-¥{{ c.discount?.toFixed(2) }}</div>
                    <div class="check-icon" v-if="selectedCoupon === c.id">✓</div>
                  </div>
                </div>
                <div v-else class="no-coupon">
                  <p>暂无可用优惠券</p>
                  <router-link to="/promotions">去领券</router-link>
                </div>
                <div v-if="selectedCoupon" class="clear-coupon" @click="clearCoupon">不使用优惠券</div>
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
              <div class="summary-row discount" v-if="couponDiscount > 0">
                <span>优惠券</span>
                <span>-¥{{ couponDiscount.toFixed(2) }}</span>
              </div>
              <div class="summary-total">
                <span>应付金额</span>
                <em>¥{{ total.toFixed(2) }}</em>
              </div>
              
              <!-- 预算警告 -->
              <div v-if="showBudgetWarning" class="budget-warning-tip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>此订单将超出本月预算 ¥{{ budgetOverAmount.toFixed(2) }}</span>
              </div>
              
              <button class="submit-btn" @click="submitOrder" :disabled="!selectedAddress || orderItems.length === 0 || submitting">
                {{ submitting ? '提交中...' : '提交订单' }}
              </button>
              <p v-if="!selectedAddress && addresses.length === 0" class="submit-tip warning">
                请先添加收货地址
              </p>
              <p v-else-if="!selectedAddress" class="submit-tip warning">
                请选择收货地址
              </p>
              <p v-else-if="orderItems.length === 0" class="submit-tip warning">
                没有待结算的商品
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import addressApi from '../api/addressApi'
import orderApi from '../api/orderApi'
import productApi from '../api/productApi'
import couponApi from '../api/couponApi'
import fileApi from '../api/fileApi'
import rationalApi from '../api/rationalApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const CHECKOUT_ITEMS_KEY = 'checkout_order_items'

const addresses = ref<any[]>([])
const selectedAddress = ref<number | null>(null)
const orderItems = ref<any[]>([])
const remark = ref('')
const shipping = ref(0)
const submitting = ref(false)

const availableCoupons = ref<any[]>([])
const selectedCoupon = ref<number | null>(null)
const couponDiscount = ref(0)

// 理性消费检测
const budgetStatus = ref<any>({})
const showBudgetWarning = computed(() => {
  if (!budgetStatus.value.budget) return false
  const newSpent = (budgetStatus.value.spent || 0) + total.value
  return newSpent > budgetStatus.value.budget
})
const budgetOverAmount = computed(() => {
  if (!budgetStatus.value.budget) return 0
  const newSpent = (budgetStatus.value.spent || 0) + total.value
  return Math.max(0, newSpent - budgetStatus.value.budget)
})

const subtotal = computed(() => orderItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const total = computed(() => Math.max(0, subtotal.value + shipping.value - couponDiscount.value))

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const getCouponTypeClass = (type: number) => {
  const classes: Record<number, string> = { 1: 'type-reduce', 2: 'type-discount', 3: 'type-free' }
  return classes[type] || 'type-reduce'
}

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

const fetchAvailableCoupons = async () => {
  if (!userStore.isLoggedIn || subtotal.value <= 0) return
  try {
    const res: any = await couponApi.getAvailableForOrder(subtotal.value)
    if (res?.code === 200) {
      availableCoupons.value = res.data || []
    }
  } catch (error) {
    console.error('获取优惠券失败:', error)
  }
}

const selectCoupon = (coupon: any) => {
  if (selectedCoupon.value === coupon.id) {
    clearCoupon()
  } else {
    selectedCoupon.value = coupon.id
    couponDiscount.value = coupon.discount || 0
  }
}

const clearCoupon = () => {
  selectedCoupon.value = null
  couponDiscount.value = 0
}

// 获取预算状态
const fetchBudgetStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getBudgetStatus()
    if (res?.code === 200) {
      budgetStatus.value = res.data || {}
    }
  } catch (error) {
    console.error('获取预算状态失败:', error)
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
        // 检查商品是否可购买
        if (product.status !== 1) {
          ElMessage.error('该商品已下架，无法购买')
          router.push('/cart')
          return
        }
        if (product.stock < quantity) {
          ElMessage.error('商品库存不足')
          router.push('/cart')
          return
        }
        orderItems.value = [{ ...product, quantity }]
        sessionStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(orderItems.value))
      }
    } catch (error) {
      console.error('获取商品失败:', error)
    }
  } else {
    // 先尝试从 cartStore 获取
    if (cartStore.items.length === 0) {
      // 如果购物车为空，尝试重新获取
      await cartStore.fetchCart()
    }
    
    if (cartStore.items.length > 0) {
      // 获取选中且可用的商品（selected 不为 false 且商品状态为上架）
      const selectedItems = cartStore.items.filter(item => item.selected !== false && item.productStatus === 1)
      
      // 检查库存
      const validItems = selectedItems.filter(item => {
        if (item.stock !== undefined && item.quantity > item.stock) {
          ElMessage.warning(`商品"${item.productName}"库存不足，已从结算列表移除`)
          return false
        }
        return true
      })
      
      if (validItems.length > 0) {
        orderItems.value = validItems.map(item => ({
          id: item.productId,
          name: item.productName,
          mainImage: item.productImage,
          price: item.price,
          quantity: item.quantity
        }))
        sessionStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(orderItems.value))
      } else {
        // 没有选中的商品，尝试从 sessionStorage 恢复
        const savedItems = sessionStorage.getItem(CHECKOUT_ITEMS_KEY)
        if (savedItems) {
          try {
            orderItems.value = JSON.parse(savedItems)
          } catch (e) {
            console.error('解析订单数据失败:', e)
            orderItems.value = []
          }
        }
      }
    } else {
      // 从 sessionStorage 恢复
      const savedItems = sessionStorage.getItem(CHECKOUT_ITEMS_KEY)
      if (savedItems) {
        try {
          orderItems.value = JSON.parse(savedItems)
        } catch (e) {
          console.error('解析订单数据失败:', e)
          orderItems.value = []
        }
      }
    }
  }
  
  if (orderItems.value.length === 0) {
    ElMessage.warning('没有待结算的商品，请先添加商品')
  }
}

const submitOrder = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  // 冲动消费拦截 - 超出预算警告
  if (showBudgetWarning.value) {
    try {
      await ElMessageBox.confirm(
        `此订单将使您本月消费超出预算 ¥${budgetOverAmount.value.toFixed(2)}，确定要继续吗？\n\n理性消费提示：建议您先查看消费报告，评估是否真的需要这些商品。`,
        '理性消费提醒',
        {
          confirmButtonText: '我已知晓风险，继续购买',
          cancelButtonText: '再想想',
          type: 'warning',
          customClass: 'budget-warning-dialog',
          distinguishCancelAndClose: true
        }
      )
    } catch {
      // 用户选择再想想
      ElMessage.info('理性消费，从我做起')
      return
    }
  }
  
  submitting.value = true
  try {
    const orderData: any = {
      addressId: selectedAddress.value,
      paymentMethod: 1,
      remark: remark.value || null,
      items: orderItems.value.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    }
    
    if (selectedCoupon.value) {
      orderData.userCouponId = selectedCoupon.value
    }
    
    const res: any = await orderApi.createOrder(orderData)
    if (res?.code === 200) {
      ElMessage.success('订单创建成功')
      sessionStorage.removeItem(CHECKOUT_ITEMS_KEY)
      if (!route.query.productId) {
        // 只删除已下单的商品，而不是清空整个购物车
        // 获取已下单商品对应的购物车项ID
        const orderedProductIds = orderItems.value.map(item => item.id)
        const cartItemsToDelete = cartStore.items
          .filter(item => orderedProductIds.includes(item.productId))
          .map(item => item.id)
        if (cartItemsToDelete.length > 0) {
          await cartStore.batchDelete(cartItemsToDelete)
        }
      }
      // 跳转到支付页面
      router.push(`/payment/${res.data.id}`)
    } else {
      ElMessage.error(res?.message || '创建订单失败')
    }
  } catch (error) {
    ElMessage.error('创建订单失败')
  } finally {
    submitting.value = false
  }
}

// 监听商品金额变化，重新获取可用优惠券
watch(subtotal, () => {
  if (subtotal.value > 0) {
    fetchAvailableCoupons()
  }
})

onMounted(() => {
  fetchAddresses()
  loadOrderItems()
  fetchBudgetStatus()
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
.coupon-count { font-size: 14px; color: var(--sakura); font-weight: 500; }

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

/* 优惠券选择器 */
.coupon-selector { padding: 16px; }
.coupon-list { display: flex; flex-direction: column; gap: 12px; }
.coupon-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 2px solid rgba(200, 220, 255, 0.4); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; position: relative; }
.coupon-option:hover { border-color: rgba(90, 143, 212, 0.6); }
.coupon-option.selected { border-color: var(--sakura); background: rgba(230, 242, 255, 0.3); }

.coupon-badge { padding: 8px 12px; border-radius: 6px; color: #fff; font-size: 14px; font-weight: 600; min-width: 60px; text-align: center; }
.coupon-badge.type-reduce { background: linear-gradient(135deg, #5A8FD4, #7BA8E8); }
.coupon-badge.type-discount { background: linear-gradient(135deg, #f5a623, #f7b84b); }
.coupon-badge.type-free { background: linear-gradient(135deg, #52c41a, #73d13d); }

.coupon-info { flex: 1; }
.coupon-name { display: block; font-size: 14px; font-weight: 500; color: var(--text-title); }
.coupon-cond { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.coupon-discount { font-size: 16px; font-weight: 600; color: #e74c3c; }
.check-icon { width: 22px; height: 22px; background: var(--sakura); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }

.no-coupon { text-align: center; padding: 20px; color: var(--text-muted); }
.no-coupon a { color: var(--sakura); font-weight: 500; margin-left: 8px; }
.clear-coupon { text-align: center; padding: 12px; color: var(--text-muted); font-size: 14px; cursor: pointer; margin-top: 8px; }
.clear-coupon:hover { color: var(--sakura); }

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
.summary-row.discount { color: #e74c3c; }
.summary-total { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; margin-top: 12px; border-top: 1px solid rgba(200, 220, 255, 0.3); font-size: 15px; color: var(--text-title); }
.summary-total em { font-style: normal; font-size: 26px; font-weight: 600; color: #5A8FD4; }
.submit-btn { width: 100%; padding: 16px; margin-top: 20px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; border: none; border-radius: var(--radius-xl); font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.submit-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(90, 143, 212, 0.5); transform: translateY(-2px); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.submit-tip {
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  text-align: center;
}

.submit-tip.warning {
  background: rgba(245, 166, 35, 0.1);
  color: #e67e22;
  border: 1px solid rgba(245, 166, 35, 0.3);
}

/* 预算警告 */
.budget-warning-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  margin-top: 16px;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: var(--radius-md);
  color: #e74c3c;
  font-size: 13px;
}

.budget-warning-tip svg {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .summary-card { position: static; }
}
</style>
