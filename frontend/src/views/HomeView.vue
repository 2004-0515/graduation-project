<template>
  <div class="home-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 轮播图 -->
    <section class="banner">
      <el-carousel height="400px" indicator-position="outside">
        <el-carousel-item>
            <div class="banner-item banner-1">
              <h2>限时特惠</h2>
              <p>全场商品低至5折</p>
              <el-button type="primary" size="large" @click="handleBannerClick(1)">立即抢购</el-button>
            </div>
          </el-carousel-item>
          <el-carousel-item>
            <div class="banner-item banner-2">
              <h2>新品上市</h2>
              <p>最新款商品等你来选</p>
              <el-button type="primary" size="large" @click="handleBannerClick(2)">查看详情</el-button>
            </div>
          </el-carousel-item>
          <el-carousel-item>
            <div class="banner-item banner-3">
              <h2>会员专享</h2>
              <p>会员购物享双倍积分</p>
              <el-button type="primary" size="large" @click="handleBannerClick(3)">立即开通</el-button>
            </div>
          </el-carousel-item>
      </el-carousel>
    </section>

    <!-- 商品分类 -->
    <section class="categories">
      <div class="container">
        <h2 class="section-title">商品分类</h2>
        <div class="category-grid">
          <div class="category-item" v-for="category in categories" :key="category.id">
            <el-card shadow="hover">
              <el-image :src="category.icon" fit="cover" :preview-src-list="[category.icon]" preview-teleported></el-image>
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
              <el-button type="primary" size="small" @click="$router.push(`/category/${category.id}`)">查看商品</el-button>
            </el-card>
          </div>
        </div>
      </div>
    </section>

    <!-- 热销商品 -->
    <section class="hot-products">
      <div class="container">
        <h2 class="section-title">热销商品</h2>
        <div class="product-grid">
          <div class="product-item" v-for="product in hotProducts" :key="product.id">
            <el-card shadow="hover">
              <template #header>
                <div class="product-header">
                  <el-tag type="success" v-if="product.discount">{{ product.discount }}折</el-tag>
                </div>
              </template>
              <el-image :src="product.mainImage" fit="cover" :preview-src-list="[product.mainImage]" @click="$router.push(`/product/${product.id}`)" preview-teleported></el-image>
              <div class="product-info">
                <h3 @click="$router.push(`/product/${product.id}`)">{{ product.name }}</h3>
                <div class="product-price">
                  <span class="price">{{ product.price }}</span>
                  <span class="original-price" v-if="product.originalPrice">{{ product.originalPrice }}</span>
                </div>
                <div class="product-stats">
                  <span>销量: {{ product.sales }}</span>
                  <span>库存: {{ product.stock }}</span>
                </div>
                <div class="product-actions">
                  <el-button type="primary" size="small" @click="addToCart(product)">加入购物车</el-button>
                  <el-button type="success" size="small" @click="buyNow(product)">立即购买</el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
        <div class="view-more">
          <el-button type="primary" @click="$router.push('/hot-products')">查看更多</el-button>
        </div>
      </div>
    </section>

    <!-- 促销活动 -->
    <section class="promotions">
      <div class="container">
        <h2 class="section-title">促销活动</h2>
        <div class="promotion-grid">
          <div class="promotion-item" v-for="promotion in promotions" :key="promotion.id">
            <el-card shadow="hover" @click="$router.push(`/promotion/${promotion.id}`)" style="cursor: pointer;">
              <div class="promotion-content">
                <h3>{{ promotion.title }}</h3>
                <p>{{ promotion.description }}</p>
                <span class="promotion-date">{{ promotion.date }}</span>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// 只导入必要的图标
import { ShoppingCart, Bell, ArrowDown } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import productApi from '../api/productApi'
import categoryApi from '../api/categoryApi'
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

// 商品分类数据
const categories = ref([])

// 热销商品数据
const hotProducts = ref([])

// 促销活动数据
const promotions = ref([])

// 加载状态
const loading = ref(false)

// 获取商品分类数据
const fetchCategories = async () => {
  try {
    const response = await categoryApi.getAllCategories()
    if (response.success === true && response.data) {
      categories.value = response.data
    } else {
      categories.value = response
    }
  } catch (error) {
    console.error('获取商品分类失败:', error)
    // 保留一些默认分类作为备用
    categories.value = [
      { id: 1, name: '手机数码', description: '各种品牌手机、电脑、数码产品', icon: 'https://picsum.photos/200/200?random=1' },
      { id: 2, name: '家用电器', description: '冰箱、洗衣机、空调等家用电器', icon: 'https://picsum.photos/200/200?random=2' },
      { id: 3, name: '服装鞋帽', description: '时尚服装、鞋帽配饰', icon: 'https://picsum.photos/200/200?random=3' },
      { id: 4, name: '美妆护肤', description: '各种品牌化妆品、护肤品', icon: 'https://picsum.photos/200/200?random=4' },
      { id: 5, name: '食品饮料', description: '零食、饮料、生鲜食品', icon: 'https://picsum.photos/200/200?random=5' },
      { id: 6, name: '图书音像', description: '各种图书、音像制品', icon: 'https://picsum.photos/200/200?random=6' },
    ]
  }
}

