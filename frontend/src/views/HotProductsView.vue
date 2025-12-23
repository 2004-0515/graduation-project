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
            <el-select v-model="selectedCategory" placeholder="全部分类" clearable @change="handleFilterChange">
              <el-option label="全部分类" value="0"></el-option>
              <el-option label="手机数码" value="1"></el-option>
              <el-option label="家用电器" value="2"></el-option>
              <el-option label="服装鞋帽" value="3"></el-option>
              <el-option label="美妆护肤" value="4"></el-option>
              <el-option label="食品饮料" value="5"></el-option>
              <el-option label="图书音像" value="6"></el-option>
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
          ></el-pagination>
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import productApi from '../api/productApi'
import Navbar from '../components/Navbar.vue'

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

// 商品列表
const products = reactive([
  // 模拟数据
  { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', discount: 9, sales: 1234, stock: 500, mainImage: 'https://picsum.photos/300/300?random=11', rating: 4.8, categoryId: 11 },
  { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', discount: 8.7, sales: 2345, stock: 300, mainImage: 'https://picsum.photos/300/300?random=12', rating: 4.9, categoryId: 11 },
  { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', discount: 9.2, sales: 3456, stock: 400, mainImage: 'https://picsum.photos/300/300?random=13', rating: 4.7, categoryId: 11 },
  { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', discount: 8.9, sales: 1876, stock: 200, mainImage: 'https://picsum.photos/300/300?random=14', rating: 4.6, categoryId: 11 },
  { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', discount: 9.2, sales: 1567, stock: 350, mainImage: 'https://picsum.photos/300/300?random=15', rating: 4.5, categoryId: 11 },
  { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', discount: 9.1, sales: 1432, stock: 420, mainImage: 'https://picsum.photos/300/300?random=16', rating: 4.8, categoryId: 11 },
  { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', discount: 9.2, sales: 1789, stock: 280, mainImage: 'https://picsum.photos/300/300?random=17', rating: 4.7, categoryId: 11 },
  { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', discount: 9.1, sales: 1345, stock: 360, mainImage: 'https://picsum.photos/300/300?random=18', rating: 4.6, categoryId: 11 },
  { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', discount: 9.3, sales: 897, stock: 150, mainImage: 'https://picsum.photos/300/300?random=19', rating: 4.9, categoryId: 12 },
  { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', discount: 9.1, sales: 1123, stock: 220, mainImage: 'https://picsum.photos/300/300?random=20', rating: 4.8, categoryId: 12 },
  { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', discount: 9.4, sales: 789, stock: 180, mainImage: 'https://picsum.photos/300/300?random=21', rating: 4.9, categoryId: 12 },
  { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', discount: 9.2, sales: 654, stock: 120, mainImage: 'https://picsum.photos/300/300?random=22', rating: 4.7, categoryId: 12 },
  { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', discount: 8.2, sales: 4567, stock: 600, mainImage: 'https://picsum.photos/300/300?random=23', rating: 4.6, categoryId: 21 },
  { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', discount: 8.0, sales: 345, stock: 80, mainImage: 'https://picsum.photos/300/300?random=24', rating: 4.8, categoryId: 21 },
  { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', discount: 8.2, sales: 1234, stock: 250, mainImage: 'https://picsum.photos/300/300?random=25', rating: 4.7, categoryId: 21 },
  { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', discount: 8.0, sales: 2345, stock: 400, mainImage: 'https://picsum.photos/300/300?random=26', rating: 4.6, categoryId: 21 }
])

// 计算总商品数
const total = computed(() => {
  return products.length
})

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
  // 实际项目中这里应该重新调用API获取数据
}

// 当前页码变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  // 实际项目中这里应该重新调用API获取数据
}

// 筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1
  // 实际项目中这里应该重新调用API获取数据
}

// 排序方式变化
const handleSortChange = () => {
  currentPage.value = 1
  // 实际项目中这里应该重新调用API获取数据
  // 根据排序方式对商品列表进行排序
  if (sortBy.value === 'price-asc') {
    products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
  } else if (sortBy.value === 'price-desc') {
    products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
  } else if (sortBy.value === 'sales') {
    products.sort((a, b) => b.sales - a.sales)
  } else if (sortBy.value === 'rating') {
    products.sort((a, b) => b.rating - a.rating)
  }
}

// 页面加载时初始化数据
onMounted(() => {
  handleSortChange()
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
  flex-wrap: wrap;
  gap: 15px;
}

.filter-options, .sort-options {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-weight: bold;
  color: #333;
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