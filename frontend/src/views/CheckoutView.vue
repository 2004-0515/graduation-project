<template>
  <div class="checkout-page" data-testid="checkout-view">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>确认订单</h1>
        </div>

        <div class="checkout-layout">
          <div class="checkout-main">
            <div class="section-card">
              <div class="section-header">
                <h3>收货地址</h3>
                <button class="link-btn" @click="$router.push('/address')">管理地址</button>
              </div>
              <div v-if="addresses.length > 0" class="address-list">
                <div
                  v-for="addr in addresses"
                  :key="addr.id"
                  :class="['address-item', { selected: selectedAddress === addr.id }]"
                  @click="selectedAddress = addr.id"
                >
                  <div class="addr-info">
                    <span class="name">{{ addr.name }}</span>
                    <span class="phone">{{ addr.phone }}</span>
                    <span v-if="addr.isDefault" class="default-tag">默认</span>
                  </div>
                  <p class="addr-detail">
                    {{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}
                  </p>
                </div>
              </div>
              <div v-else class="empty-tip">
                <p>暂未找到收货地址</p>
                <router-link to="/address">新增地址</router-link>
              </div>
            </div>

            <div class="section-card">
              <div class="section-header">
                <h3>商品清单</h3>
              </div>
              <div class="product-list">
                <div v-for="item in orderItems" :key="item.id" class="product-item">
                  <el-image :src="getImageUrl(item.mainImage)" fit="cover" class="item-image" />
                  <div class="item-info">
                    <h4>{{ item.name }}</h4>
                    <p>¥{{ formatMoney(item.price) }} x {{ item.quantity }}</p>
                  </div>
                  <div class="item-subtotal">
                    ¥{{ formatMoney(item.price * item.quantity) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="section-card">
              <div class="section-header">
                <h3>优惠券</h3>
                <span v-if="availableCoupons.length > 0" class="coupon-count">
                  可用 {{ availableCoupons.length }} 张
                </span>
              </div>
              <div class="coupon-selector">
                <div v-if="availableCoupons.length > 0" class="coupon-list">
                  <div
                    v-for="coupon in availableCoupons"
                    :key="coupon.id"
                    :class="['coupon-option', { selected: selectedCoupon === coupon.id }]"
                    @click="selectCoupon(coupon)"
                  >
                    <div class="coupon-badge" :class="getCouponTypeClass(coupon.type)">
                      <template v-if="coupon.type === 2">
                        {{ (Number(coupon.discountRate || 0) * 10).toFixed(0) }} 折
                      </template>
                      <template v-else>¥{{ formatMoney(coupon.discountAmount) }}</template>
                    </div>
                    <div class="coupon-info">
                      <span class="coupon-name">{{ coupon.name }}</span>
                      <span v-if="coupon.minAmount > 0" class="coupon-cond">
                        满 ¥{{ formatMoney(coupon.minAmount) }} 可用
                      </span>
                    </div>
                    <div class="coupon-discount">
                      -¥{{ formatMoney(coupon.discount || 0) }}
                    </div>
                    <div v-if="selectedCoupon === coupon.id" class="check-icon">已选</div>
                  </div>
                </div>
                <div v-else class="no-coupon">
                  <p>暂无可用优惠券</p>
                  <router-link to="/promotions">去看看活动</router-link>
                </div>
                <div v-if="selectedCoupon" class="clear-coupon" @click="clearCoupon">
                  不使用优惠券
                </div>
              </div>
            </div>

            <div class="section-card">
              <div class="section-header">
                <h3>订单备注</h3>
              </div>
              <el-input
                v-model="remark"
                type="textarea"
                :rows="2"
                placeholder="选填，可填写备注信息"
              />
            </div>
          </div>

          <div class="checkout-sidebar">
            <div class="summary-card">
              <h3>订单汇总</h3>
              <div class="summary-row">
                <span>商品金额</span>
                <span>¥{{ formatMoney(subtotal) }}</span>
              </div>
              <div class="summary-row">
                <span>运费</span>
                <span>¥{{ formatMoney(shipping) }}</span>
              </div>
              <div v-if="couponDiscount > 0" class="summary-row discount">
                <span>优惠券</span>
                <span>-¥{{ formatMoney(couponDiscount) }}</span>
              </div>
              <div class="summary-total">
                <span>实付金额</span>
                <em>¥{{ formatMoney(total) }}</em>
              </div>

              <div v-if="showBudgetWarning" class="budget-warning-tip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                  本次订单将超出本月预算
                  ¥{{ formatMoney(budgetOverAmount) }}
                </span>
              </div>

              <button
                class="submit-btn"
                data-testid="checkout-submit"
                :disabled="!selectedAddress || orderItems.length === 0 || submitting"
                @click="submitOrder"
              >
                {{ submitting ? '提交中...' : '提交订单' }}
              </button>

              <p v-if="!selectedAddress && addresses.length === 0" class="submit-tip warning">
                请先添加收货地址
              </p>
              <p v-else-if="!selectedAddress" class="submit-tip warning">
                请选择收货地址
              </p>
              <p v-else-if="orderItems.length === 0" class="submit-tip warning">
                当前没有可结算商品
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import addressApi from '../api/addressApi'
import couponApi from '../api/couponApi'
import fileApi from '../api/fileApi'
import orderApi from '../api/orderApi'
import productApi from '../api/productApi'
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
const budgetStatus = ref<any>({})

const subtotal = computed(() =>
  orderItems.value.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
)
const total = computed(() => Math.max(0, subtotal.value + shipping.value - couponDiscount.value))
const showBudgetWarning = computed(() => {
  if (!budgetStatus.value?.budget) return false
  return Number(budgetStatus.value.spent || 0) + total.value > Number(budgetStatus.value.budget)
})
const budgetOverAmount = computed(() => {
  if (!budgetStatus.value?.budget) return 0
  return Math.max(
    0,
    Number(budgetStatus.value.spent || 0) + total.value - Number(budgetStatus.value.budget)
  )
})

const formatMoney = (amount: number | string) => Number(amount || 0).toFixed(2)
const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const getCouponTypeClass = (type: number) =>
  ({ 1: 'type-reduce', 2: 'type-discount', 3: 'type-free' }[type] || 'type-reduce')

const fetchAddresses = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const res: any = await addressApi.getUserAddresses(userStore.userInfo.id)
    if (res?.code === 200) {
      addresses.value = res.data || []
      const defaultAddr = addresses.value.find((item) => item.isDefault)
      if (defaultAddr) selectedAddress.value = defaultAddr.id
      else if (addresses.value.length > 0) selectedAddress.value = addresses.value[0].id
    }
  } catch (error) {
    console.error('加载地址失败:', error)
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
    console.error('加载优惠券失败:', error)
  }
}

const fetchBudgetStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getBudgetStatus()
    if (res?.code === 200) {
      budgetStatus.value = res.data || {}
    }
  } catch (error) {
    console.error('加载预算状态失败:', error)
  }
}