// 获取热销商品数据
const fetchHotProducts = async () => {
  try {
    // 这里假设后端有获取热销商品的API，暂时使用getProducts获取前6个商品作为热销商品
    const response = await productApi.getProducts(0, 6)
    if (response.success === true && response.data) {
      // 处理分页响应
      if (response.data.content) {
        hotProducts.value = response.data.content
      } else {
        hotProducts.value = response.data
      }
    } else {
      hotProducts.value = response
    }
  } catch (error) {
    console.error('获取热销商品失败:', error)
    // 保留一些默认商品作为备用
    hotProducts.value = [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', discount: 9, sales: 1234, stock: 500, mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', discount: 8.7, sales: 2345, stock: 300, mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', discount: 9.2, sales: 3456, stock: 400, mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', discount: 8.9, sales: 1876, stock: 200, mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', discount: 9.2, sales: 1567, stock: 350, mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', discount: 9.1, sales: 1432, stock: 420, mainImage: 'https://picsum.photos/300/300?random=16' },
    ]
  }
}

// 获取促销活动数据
const fetchPromotions = async () => {
  try {
    // 由于没有找到促销活动API，暂时使用模拟数据
    promotions.value = [
      { id: 1, title: '双11大促', description: '全场商品低至5折，满1000减200', date: '2025-11-11' },
      { id: 2, title: '618年中庆', description: '全场满300减50，上不封顶', date: '2025-06-18' },
      { id: 3, title: '新年特惠', description: '新年新气象，购物送好礼', date: '2025-01-01' },
    ]
  } catch (error) {
    console.error('获取促销活动失败:', error)
    promotions.value = []
  }
}

// 获取购物车列表
const fetchCartItems = async () => {
  if (userStore.isLoggedIn) {
    await cartStore.fetchCartItems(userId.value)
  }
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
  } catch (error) {
    console.error('加入购物车失败:', error)
  }
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

// 处理轮播图点击事件，跳转到对应促销活动详情页
const handleBannerClick = (promotionId) => {
  ElMessage.info('进入促销活动详情')
  // 跳转到对应ID的促销活动详情页面
  router.push(`/promotion/${promotionId}`)
}

// 页面加载时获取数据
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchCategories(),
      fetchHotProducts(),
      fetchPromotions(),
      fetchCartItems()
    ])
  } finally {
    loading.value = false
  }
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



/* 轮播图 */
.banner {
  margin: 20px 0;
}

.banner-item {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  background-size: cover;
  background-position: center;
}

.banner-1 {
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://picsum.photos/1200/400?random=101');
}

.banner-2 {
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://picsum.photos/1200/400?random=102');
}

.banner-3 {
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://picsum.photos/1200/400?random=103');
}

.banner-item h2 {
  font-size: 36px;
  margin-bottom: 20px;
}

.banner-item p {
  font-size: 18px;
  margin-bottom: 30px;
}

/* 商品分类 */
.categories {
  margin: 40px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.category-item {
  transition: transform 0.3s;
}

.category-item:hover {
  transform: translateY(-5px);
}

.category-item h3 {
  margin: 15px 0 10px;
  font-size: 18px;
  text-align: center;
}

.category-item p {
  margin: 0 0 15px;
  font-size: 14px;
  color: #666;
  text-align: center;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.category-item .el-button {
  width: 100%;
}

/* 热销商品 */
.hot-products {
  margin: 40px 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
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
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.product-actions {
  display: flex;
  gap: 10px;
}

.product-actions .el-button {
  flex: 1;
}

.view-more {
  text-align: center;
  margin: 30px 0;
}

/* 促销活动 */
.promotions {
  margin: 40px 0;
}

.promotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.promotion-item {
  transition: transform 0.3s;
}

.promotion-item:hover {
  transform: translateY(-5px);
}

.promotion-content {
  padding: 20px;
}

.promotion-content h3 {
  margin: 0 0 10px;
  font-size: 18px;
}

.promotion-content p {
  margin: 0 0 15px;
  color: #666;
}

.promotion-date {
  font-size: 14px;
  color: #999;
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
  
  .category-grid,
  .product-grid,
  .promotion-grid {
    grid-template-columns: 1fr;
  }
  
  .banner-item h2 {
    font-size: 24px;
  }
  
  .banner-item p {
    font-size: 14px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>