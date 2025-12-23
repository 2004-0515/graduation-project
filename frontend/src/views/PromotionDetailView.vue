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
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>关于我们</h3>
            <p>我们是一家专业的在线购物商城，提供优质的商品和服务。</p>
          </div>
          <div class="footer-section">
            <h3>客户服务</h3>
            <ul>
              <li><a href="#" @click="$router.push('/')">联系我们</a></li>
              <li><a href="#" @click="$router.push('/')">售后服务</a></li>
              <li><a href="#" @click="$router.push('/')">常见问题</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>支付方式</h3>
            <ul>
              <li>微信支付</li>
              <li>支付宝</li>
              <li>银行卡支付</li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>关注我们</h3>
            <div class="social-icons">
              <el-icon class="icon-social"><ShoppingCart /></el-icon>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2025 购物商城. All rights reserved.</p>
        </div>
      </div>
    </footer>
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

// 模拟促销活动数据
const mockPromotions = [
  {
    id: 1,
    title: '双11全球狂欢节',
    description: '全场商品低至5折，满1000减200，上不封顶。活动期间，每天10点、14点、20点准时发放大额优惠券，数量有限，先到先得。',
    tag: '双11',
    tagType: 'danger',
    startTime: '2025-11-01',
    endTime: '2025-11-11',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=31',
    rules: [
      '全场商品低至5折',
      '满1000减200，上不封顶',
      '每天10点、14点、20点发放优惠券',
      '优惠券可与折扣叠加使用',
      '活动最终解释权归本商城所有'
    ],
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11', discount: 9, sales: 1234, rating: 4.8 },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12', discount: 8.7, sales: 2345, rating: 4.9 },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13', discount: 9.2, sales: 3456, rating: 4.7 }
    ]
  },
  {
    id: 2,
    title: '618年中盛典',
    description: '年中大促，全场商品8折起，满300减50。新品上市享额外优惠，会员购物双倍积分。',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-06-01',
    endTime: '2025-06-18',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=32',
    rules: [
      '全场商品8折起',
      '满300减50，上不封顶',
      '新品上市享额外9折',
      '会员购物双倍积分',
      '活动最终解释权归本商城所有'
    ],
    relatedProducts: [
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23', discount: 8.2, sales: 4567, rating: 4.6 },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24', discount: 8.0, sales: 345, rating: 4.8 },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25', discount: 8.2, sales: 1234, rating: 4.7 }
    ]
  },
  {
    id: 3,
    title: '夏日清凉特卖',
    description: '夏日清凉商品大促销，空调、风扇、冰箱等家电类商品满2000减300。清凉饮品买二送一，防暑降温商品全场8折。',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-07-01',
    endTime: '2025-07-31',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=35',
    rules: [
      '家电类商品满2000减300',
      '清凉饮品买二送一',
      '防暑降温商品全场8折',
      '活动最终解释权归本商城所有'
    ],
    relatedProducts: [
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26', discount: 8.0, sales: 2345, rating: 4.6 },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17', discount: 9.2, sales: 1789, rating: 4.7 },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18', discount: 9.1, sales: 1345, rating: 4.6 }
    ]
  },
  {
    id: 4,
    title: '会员专享日',
    description: '会员专享8折优惠，新用户注册即送100元优惠券。活动期间，会员购买指定商品可获得双倍积分，积分可兑换精美礼品。',
    tag: '会员',
    tagType: 'success',
    startTime: '2025-05-15',
    endTime: '2025-05-16',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=36',
    rules: [
      '会员专享8折优惠',
      '新用户注册即送100元优惠券',
      '会员购买指定商品双倍积分',
      '积分可兑换精美礼品',
      '活动最终解释权归本商城所有'
    ],
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22', discount: 9.2, sales: 654, rating: 4.7 },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11', discount: 9, sales: 1234, rating: 4.8 },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13', discount: 9.2, sales: 3456, rating: 4.7 }
    ]
  }
]

// 获取促销活动详情
const fetchPromotionDetail = () => {
  // 实际项目中这里应该调用API获取数据
  // 模拟API调用，从mock数据中查找对应ID的活动
  const foundPromotion = mockPromotions.find(p => p.id === promotionId.value)
  
  if (foundPromotion) {
    // 将找到的活动数据赋值给promotion对象
    Object.assign(promotion, foundPromotion)
  } else {
    // 如果找不到对应的活动，显示错误提示
    ElMessage.error('未找到该促销活动')
    // 跳转到促销活动列表页面
    router.push('/promotions')
  }
}

// 加入购物车
const addToCart = (product) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  ElMessage.success(`已将 ${product.name} 加入购物车`)
}

// 立即购买
const buyNow = (product) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  ElMessage.info(`立即购买 ${product.name}`)
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