const selectCoupon = (coupon: any) => {
  if (selectedCoupon.value === coupon.id) {
    clearCoupon()
    return
  }
  selectedCoupon.value = coupon.id
  couponDiscount.value = Number(coupon.discount || 0)
}

const clearCoupon = () => {
  selectedCoupon.value = null
  couponDiscount.value = 0
}

const restoreSavedOrderItems = () => {
  const savedItems = sessionStorage.getItem(CHECKOUT_ITEMS_KEY)
  if (!savedItems) return
  try {
    orderItems.value = JSON.parse(savedItems)
  } catch {
    orderItems.value = []
  }
}

const loadDirectPurchaseItem = async (productId: number, quantity: number) => {
  const res: any = await productApi.getProductById(productId)
  if (res?.code !== 200 || !res.data) throw new Error('商品不存在')

  const product = res.data
  if (product.status !== 1) throw new Error('该商品已下架')
  if (product.stock < quantity) throw new Error('商品库存不足')

  orderItems.value = [{ ...product, quantity }]
  sessionStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(orderItems.value))
}

const loadCartCheckoutItems = async () => {
  if (cartStore.items.length === 0) {
    await cartStore.fetchCart()
  }

  if (cartStore.items.length === 0) {
    restoreSavedOrderItems()
    return
  }

  const selectedItems = cartStore.items.filter(
    (item) => item.selected !== false && item.productStatus === 1
  )

  const validItems = selectedItems.filter((item) => {
    if (item.stock !== undefined && item.quantity > item.stock) {
      ElMessage.warning(`商品“${item.productName}”因库存不足，已从结算中移除`)
      return false
    }
    return true
  })

  if (validItems.length === 0) {
    restoreSavedOrderItems()
    return
  }

  orderItems.value = validItems.map((item) => ({
    id: item.productId,
    name: item.productName,
    mainImage: item.productImage,
    price: item.price,
    quantity: item.quantity,
    sellerId: item.sellerId,
    sellerName: item.sellerName
  }))
  sessionStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(orderItems.value))
}

