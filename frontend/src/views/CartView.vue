<template>
  <div class="cart-page" data-testid="cart-view">
    <div class="deco-layer">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />

    <main class="main">
      <div class="container">
        <div class="page-header">
          <h1 class="text-title">购物车</h1>
          <p>已选 {{ selectedCount }} 件商品</p>
        </div>

        <div class="cart-layout" v-if="cartItems.length > 0">
          <!-- 商家自购警告 -->
          <div v-if="ownProductsInCart.length > 0" class="own-product-warning glass-card">
            <div class="warning-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>购物车中有您自己的商品</span>
            </div>
            <p class="warning-desc">以下商品是您发布的，无法购买：</p>
            <ul class="own-product-list">
              <li v-for="item in ownProductsInCart" :key="item.id">
                <span class="product-name">{{ item.productName }}</span>
                <button class="remove-btn" @click="removeItem(item)">移除</button>
              </li>
            </ul>
          </div>

          <div class="cart-list glass-card" data-testid="cart-list">
            <div class="list-header">
              <label class="checkbox-wrap">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
                <span>全选</span>
              </label>
              <span>商品信息</span>
              <span>单价</span>
              <span>数量</span>
              <span>小计</span>
              <span>操作</span>
            </div>

            <div
              v-for="item in cartItems"
              :key="item.id"
              :class="['cart-item', {
              'item-unavailable': item.productStatus !== 1,
              'item-own-product': item.sellerId && userId && item.sellerId === userId
            }]"
              :data-testid="`cart-item-${item.id}`"
            >
              <label class="checkbox-wrap">
                <input 
                  type="checkbox" 
                  :checked="item.selected !== false && item.productStatus === 1 && !(item.sellerId && userId && item.sellerId === userId)" 
                  @change="item.selected = ($event.target as HTMLInputElement).checked" 
                  :disabled="item.productStatus !== 1 || (item.sellerId && userId && item.sellerId === userId)" 
                />
              </label>
              <div class="item-info">
                <img :src="getImageUrl(item.productImage)" class="item-img" @error="imgErr" />
                <div class="item-detail">
                  <h4 @click="$router.push(`/product/${item.productId}`)">{{ item.productName }}</h4>
                  <p>商品编号: {{ item.productId }}</p>
                  <p v-if="item.productStatus !== 1" class="item-warning">商品已下架</p>
                  <p v-else-if="item.sellerId && userId && item.sellerId === userId" class="item-warning own-warning">这是您自己的商品，无法购买</p>
                  <p v-else-if="item.stock !== undefined && item.stock < item.quantity" class="item-warning">库存不足（剩余{{ item.stock }}件）</p>
                </div>
              </div>
              <div class="item-price">¥{{ item.price }}</div>
              <div class="item-qty">
                <button :data-testid="`cart-item-decrease-${item.id}`" @click="updateQty(item, -1)" :disabled="item.quantity <= 1 || item.productStatus !== 1">-</button>
                <span :data-testid="`cart-item-quantity-${item.id}`">{{ item.quantity }}</span>
                <button :data-testid="`cart-item-increase-${item.id}`" @click="updateQty(item, 1)" :disabled="item.productStatus !== 1 || (item.stock !== undefined && item.quantity >= item.stock)">+</button>
              </div>
              <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              <button class="delete-btn" :data-testid="`cart-item-delete-${item.id}`" @click="removeItem(item)">删除</button>
            </div>
          </div>

          <div class="checkout-bar glass-card" data-testid="cart-checkout-bar">
            <button class="clear-btn" data-testid="cart-clear-selected" @click="clearSelected">清空已选</button>
            <div class="bar-right">
              <div class="total-info" data-testid="cart-summary">
                <span data-testid="cart-selected-count">共 {{ selectedCount }} 件</span>
                <span class="total">合计：<em data-testid="cart-total-price">¥{{ totalPrice.toFixed(2) }}</em></span>
                <span v-if="showBudgetWarning" class="budget-warning-tip">
                  购买后将超出本月预算
                </span>
              </div>
              <button class="btn btn-primary" data-testid="cart-go-checkout" @click="goCheckout" :disabled="selectedCount === 0">去结算</button>
            </div>
          </div>
        </div>

        <div v-else class="empty glass-card" data-testid="cart-empty">
          <p>购物车是空的</p>
          <router-link to="/category" class="btn btn-primary">去逛逛</router-link>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import fileApi from '../api/fileApi'
