<template>
  <div class="hot-products-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 热销商品内容 -->
    <main class="hot-products-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>热销商品</h2>
          <p>精选热门商品，限时特惠</p>
        </div>

        <!-- 筛选和排序 -->
        <div class="filter-sort-bar">
          <div class="filter-options">
            <span class="filter-label">分类筛选：</span>
            <el-select v-model="selectedCategory" @change="handleFilterChange" style="width: 250px;">
              <el-option label="全部分类" :value="0"></el-option>
              <el-option label="手机数码" :value="1"></el-option>
              <el-option label="家用电器" :value="2"></el-option>
              <el-option label="服装鞋帽" :value="3"></el-option>
              <el-option label="美妆护肤" :value="4"></el-option>
              <el-option label="食品饮料" :value="5"></el-option>
              <el-option label="图书音像" :value="6"></el-option>
            </el-select>
          </div>
          
          <div class="sort-options">
            <span class="filter-label">排序方式：</span>
            <el-radio-group v-model="sortBy" @change="handleSortChange">
              <el-radio-button label="sales">销量最高</el-radio-button>
              <el-radio-button label="price-asc">价格从低到高</el-radio-button>
              <el-radio-button label="price-desc">价格从高到低</el-radio-button>
              <el-radio-button label="rating">评分最高</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="product-grid">
          <div class="product-item" v-for="product in products" :key="product.id">
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
                  <div class="rate-container">
                    <el-rate v-model="product.rating" disabled show-score :max="5"></el-rate>
                  </div>
                  <div class="sales-container">
                    <span class="sales">销量: {{ product.sales }}</span>
                  </div>
                </div>
                <div class="product-actions">
                  <el-button type="primary" size="small" @click="addToCart(product)">加入购物车</el-button>
                  <el-button type="success" size="small" @click="buyNow(product)">立即购买</el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            v-model:current-page="currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            total-text="共 {total} 件商品"
          ></el-pagination>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import productApi from '../api/productApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const userStore = useUserStore()

// 从用户信息中获取用户ID
const userId = computed(() => {
  return userStore.userInfo?.id || null
})

// 筛选条件
const selectedCategory = ref(0)
const sortBy = ref('sales')

// 分页信息
const currentPage = ref(1)
const pageSize = ref(10)

// 从路由查询参数初始化分页
const getPaginationFromQuery = () => {
  const page = parseInt(String(route.query.page)) || 1
  const size = parseInt(String(route.query.size)) || 10
  return { page, size }
}

// 当前页显示的商品列表
const products = ref([])

// 计算总商品数（筛选后）
const total = ref(0)

// 商品数据处理函数：筛选、排序、分页
const filterSortAndPaginate = async () => {
  try {
    const pageNo = currentPage.value - 1
    const response = await productApi.getProducts(pageNo, pageSize.value)
    if (response && response.success) {
      products.value = response.data.content || []
      total.value = response.data.totalElements || 0
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败，请稍后重试')
  }
  
  // 数据更新后，使用nextTick确保DOM更新，然后滚动到页面顶部
  nextTick(() => {
    // 兼容各种浏览器的滚动到顶部方法
    if (window.scrollTo) {
      // 现代浏览器支持的平滑滚动
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // 兼容旧版浏览器
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  })
}

// 加入购物车
const addToCart = (product) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  cartStore.addToCart(userId.value, product.id, 1)
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

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  filterSortAndPaginate()
}

// 当前页码变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  filterSortAndPaginate()
}

// 筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1
  filterSortAndPaginate()
}

// 排序方式变化
const handleSortChange = () => {
  currentPage.value = 1
  filterSortAndPaginate()
}

// 页面加载时初始化数据
onMounted(() => {
  // 从路由查询参数初始化分页
  const { page, size } = getPaginationFromQuery()
  currentPage.value = page
  pageSize.value = size
  filterSortAndPaginate()
})

// 监听路由查询参数变化
watch(() => route.query, () => {
  const { page, size } = getPaginationFromQuery()
  currentPage.value = page
  pageSize.value = size
  filterSortAndPaginate()
}, { immediate: true, deep: true })
</script>

<style scoped>
/* 全局样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
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

.nav-menu a:hover, .nav-menu a.active {
  color: #409eff;
  font-weight: bold;
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

/* 热销商品内容 */
.hot-products-content {
  margin: 40px 0;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h2 {
  margin: 0 0 10px;
  font-size: 32px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

/* 筛选排序栏 */
.filter-sort-bar {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
  overflow-x: hidden;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.filter-label {
  font-weight: bold;
  color: #333;
  margin-right: 10px;
}

.sort-options .filter-label {
  margin-right: 10px;
}

/* 商品列表 */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-bottom: 30px;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 在不同屏幕尺寸下设置固定列数 */
@media (min-width: 769px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1100px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 在标准屏幕尺寸下强制显示5列 */
@media (min-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 15px;
  }
}

/* 在大屏幕尺寸下调整间距，确保5个商品卡片能够整齐排列 */
@media (min-width: 1400px) {
  .product-grid {
    gap: 20px;
  }
}

/* 确保商品卡片内容不会溢出 */
.product-info h3 {
  font-size: 14px;
  height: 36px;
  line-height: 1.4;
}

.product-price {
  font-size: 16px;
}

.product-stats {
  font-size: 12px;
}

.product-actions .el-button {
  padding: 5px 10px;
  font-size: 12px;
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
  height: 180px;
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
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.product-stats .el-rate {
  margin-bottom: 0;
  align-self: flex-start;
}

.sales {
  font-size: 14px;
  color: #666;
  align-self: flex-start;
}

.product-actions {
  display: flex;
  gap: 10px;
}

.product-actions .el-button {
  flex: 1;
}

/* 分页 */
.pagination {
  text-align: center;
  margin-top: 30px;
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
  
  .filter-sort-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-options, .sort-options {
    width: 100%;
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