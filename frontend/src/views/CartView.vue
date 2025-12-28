<template>
  <div class="cart-page">
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
          <div class="cart-list glass-card">
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

            <div v-for="item in cartItems" :key="item.id" class="cart-item">
              <label class="checkbox-wrap">
                <input type="checkbox" v-model="item.selected" />
              </label>
              <div class="item-info">
                <img :src="getImageUrl(item.productImage)" class="item-img" @error="imgErr" />
                <div class="item-detail">
                  <h4 @click="$router.push(`/product/${item.productId}`)">{{ item.productName }}</h4>
                  <p>商品编号: {{ item.productId }}</p>
                </div>
              </div>
              <div class="item-price">¥{{ item.price }}</div>
              <div class="item-qty">
                <button @click="updateQty(item, -1)" :disabled="item.quantity <= 1">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQty(item, 1)">+</button>
              </div>
              <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              <button class="delete-btn" @click="removeItem(item)">删除</button>
            </div>
          </div>

          <div class="checkout-bar glass-card">
            <button class="clear-btn" @click="clearSelected">清空已选</button>
            <div class="bar-right">
              <div class="total-info">
                <span>共 {{ selectedCount }} 件</span>
                <span class="total">合计：<em>¥{{ totalPrice.toFixed(2) }}</em></span>
              </div>
              <button class="btn btn-primary" @click="goCheckout" :disabled="selectedCount === 0">去结算</button>
            </div>
          </div>
        </div>

        <div v-else class="empty glass-card">
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
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const cartItems = computed(() => cartStore.items.map(item => ({ ...item, selected: item.selected ?? true })))
const selectAll = ref(true)

const selectedCount = computed(() => cartItems.value.filter(i => i.selected).length)
const totalPrice = computed(() => cartItems.value.filter(i => i.selected).reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0))

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#f8f8fc" width="80" height="80"/><text fill="#ccc" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em">商品</text></svg>')
}
const toggleSelectAll = () => { cartStore.items.forEach(item => item.selected = selectAll.value) }

const updateQty = async (item: any, delta: number) => {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  try { await cartStore.updateCartItem(item.id, newQty) } catch { ElMessage.error('更新失败') }
}

const removeItem = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这件商品吗？', '提示', { type: 'warning' })
    await cartStore.removeFromCart(item.id)
    ElMessage.success('已删除')
  } catch {}
}

const clearSelected = async () => {
  const selected = cartItems.value.filter(i => i.selected)
  if (selected.length === 0) return
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selected.length} 件商品吗？`, '提示', { type: 'warning' })
    for (const item of selected) await cartStore.removeFromCart(item.id)
    ElMessage.success('已清空')
  } catch {}
}

const goCheckout = () => {
  if (selectedCount.value === 0) { ElMessage.warning('请选择商品'); return }
  router.push('/checkout')
}

onMounted(async () => {
  if (userStore.isLoggedIn && userStore.userInfo?.id) await cartStore.fetchCart(userStore.userInfo.id)
})
</script>

<style scoped>
.cart-page { min-height: 100vh; background: var(--white); position: relative; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 5%; right: -10%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 10%; left: -10%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main { position: relative; z-index: 1; padding: 100px 0 140px; }

.page-header h1 { font-size: 2.25rem; font-weight: 600; margin: 0 0 8px; }
.page-header p { font-size: 16px; color: var(--text-body); margin: 0; }

.cart-list { overflow: hidden; margin-bottom: 24px; }

.list-header {
  display: grid;
  grid-template-columns: 50px 2fr 1fr 1fr 1fr 80px;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255,255,255,0.5);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-muted);
  align-items: center;
  border-bottom: 1px solid rgba(200,200,220,0.2);
}

.checkbox-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-wrap input { width: 16px; height: 16px; accent-color: var(--sakura); }

.cart-item {
  display: grid;
  grid-template-columns: 50px 2fr 1fr 1fr 1fr 80px;
  gap: 16px;
  padding: 20px 24px;
  align-items: center;
  border-bottom: 1px solid rgba(200,200,220,0.15);
}

.item-info { display: flex; gap: 16px; }
.item-img { width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; }
.item-detail h4 { margin: 0 0 8px; font-size: 16px; font-weight: 600; color: var(--text-title); cursor: pointer; }
.item-detail h4:hover { color: var(--sakura); }
.item-detail p { margin: 0; font-size: 14px; color: var(--text-muted); }

.item-price, .item-subtotal { font-size: 16px; color: var(--text-body); }
.item-subtotal { font-weight: 600; color: #5A8FD4; }

.item-qty { display: flex; align-items: center; gap: 8px; }
.item-qty button { width: 28px; height: 28px; border: 1px solid rgba(200,200,220,0.3); background: rgba(255,255,255,0.6); border-radius: var(--radius-sm); cursor: pointer; }
.item-qty button:hover:not(:disabled) { border-color: var(--sakura); color: var(--sakura); }
.item-qty button:disabled { opacity: 0.5; }

.delete-btn { padding: 6px 12px; background: none; border: 1px solid rgba(200,200,220,0.3); border-radius: var(--radius-sm); font-size: 14px; color: var(--text-muted); cursor: pointer; }
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

.clear-btn { padding: 8px 16px; background: none; border: 1px solid rgba(200,200,220,0.3); border-radius: var(--radius-md); font-size: 15px; color: var(--text-muted); cursor: pointer; }
.bar-right { display: flex; align-items: center; gap: 24px; }
.total-info { text-align: right; }
.total-info span { display: block; font-size: 15px; color: var(--text-muted); }
.total { margin-top: 4px; }
.total em { font-style: normal; font-size: 26px; font-weight: 600; color: #5A8FD4; }

.empty { text-align: center; padding: 80px; }
.empty p { margin: 0 0 24px; font-size: 16px; color: var(--text-muted); }

@media (max-width: 768px) {
  .list-header { display: none; }
  .cart-item { grid-template-columns: 40px 1fr; }
  .item-price, .item-qty, .item-subtotal, .delete-btn { grid-column: 2; }
  .checkout-bar { flex-direction: column; gap: 16px; }
}
</style>