const loadOrderItems = async () => {
  const productId = Number(route.query.productId)
  const quantity = Number(route.query.quantity) || 1

  try {
    if (productId) {
      await loadDirectPurchaseItem(productId, quantity)
    } else {
      await loadCartCheckoutItems()
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载结算商品失败')
    router.push('/cart')
    return
  }

  if (orderItems.value.length === 0) {
    ElMessage.warning('当前没有可结算商品')
  }
}

const submitOrder = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  const userId = userStore.userInfo?.id
  if (userId) {
    const ownProducts = orderItems.value.filter((item) => item.sellerId && item.sellerId === userId)
    if (ownProducts.length > 0) {
      ElMessage.error('不能购买自己发布的商品')
      setTimeout(() => router.push('/cart'), 1500)
      return
    }
  }

  if (showBudgetWarning.value) {
    try {
      await ElMessageBox.confirm(
        `本次订单将超出本月预算 ¥${formatMoney(budgetOverAmount.value)}，是否继续提交？`,
        '预算提醒',
        {
          confirmButtonText: '继续提交',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      )
    } catch {
      ElMessage.info('已取消提交订单')
      return
    }
  }

  submitting.value = true
  try {
    const orderData: any = {
      addressId: selectedAddress.value,
      paymentMethod: 1,
      remark: remark.value || null,
      items: orderItems.value.map((item) => ({
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
        const orderedProductIds = orderItems.value.map((item) => item.id)
        const cartItemsToDelete = cartStore.items
          .filter((item) => orderedProductIds.includes(item.productId))
          .map((item) => item.id)

        if (cartItemsToDelete.length > 0) {
          await cartStore.batchDelete(cartItemsToDelete)
        }
      }

      router.push(`/payment/${res.data.id}`)
    } else {
      ElMessage.error(res?.message || '订单创建失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '订单创建失败')
  } finally {
    submitting.value = false
  }
}

watch(subtotal, () => {
  clearCoupon()
  if (subtotal.value > 0) {
    fetchAvailableCoupons()
  }
})

onMounted(async () => {
  await Promise.all([fetchAddresses(), loadOrderItems(), fetchBudgetStatus()])
})
</script>

<style scoped>
.checkout-page { min-height: 100vh; background: var(--white); position: relative; }
.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 24px; }
.checkout-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
.section-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-bottom: 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--gray-200); }
.section-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
.link-btn { background: none; border: none; color: var(--primary); font-size: 14px; cursor: pointer; font-weight: 500; }
.coupon-count { font-size: 14px; color: var(--primary); font-weight: 500; }
.address-list, .product-list, .coupon-selector { padding: 16px; }
.address-item { padding: 20px; border: 2px solid var(--gray-200); border-radius: var(--radius-md); margin-bottom: 12px; cursor: pointer; transition: all 0.3s; }
.address-item:last-child, .product-item:last-child { margin-bottom: 0; border-bottom: none; }
.address-item:hover, .coupon-option:hover { border-color: var(--primary); }
.address-item.selected, .coupon-option.selected { border-color: var(--primary); background: rgba(155, 135, 245, 0.05); }
.addr-info { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.name { font-weight: 600; font-size: 16px; color: var(--text-title); }
.phone, .addr-detail, .item-info p { color: var(--text-body); font-size: 14px; }
.default-tag { padding: 4px 12px; background: var(--primary); color: #fff; font-size: 12px; border-radius: 12px; }
.empty-tip { padding: 40px; text-align: center; color: var(--text-muted); font-size: 15px; }
.empty-tip a { color: var(--sakura); font-weight: 500; }
.product-item { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.item-image { width: 72px; height: 72px; border-radius: var(--radius-md); flex-shrink: 0; }
.item-info { flex: 1; }
.item-info h4 { margin: 0 0 6px; font-size: 16px; font-weight: 600; color: var(--text-title); }
.item-subtotal, .coupon-discount { font-size: 16px; font-weight: 600; color: var(--primary); }
.coupon-list { display: flex; flex-direction: column; gap: 12px; }
.coupon-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 2px solid var(--gray-200); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; position: relative; }
.coupon-badge { padding: 8px 12px; border-radius: 6px; color: #fff; font-size: 14px; font-weight: 600; min-width: 60px; text-align: center; }
.coupon-badge.type-reduce { background: var(--primary); }
.coupon-badge.type-discount { background: #f5a623; }
.coupon-badge.type-free { background: #52c41a; }
.coupon-info { flex: 1; }
.coupon-name { display: block; font-size: 14px; font-weight: 500; color: var(--text-title); }
.coupon-cond { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.check-icon { width: 22px; height: 22px; background: var(--primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; }
.no-coupon { text-align: center; padding: 20px; color: var(--text-tertiary); }
.no-coupon a { color: var(--primary); font-weight: 500; margin-left: 8px; }
.clear-coupon { text-align: center; padding: 12px; color: var(--text-tertiary); font-size: 14px; cursor: pointer; margin-top: 8px; }
.clear-coupon:hover { color: var(--primary); }
.section-card :deep(.el-textarea__inner) { border-radius: var(--radius-md); background: var(--white); border: 1px solid var(--gray-300); }
.section-card :deep(.el-textarea__inner:focus) { border-color: var(--primary); }
.section-card > .el-input { padding: 16px; }
.summary-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 28px; position: sticky; top: 88px; }
.summary-card h3 { margin: 0 0 24px; font-size: 18px; font-weight: 600; color: var(--text-primary); }
.summary-row, .summary-total { display: flex; justify-content: space-between; padding: 12px 0; font-size: 15px; color: var(--text-secondary); }
.summary-total { align-items: center; margin-top: 12px; border-top: 1px solid var(--gray-200); }
.summary-total em { font-style: normal; font-size: 26px; font-weight: 600; color: var(--primary); }
.submit-btn { width: 100%; padding: 16px; margin-top: 20px; background: var(--primary); color: #fff; border: none; border-radius: var(--radius-xl); font-size: 16px; font-weight: 600; cursor: pointer; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.submit-tip { margin: 12px 0 0; padding: 10px 14px; border-radius: var(--radius-md); font-size: 13px; text-align: center; }
.submit-tip.warning { background: rgba(245, 166, 35, 0.1); color: #e67e22; border: 1px solid rgba(245, 166, 35, 0.3); }
.budget-warning-tip { display: flex; align-items: center; gap: 8px; padding: 12px 14px; margin-top: 16px; background: rgba(231, 76, 60, 0.08); border: 1px solid rgba(231, 76, 60, 0.3); border-radius: var(--radius-md); color: #e74c3c; font-size: 13px; }
@media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } .summary-card { position: static; } }
</style>