import rationalApi from '../api/rationalApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { debugError } from '../utils/debug'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 直接使用 cartStore.items，不再创建新对象
const cartItems = computed(() => cartStore.items)
const selectAll = ref(true)

// 当前用户ID
const userId = computed(() => userStore.userInfo?.id)

// 检测购物车中是否有自己的商品
const ownProductsInCart = computed(() => 
  cartItems.value.filter(item => 
    item.sellerId && userId.value && item.sellerId === userId.value
  )
)

// 预算状态
const budgetStatus = ref<any>({})
const showBudgetWarning = computed(() => {
  if (!budgetStatus.value.budget) return false
  const newTotal = (budgetStatus.value.spent || 0) + totalPrice.value
  return newTotal > budgetStatus.value.budget
})

// 只计算可用且选中的商品（排除自己的商品）
const selectedCount = computed(() => 
  cartItems.value.filter(i => 
    i.selected !== false && 
    i.productStatus === 1 &&
    !(i.sellerId && userId.value && i.sellerId === userId.value)
  ).length
)

const totalPrice = computed(() => 
  cartItems.value.filter(i => 
    i.selected !== false && 
    i.productStatus === 1 &&
    !(i.sellerId && userId.value && i.sellerId === userId.value)
  ).reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)
)

const checkoutEligibleItems = computed(() =>
  cartItems.value.filter(i =>
    i.selected !== false &&
    i.productStatus === 1 &&
    !(i.sellerId && userId.value && i.sellerId === userId.value) &&
    !(i.stock !== undefined && i.quantity > i.stock)
  )
)

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}
const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#f8f8fc" width="80" height="80"/><text fill="#ccc" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em">商品</text></svg>')
}
const toggleSelectAll = () => { 
  // 只选中可用且不是自己的商品
  cartStore.items.forEach(item => {
    if (item.productStatus === 1 && !(item.sellerId && userId.value && item.sellerId === userId.value)) {
      item.selected = selectAll.value
    }
  }) 
}

const updateQty = async (item: any, delta: number) => {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  try {
    await cartStore.updateCartItem(item.id, newQty)
  } catch (error) {
    debugError('更新购物车数量失败', error)
    ElMessage.error(getErrorMessage(error, '更新失败'))
  }
}

const removeItem = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这件商品吗？', '提示', { type: 'warning' })
    await cartStore.removeFromCart(item.id)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    debugError('删除购物车商品失败', error)
    ElMessage.error(getErrorMessage(error, '删除失败'))
  }
}

