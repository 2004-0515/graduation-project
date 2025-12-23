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

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
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
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import productApi from '../api/productApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()
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
const pageSize = ref(16)

// 完整商品列表（用于分页）
const allProducts = reactive([
  // 模拟数据 - 增加更多数据用于测试分页
  // 智能手机分类（categoryId: 11）
  { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', discount: 9, sales: 1234, stock: 500, mainImage: 'https://picsum.photos/300/300?random=11', rating: 4.8, categoryId: 11 },
  { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', discount: 8.7, sales: 2345, stock: 300, mainImage: 'https://picsum.photos/300/300?random=12', rating: 4.9, categoryId: 11 },
  { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', discount: 9.2, sales: 3456, stock: 400, mainImage: 'https://picsum.photos/300/300?random=13', rating: 4.7, categoryId: 11 },
  { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', discount: 8.9, sales: 1876, stock: 200, mainImage: 'https://picsum.photos/300/300?random=14', rating: 4.6, categoryId: 11 },
  { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', discount: 9.2, sales: 1567, stock: 350, mainImage: 'https://picsum.photos/300/300?random=15', rating: 4.5, categoryId: 11 },
  { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', discount: 9.1, sales: 1432, stock: 420, mainImage: 'https://picsum.photos/300/300?random=16', rating: 4.8, categoryId: 11 },
  { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', discount: 9.2, sales: 1789, stock: 280, mainImage: 'https://picsum.photos/300/300?random=17', rating: 4.7, categoryId: 11 },
  { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', discount: 9.1, sales: 1345, stock: 360, mainImage: 'https://picsum.photos/300/300?random=18', rating: 4.6, categoryId: 11 },
  { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', discount: 9.2, sales: 987, stock: 200, mainImage: 'https://picsum.photos/300/300?random=27', rating: 4.5, categoryId: 11 },
  { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', discount: 9.0, sales: 876, stock: 180, mainImage: 'https://picsum.photos/300/300?random=28', rating: 4.4, categoryId: 11 },
  { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', discount: 8.9, sales: 765, stock: 150, mainImage: 'https://picsum.photos/300/300?random=29', rating: 4.3, categoryId: 11 },
  { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', discount: 9.0, sales: 654, stock: 120, mainImage: 'https://picsum.photos/300/300?random=30', rating: 4.6, categoryId: 11 },
  
  // 笔记本电脑分类（categoryId: 12）
  { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', discount: 9.3, sales: 897, stock: 150, mainImage: 'https://picsum.photos/300/300?random=19', rating: 4.9, categoryId: 12 },
  { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', discount: 9.1, sales: 1123, stock: 220, mainImage: 'https://picsum.photos/300/300?random=20', rating: 4.8, categoryId: 12 },
  { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', discount: 9.4, sales: 789, stock: 180, mainImage: 'https://picsum.photos/300/300?random=21', rating: 4.9, categoryId: 12 },
  { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', discount: 9.2, sales: 654, stock: 120, mainImage: 'https://picsum.photos/300/300?random=22', rating: 4.7, categoryId: 12 },
  { id: 21, name: '华硕 ROG Zephyrus G14', price: '8999', originalPrice: '9999', discount: 9.0, sales: 1098, stock: 190, mainImage: 'https://picsum.photos/300/300?random=31', rating: 4.8, categoryId: 12 },
  { id: 22, name: '微星 Stealth 15', price: '10999', originalPrice: '11999', discount: 9.1, sales: 876, stock: 130, mainImage: 'https://picsum.photos/300/300?random=32', rating: 4.7, categoryId: 12 },
  { id: 23, name: '雷蛇灵刃 14', price: '13999', originalPrice: '14999', discount: 9.3, sales: 765, stock: 100, mainImage: 'https://picsum.photos/300/300?random=33', rating: 4.9, categoryId: 12 },
  { id: 24, name: '华为 MateBook X Pro', price: '9999', originalPrice: '10999', discount: 9.1, sales: 1234, stock: 210, mainImage: 'https://picsum.photos/300/300?random=34', rating: 4.6, categoryId: 12 },
  
  // 平板电脑分类（categoryId: 13）
  { id: 13, name: 'iPad Pro 12.9', price: '8999', originalPrice: '9999', discount: 9.0, sales: 3456, stock: 400, mainImage: 'https://picsum.photos/300/300?random=23', rating: 4.9, categoryId: 13 },
  { id: 14, name: '华为 MatePad Pro 13.2', price: '6999', originalPrice: '7999', discount: 8.7, sales: 2345, stock: 300, mainImage: 'https://picsum.photos/300/300?random=24', rating: 4.8, categoryId: 13 },
  { id: 15, name: '小米平板 7 Pro', price: '3999', originalPrice: '4499', discount: 8.9, sales: 4567, stock: 500, mainImage: 'https://picsum.photos/300/300?random=25', rating: 4.7, categoryId: 13 },
  { id: 16, name: '三星 Galaxy Tab S9 Ultra', price: '8499', originalPrice: '9499', discount: 8.9, sales: 1876, stock: 250, mainImage: 'https://picsum.photos/300/300?random=26', rating: 4.6, categoryId: 13 },
  { id: 25, name: '联想小新 Pad Pro', price: '2999', originalPrice: '3499', discount: 8.6, sales: 5678, stock: 600, mainImage: 'https://picsum.photos/300/300?random=35', rating: 4.5, categoryId: 13 },
  { id: 26, name: '荣耀平板 V9 Pro', price: '3299', originalPrice: '3799', discount: 8.7, sales: 4321, stock: 450, mainImage: 'https://picsum.photos/300/300?random=36', rating: 4.6, categoryId: 13 },
  { id: 27, name: 'OPPO Pad 2', price: '2799', originalPrice: '3299', discount: 8.5, sales: 3890, stock: 550, mainImage: 'https://picsum.photos/300/300?random=37', rating: 4.4, categoryId: 13 },
  { id: 28, name: 'vivo Pad Air', price: '2599', originalPrice: '2999', discount: 8.6, sales: 3456, stock: 500, mainImage: 'https://picsum.photos/300/300?random=38', rating: 4.3, categoryId: 13 },
  
  // 冰箱分类（categoryId: 21）
  { id: 29, name: '海尔 冰箱 BCD-500WGHTD78B1U1', price: '5999', originalPrice: '6999', discount: 8.6, sales: 2109, stock: 150, mainImage: 'https://picsum.photos/300/300?random=39', rating: 4.7, categoryId: 21 },
  { id: 30, name: '美的 冰箱 BCD-542WKPZM(E)', price: '4999', originalPrice: '5999', discount: 8.3, sales: 1890, stock: 130, mainImage: 'https://picsum.photos/300/300?random=40', rating: 4.6, categoryId: 21 },
  { id: 31, name: '西门子 冰箱 KA92NV09TI', price: '7999', originalPrice: '8999', discount: 8.9, sales: 1567, stock: 100, mainImage: 'https://picsum.photos/300/300?random=41', rating: 4.8, categoryId: 21 },
  { id: 32, name: '容声 冰箱 BCD-536WD18HP', price: '4599', originalPrice: '5299', discount: 8.7, sales: 1345, stock: 120, mainImage: 'https://picsum.photos/300/300?random=42', rating: 4.5, categoryId: 21 },
  
  // 洗衣机分类（categoryId: 22）
  { id: 33, name: '海尔 洗衣机 EG100HMAX2S', price: '3999', originalPrice: '4599', discount: 8.7, sales: 2890, stock: 180, mainImage: 'https://picsum.photos/300/300?random=43', rating: 4.6, categoryId: 22 },
  { id: 34, name: '美的 洗衣机 MD100VT717WDY5', price: '3499', originalPrice: '3999', discount: 8.7, sales: 2567, stock: 160, mainImage: 'https://picsum.photos/300/300?random=44', rating: 4.5, categoryId: 22 },
  { id: 35, name: '小天鹅 洗衣机 TG100VT096WDG-Y1T', price: '2999', originalPrice: '3599', discount: 8.3, sales: 3210, stock: 200, mainImage: 'https://picsum.photos/300/300?random=45', rating: 4.4, categoryId: 22 },
  { id: 36, name: '西门子 洗衣机 WM12P2689W', price: '5999', originalPrice: '6999', discount: 8.6, sales: 1789, stock: 110, mainImage: 'https://picsum.photos/300/300?random=46', rating: 4.7, categoryId: 22 },
  
  // 空调分类（categoryId: 23）
  { id: 37, name: '格力 空调 KFR-35GW/(35563)FNhAa-B1', price: '4599', originalPrice: '5299', discount: 8.7, sales: 3456, stock: 250, mainImage: 'https://picsum.photos/300/300?random=47', rating: 4.8, categoryId: 23 },
  { id: 38, name: '美的 空调 KFR-35GW/N8MKA1', price: '3999', originalPrice: '4599', discount: 8.7, sales: 4567, stock: 300, mainImage: 'https://picsum.photos/300/300?random=48', rating: 4.7, categoryId: 23 },
  { id: 39, name: '海尔 空调 KFR-35GW/06XBA81U1', price: '4299', originalPrice: '4999', discount: 8.6, sales: 2890, stock: 200, mainImage: 'https://picsum.photos/300/300?random=49', rating: 4.6, categoryId: 23 },
  { id: 40, name: '奥克斯 空调 KFR-35GW/BpR3AQE1(B3)', price: '2999', originalPrice: '3599', discount: 8.3, sales: 5678, stock: 400, mainImage: 'https://picsum.photos/300/300?random=50', rating: 4.5, categoryId: 23 }
])

// 当前页显示的商品列表
const products = ref([])

// 计算总商品数（筛选后）
const total = computed(() => {
  // 筛选逻辑
  if (selectedCategory.value && selectedCategory.value !== '0') {
    const categoryId = parseInt(selectedCategory.value)
    return allProducts.filter(product => {
      const productCategoryId = Math.floor(product.categoryId / 10)
      return productCategoryId === categoryId
    }).length
  }
  return allProducts.length
})

// 商品数据处理函数：筛选、排序、分页
const filterSortAndPaginate = () => {
  // 1. 筛选商品
  let filteredProducts = allProducts
  if (selectedCategory.value !== null && selectedCategory.value !== '0' && selectedCategory.value !== 0) {
    const categoryId = parseInt(selectedCategory.value)
    filteredProducts = allProducts.filter(product => {
      // 提取商品分类ID的第一位数字（如11→1，21→2等）
      const productCategoryId = Math.floor(product.categoryId / 10)
      return productCategoryId === categoryId
    })
  }
  
  // 2. 排序商品
  const sortedProducts = [...filteredProducts]
  if (sortBy.value === 'price-asc') {
    sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
  } else if (sortBy.value === 'price-desc') {
    sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
  } else if (sortBy.value === 'sales') {
    sortedProducts.sort((a, b) => b.sales - a.sales)
  } else if (sortBy.value === 'rating') {
    sortedProducts.sort((a, b) => b.rating - a.rating)
  }
  
  // 3. 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  products.value = sortedProducts.slice(startIndex, endIndex)
  
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
  filterSortAndPaginate()
})
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
  flex-wrap: nowrap;
  gap: 15px;
  width: 100%;
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