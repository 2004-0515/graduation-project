<template>
  <div class="promotion-detail-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 促销活动详情内容 -->
    <main class="promotion-detail-content">
      <div class="container">
        <!-- 返回按钮 -->
        <div class="back-button">
          <el-button @click="$router.back()" type="primary" plain>
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>

        <!-- 促销活动详情 -->
        <div class="promotion-detail">
          <!-- 活动 banner -->
          <div class="promotion-banner">
            <el-image 
              :src="promotion.bannerImage" 
              fit="cover" 
              class="banner-image"
            ></el-image>
            <el-tag :type="promotion.tagType" size="large" class="promotion-tag">{{ promotion.tag }}</el-tag>
          </div>

          <!-- 活动基本信息 -->
          <div class="promotion-info">
            <h1>{{ promotion.title }}</h1>
            <div class="promotion-meta">
              <div class="promotion-status">
                <el-badge :value="promotion.status" :type="promotion.status === '进行中' ? 'success' : 'warning'">
                  {{ promotion.status }}
                </el-badge>
              </div>
              <div class="promotion-time">
                <el-icon class="time-icon"><Timer /></el-icon>
                <span>{{ promotion.startTime }} - {{ promotion.endTime }}</span>
              </div>
            </div>
            <div class="promotion-description">
              <h2>活动描述</h2>
              <p>{{ promotion.description }}</p>
            </div>
            <div class="promotion-rules">
              <h2>活动规则</h2>
              <ul>
                <li v-for="(rule, index) in promotion.rules" :key="index">{{ rule }}</li>
              </ul>
            </div>
          </div>

          <!-- 活动商品列表 -->
          <div class="promotion-products">
            <h2>活动商品</h2>
            <div class="product-grid">
              <div class="product-item" v-for="product in promotion.relatedProducts" :key="product.id">
                <el-card shadow="hover">
                  <template #header>
                    <div class="product-header">
                      <el-tag type="success" v-if="product.discount">{{ product.discount }}折</el-tag>
                    </div>
                  </template>
                  <el-image 
                    :src="product.mainImage" 
                    fit="cover" 
                    :preview-src-list="[product.mainImage]" 
                    @click="$router.push(`/product/${product.id}`)" 
                    preview-teleported
                    class="product-image"
                  ></el-image>
                  <div class="product-info">
                    <h3 @click="$router.push(`/product/${product.id}`)">{{ product.name }}</h3>
                    <div class="product-price">
                      <span class="price">{{ product.price }}</span>
                      <span class="original-price" v-if="product.originalPrice">{{ product.originalPrice }}</span>
                    </div>
                    <div class="product-stats">
                      <el-rate v-model="product.rating" disabled show-score :max="5"></el-rate>
                      <span class="sales">销量: {{ product.sales }}</span>
                    </div>
                    <div class="product-actions">
                      <el-button type="primary" size="small" @click="addToCart(product)">加入购物车</el-button>
                      <el-button type="success" size="small" @click="buyNow(product)">立即购买</el-button>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell, ArrowLeft, Timer } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 从用户信息中获取用户ID
const userId = computed(() => {
  return userStore.userInfo?.id || null
})

// 获取路由参数中的活动ID
const promotionId = computed(() => {
  return parseInt(route.params.id)
})

// 促销活动数据
const promotion = reactive({
  id: 0,
  title: '',
  tag: '',
  tagType: 'primary',
  status: '进行中',
  startTime: '',
  endTime: '',
  bannerImage: '',
  description: '',
  rules: [],
  relatedProducts: []
})

// 获取促销活动详情
const fetchPromotionDetail = () => {
  // 实际项目中这里应该调用API获取数据
  // 由于后端暂时没有促销活动相关的API，这里使用默认数据
  ElMessage.info('促销活动功能正在开发中')
  
  // 使用默认促销活动数据
  const defaultPromotion = {
    id: promotionId.value,
    title: '默认促销活动',
    tag: '促销',
    tagType: 'primary',
    status: '进行中',
    startTime: '2025-01-01',
    endTime: '2025-12-31',
    bannerImage: 'https://picsum.photos/800/300?random=31',
    description: '这是一个默认的促销活动详情页面。',
    rules: [
      '全场商品8折起',
      '满1000减200',
      '活动最终解释权归本商城所有'
    ],
    relatedProducts: []
  }
  
  Object.assign(promotion, defaultPromotion)
}

// 加入购物车
const addToCart = async (product) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await cartStore.addToCart(userId.value, product.id, 1)
    ElMessage.success(`已将 ${product.name} 加入购物车`)
  } catch (error) {
    console.error('加入购物车失败:', error)
    ElMessage.error('加入购物车失败，请重试')
  }
}

// 立即购买
const buyNow = (product) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  // 跳转到结算页面，带上商品信息
  router.push(`/checkout?productId=${product.id}&quantity=1`)
}

// 页面加载时获取促销活动详情
onMounted(() => {
  fetchPromotionDetail()
})
</script>

<style scoped>
/* 全局样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}



/* 促销活动详情内容 */
.promotion-detail-content {
  margin: 40px 0;
}

/* 返回按钮 */
.back-button {
  margin-bottom: 20px;
}

/* 促销活动详情 */
.promotion-detail {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

/* 活动 banner */
.promotion-banner {
  position: relative;
  margin-bottom: 30px;
}

.banner-image {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  transition: transform 0.3s;
}

.banner-image:hover {
  transform: scale(1.01);
}

.promotion-tag {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

/* 活动基本信息 */
.promotion-info {
  margin-bottom: 40px;
}

.promotion-info h1 {
  margin: 0 0 20px;
  font-size: 32px;
  color: #333;
}

.promotion-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.promotion-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.time-icon {
  color: #409eff;
}

.promotion-description,
.promotion-rules {
  margin-bottom: 30px;
  color: #666;
  line-height: 1.8;
}

.promotion-description h2,
.promotion-rules h2 {
  margin: 0 0 15px;
  font-size: 20px;
  color: #333;
}

.promotion-rules ul {
  padding-left: 20px;
  margin: 0;
}

.promotion-rules li {
  margin-bottom: 10px;
}

/* 活动商品列表 */
.promotion-products {
  margin-top: 40px;
}

.promotion-products h2 {
  margin: 0 0 20px;
  font-size: 24px;
  color: #333;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-item {
  transition: transform 0.3s;
}

.product-item:hover {
  transform: translateY(-5px);
}

.product-header {
  display: flex;
  justify-content: flex-end;
}

.product-image {
  width: 100%;
  height: 250px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s;
}

.product-image:hover {
  transform: scale(1.02);
}

.product-info {
  padding: 15px 0;
}

.product-info h3 {
  margin: 0 0 10px;
  font-size: 16px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
  transition: color 0.3s;
}

.product-info h3:hover {
  color: #409eff;
}

.product-price {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
  margin-right: 10px;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-stats {
  margin-bottom: 15px;
}

.product-stats .el-rate {
  margin-bottom: 8px;
}

.sales {
  font-size: 14px;
  color: #666;
}

.product-actions {
  display: flex;
  gap: 10px;
}

.product-actions .el-button {
  flex: 1;
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
  
  .promotion-meta {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .banner-image {
    height: 250px;
  }
  
  .product-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>