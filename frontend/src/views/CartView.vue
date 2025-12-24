<template>
  <div class="cart-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 购物车内容 -->
    <section class="cart-content">
      <div class="container">
        <h2 class="section-title">我的购物车</h2>
        <el-card shadow="hover" v-if="cartStore.cartItems.length > 0">
          <div class="cart-table">
            <el-table :data="cartStore.cartItems" stripe style="width: 100%">
              <el-table-column prop="product.name" label="商品名称" width="300">
                <template #default="scope">
                  <div class="product-info">
                    <el-image :src="scope.row.product.mainImage" fit="cover" style="width: 80px; height: 80px; margin-right: 16px"></el-image>
                    <span>{{ scope.row.product.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="product.price" label="单价" width="150">
                <template #default="scope">
                  <span class="price">{{ scope.row.product.price }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="150">
                <template #default="scope">
                  <div class="quantity-control">
                    <el-input-number 
                      v-model="scope.row.quantity" 
                      :min="1" 
                      :max="scope.row.product.stock" 
                      @change="updateQuantity(scope.row)"
                    ></el-input-number>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="小计" width="150">
                <template #default="scope">
                  <span class="subtotal">{{ (scope.row.product.price * scope.row.quantity).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button type="danger" size="small" @click="removeFromCart(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="cart-footer">
            <div class="cart-summary">
              <div class="total">
                <span class="total-label">总计：</span>
                <span class="total-amount">{{ totalAmount.toFixed(2) }}</span>
              </div>
              <div class="action-buttons">
                <el-button type="warning" @click="clearCart">清空购物车</el-button>
                <el-button type="primary" size="large" @click="checkout">去结算</el-button>
              </div>
            </div>
          </div>
        </el-card>
        <div class="empty-cart" v-else>
          <el-empty description="购物车为空" :image-size="200">
            <el-button type="primary" @click="$router.push('/')">去购物</el-button>
          </el-empty>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell, ArrowDown, Delete } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import { logUtils } from '../utils/logUtils'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 从用户信息中获取用户ID
const userId = computed(() => {
  return userStore.userInfo?.id || null
})

// 获取购物车商品数量
const cartItemCount = computed(() => {
  return cartStore.totalItems
})

// 计算总金额
const totalAmount = computed(() => {
  return cartStore.totalAmount
})

// 获取购物车列表
const fetchCartItems = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  logUtils.cartLog('开始获取购物车列表', { 
    isLoggedIn: userStore.isLoggedIn, 
    userId: userId.value, 
    userInfo: userStore.userInfo 
  })
  
  try {
    await cartStore.fetchCartItems(userId.value)
  } catch (error) {
    logUtils.cartLog('获取购物车列表失败', error)
    console.error('获取购物车列表失败:', error)
    ElMessage.error('获取购物车列表失败')
  }
}

// 更新商品数量
const updateQuantity = async (item) => {
  try {
    await cartStore.updateCartQuantity(item.id, item.quantity)
  } catch (error) {
    console.error('更新商品数量失败:', error)
  }
}

// 从购物车中移除商品
const removeFromCart = async (cartItemId) => {
  try {
    await cartStore.removeFromCart(cartItemId)
  } catch (error) {
    console.error('删除商品失败:', error)
  }
}

// 清空购物车
const clearCart = () => {
  ElMessage.confirm('确定要清空购物车吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cartStore.clearCart(userId.value)
    } catch (error) {
      console.error('清空购物车失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 去结算
const checkout = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  ElMessage.info('跳转到结算页面')
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success('退出登录成功')
    // 退出登录后清空购物车
    cartStore.cartItems = []
    // 跳转到首页
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
    ElMessage.error('退出登录失败')
  }
}

// 页面加载时获取购物车列表
onMounted(() => {
  fetchCartItems()
})
</script>

<style scoped>
/* 全局样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  margin: 40px 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

/* 导航栏 */
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #409eff;
}

.nav-menu ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu li {
  margin: 0 15px;
}

.nav-menu a {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.3s;
  cursor: pointer;
}

.nav-menu a:hover {
  color: #409eff;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.nav-actions .el-button {
  margin: 0 10px;
}

.icon-nav {
  font-size: 20px;
  margin-left: 20px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.icon-nav:hover {
  color: #409eff;
}

.nav-badge {
  cursor: pointer;
}

/* 购物车内容 */
.cart-content {
  margin: 40px 0;
}

.cart-table {
  margin-bottom: 20px;
}

.product-info {
  display: flex;
  align-items: center;
}

.price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.subtotal {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.cart-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.cart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total {
  display: flex;
  align-items: center;
}

.total-label {
  font-size: 18px;
  font-weight: bold;
  margin-right: 10px;
}

.total-amount {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.empty-cart {
  text-align: center;
  padding: 60px 0;
}

/* 页脚 */
.footer {
  background-color: #333;
  color: #fff;
  padding: 40px 0;
  margin-top: 60px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 30px;
}

.footer-section h3 {
  margin: 0 0 20px;
  font-size: 18px;
}

.footer-section p {
  margin: 0 0 15px;
  color: #ccc;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-section li {
  margin-bottom: 10px;
}

.footer-section a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: #409eff;
}

.social-icons {
  display: flex;
  gap: 20px;
}

.icon-social {
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.icon-social:hover {
  color: #409eff;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #444;
  color: #999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-actions {
    justify-content: flex-end;
  }
  
  .cart-table .el-table {
    font-size: 14px;
  }
  
  .product-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-info .el-image {
    margin-bottom: 10px;
  }
  
  .cart-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>