const clearSelected = async () => {
  const selected = cartItems.value.filter(i => i.selected)
  if (selected.length === 0) return
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selected.length} 件商品吗？`, '提示', { type: 'warning' })
    await cartStore.batchDelete(selected.map(item => item.id))
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    debugError('清空已选购物车商品失败', error)
    ElMessage.error(getErrorMessage(error, '清空失败'))
  }
}

const goCheckout = () => {
  const selectedItems = cartItems.value.filter(i => i.selected !== false)
  if (selectedItems.length === 0) { ElMessage.warning('请选择商品'); return }
  if (checkoutEligibleItems.value.length === 0) {
    ElMessage.warning('当前选中商品不可结算，请检查库存、上下架状态或移除自己的商品')
    return
  }
  if (checkoutEligibleItems.value.length < selectedItems.length) {
    ElMessage.warning('部分已选商品不可结算，系统将只结算有效商品')
  }
  // 如果超出预算，给出提示但不阻止
  if (showBudgetWarning.value) {
    ElMessage.warning('购买后将超出本月预算，请理性消费')
  }
  router.push('/checkout')
}

const fetchBudgetStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getBudgetStatus()
    if (res?.code === 200) {
      budgetStatus.value = res.data || {}
    } else {
      debugError('获取购物车预算状态失败', res?.message || '购物车预算状态返回异常')
    }
  } catch (e) {
    debugError('获取购物车预算状态失败', e)
  }
}

onMounted(async () => {
  if (userStore.isLoggedIn && userStore.userInfo?.id) {
    try {
      await cartStore.fetchCart(userStore.userInfo.id)
    } catch (error) {
      debugError('加载购物车失败', error)
    }
    fetchBudgetStatus()
  }
})
</script>

<style scoped>
.cart-page { min-height: 100vh; background: var(--white); position: relative; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 5%; right: -10%; background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent); opacity: 0.5; }
.s2 { width: 500px; height: 500px; bottom: 10%; left: -10%; background: radial-gradient(circle, rgba(155, 135, 245, 0.12), transparent); opacity: 0.5; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main { position: relative; z-index: 1; padding: 100px 0 140px; }

.page-header h1 { font-size: 2.25rem; font-weight: 600; margin: 0 0 8px; color: var(--text-primary); }
.page-header p { font-size: 16px; color: var(--text-secondary); margin: 0; }

.cart-list { overflow: hidden; margin-bottom: 24px; }

/* 商家自购警告框 */
.own-product-warning {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(245, 166, 35, 0.08), rgba(245, 166, 35, 0.12));
  border: 1px solid rgba(245, 166, 35, 0.3);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: #e67e22;
  font-weight: 600;
  font-size: 15px;
}

.warning-header svg {
  flex-shrink: 0;
  stroke: #e67e22;
}

.warning-desc {
  margin: 0 0 10px 28px;
  font-size: 13px;
  color: var(--text-secondary);
}

.own-product-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0 28px;
}

.own-product-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 13px;
}

.own-product-list .product-name {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

.own-product-list .remove-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #e67e22;
  border-radius: 4px;
  color: #e67e22;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.own-product-list .remove-btn:hover {
  background: #e67e22;
  color: white;
}


.list-header {
  display: grid;
  grid-template-columns: 50px 2fr 1fr 1fr 1fr 80px;
  gap: 16px;
  padding: 16px 24px;
  background: var(--gray-50);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-tertiary);
  align-items: center;
  border-bottom: 1px solid var(--gray-200);
}

.checkbox-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-wrap input { width: 16px; height: 16px; accent-color: var(--primary); }

.cart-item {
  display: grid;
  grid-template-columns: 50px 2fr 1fr 1fr 1fr 80px;
  gap: 16px;
  padding: 20px 24px;
  align-items: center;
  border-bottom: 1px solid var(--gray-200);
}

.item-info { display: flex; gap: 16px; }
.item-img { width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; }
.item-detail h4 { margin: 0 0 8px; font-size: 16px; font-weight: 600; color: var(--text-primary); cursor: pointer; }
.item-detail h4:hover { color: var(--primary); }
.item-detail p { margin: 0; font-size: 14px; color: var(--text-tertiary); }

/* 不可用商品样式 */
.cart-item.item-unavailable { background: rgba(200, 200, 200, 0.1); opacity: 0.7; }
.cart-item.item-unavailable .item-img { filter: grayscale(50%); }

/* 自己的商品样式 */
.cart-item.item-own-product { background: rgba(245, 166, 35, 0.08); opacity: 0.85; }
.cart-item.item-own-product .item-img { filter: grayscale(30%); opacity: 0.8; }

.item-warning { color: #e74c3c; font-size: 13px; margin-top: 4px; }
.item-warning.own-warning { color: #e67e22; font-weight: 500; }.item-price, .item-subtotal { font-size: 16px; color: var(--text-secondary); }
.item-subtotal { font-weight: 600; color: var(--primary); }

.item-qty { display: flex; align-items: center; gap: 8px; }
.item-qty button { width: 28px; height: 28px; border: 1px solid var(--gray-300); background: var(--white); border-radius: var(--radius-sm); cursor: pointer; }
.item-qty button:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.item-qty button:disabled { opacity: 0.5; }

.delete-btn { padding: 6px 12px; background: none; border: 1px solid var(--gray-300); border-radius: var(--radius-sm); font-size: 14px; color: var(--text-tertiary); cursor: pointer; }
.delete-btn:hover { border-color: #e74c3c; color: #e74c3c; }

.checkout-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: 1216px;
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
}

.clear-btn { padding: 8px 16px; background: none; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 15px; color: var(--text-tertiary); cursor: pointer; }
.bar-right { display: flex; align-items: center; gap: 24px; }
.total-info { text-align: right; }
.total-info span { display: block; font-size: 15px; color: var(--text-tertiary); }
.total { margin-top: 4px; }
.total em { font-style: normal; font-size: 26px; font-weight: 600; color: var(--primary); }

.budget-warning-tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #e67e22;
  background: rgba(245, 166, 35, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
}

.empty { text-align: center; padding: 80px; }
.empty p { margin: 0 0 24px; font-size: 16px; color: var(--text-tertiary); }

@media (max-width: 768px) {
  .list-header { display: none; }
  .cart-item { grid-template-columns: 40px 1fr; }
  .item-price, .item-qty, .item-subtotal, .delete-btn { grid-column: 2; }
  .checkout-bar { flex-direction: column; gap: 16px; }
}
</style>
