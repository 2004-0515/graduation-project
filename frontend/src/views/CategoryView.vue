<template>
  <div class="category-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 分类商品内容 -->
    <section class="category-content">
      <div class="container">
        <div class="category-header">
          <h2 class="section-title">{{ category.name }} - 商品列表</h2>
        </div>
        
        <div class="content-wrapper">
          <!-- 左侧分类导航 -->
          <aside class="category-sidebar">
            <el-card shadow="hover">
              <h3>商品分类</h3>
              <el-menu :default-active="activeMenuId" class="category-menu" @select="handleMenuSelect">
                <el-menu-item index="0" @click="$router.push('/category/0')">
                  全部商品
                </el-menu-item>
                <el-sub-menu :index="parent.id.toString()" v-for="parent in parentCategories" :key="parent.id">
                  <template #title>
                    <span>{{ parent.name }}</span>
                  </template>
                  <el-menu-item :index="child.id.toString()" v-for="child in parent.children" :key="child.id" @click="$router.push(`/category/${child.id}`)">
                    {{ child.name }}
                  </el-menu-item>
                </el-sub-menu>
              </el-menu>
            </el-card>
          </aside>
          
          <!-- 右侧商品列表 -->
          <main class="product-list">
            <div class="filter-bar">
              <div class="sort-options">
                <span class="filter-label">排序方式：</span>
                <el-radio-group v-model="sortBy" @change="sortByChange">
                  <el-radio-button label="default">默认排序</el-radio-button>
                  <el-radio-button label="price-asc">价格从低到高</el-radio-button>
                  <el-radio-button label="price-desc">价格从高到低</el-radio-button>
                  <el-radio-button label="sales">销量最高</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            
            <div class="product-grid">
              <div class="product-item" v-for="product in products" :key="product.id">
                <el-card shadow="hover">
                  <template #header>
                    <div class="product-header">
                      <el-tag type="success" v-if="product.discount">{{ product.discount }}折</el-tag>
                    </div>
                  </template>
                  <el-image :src="product.mainImage" fit="cover" :preview-src-list="[product.mainImage]" @click="$router.push(`/product/${product.id}`)" preview-teleported class="product-image"></el-image>
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
          </main>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell } from '@element-plus/icons-vue'
import categoryApi from '../api/categoryApi'
import productApi from '../api/productApi'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 分类ID
const categoryId = ref(parseInt(route.params.id))

// 从路由查询参数中获取分页信息
const getPaginationFromQuery = () => {
  // 获取页码，默认为1
  const page = route.query.page ? parseInt(route.query.page) : 1
  // 获取每页条数，默认为10
  const size = route.query.size ? parseInt(route.query.size) : 10
  return { page, size }
}

// 分类信息
const category = reactive({
  id: 0,
  name: '',
  description: ''
})

// 分类列表
const allCategories = ref([])

// 父分类列表（带有子分类）
const parentCategories = computed(() => {
  return allCategories.value
    .filter(cat => cat.parentId === 0)
    .map(parent => {
      return {
        ...parent,
        children: allCategories.value.filter(child => child.parentId === parent.id)
      }
    })
})

// 商品列表
const products = ref([])

// 分页信息
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 排序方式
const sortBy = ref('default')

// 添加防抖功能，避免频繁请求
const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// 缓存机制，避免重复请求
const cache = {
  products: new Map()
}

// 监听排序方式变化，重新获取商品列表
const sortByChange = (value) => {
  sortBy.value = value
  currentPage.value = 1
  debouncedFetchProducts()
}

// 获取分类信息
const fetchCategoryInfo = async () => {
  try {
    if (categoryId.value > 0) {
      // 从所有分类中查找当前分类
      const currentCategory = allCategories.value.find(cat => cat.id === categoryId.value)
      if (currentCategory) {
        // 如果是子分类，使用子分类名称
        category.name = currentCategory.name
        category.description = ''
      } else {
        category.name = '商品列表'
        category.description = ''
      }
    } else {
      category.name = '全部商品'
      category.description = ''
    }
  } catch (error) {
    console.error('获取分类信息失败:', error)
    ElMessage.error('获取分类信息失败')
    category.name = '商品列表'
    category.description = ''
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await categoryApi.getAllCategories()
    if (response.success === true && response.data) {
      allCategories.value = response.data
    } else {
      allCategories.value = response
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    allCategories.value = []
  }
}

// 获取商品列表
const fetchProducts = async () => {
  try {
    let response
    if (categoryId.value === 0) {
      // 获取所有商品
      response = await productApi.getProducts(currentPage.value - 1, pageSize.value)
    } else {
      // 获取特定分类下的商品
      response = await productApi.getProductsByCategoryId(categoryId.value)
    }
    
    let productsData = []
    let totalData = 0
    
    if (response.success === true && response.data) {
      if (response.data.content) {
        // 处理分页响应
        productsData = response.data.content
        totalData = response.data.totalElements
      } else if (Array.isArray(response.data)) {
        // 直接返回商品列表
        productsData = response.data
        totalData = productsData.length
        
        // 根据排序方式对商品进行排序
        switch (sortBy.value) {
          case 'price-asc':
            // 价格从低到高排序
            productsData.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            break
          case 'price-desc':
            // 价格从高到低排序
            productsData.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
            break
          case 'sales':
            // 销量最高排序
            productsData.sort((a, b) => b.sales - a.sales)
            break
          case 'default':
          default:
            // 默认排序，按商品ID排序
            productsData.sort((a, b) => a.id - b.id)
            break
        }
        
        // 手动实现分页
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        productsData = productsData.slice(startIndex, endIndex)
      }
    }
    
    products.value = productsData
    total.value = totalData
    
    // 数据加载完成后，使用nextTick确保DOM更新，然后滚动到页面顶部
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
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
    products.value = []
    total.value = 0
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
    await cartStore.addToCart(userStore.userInfo.id, product.id, 1)
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

// 分页大小变化
const handleSizeChange = (size) => {
  // 更新页面大小，重新获取数据
  pageSize.value = size
  currentPage.value = 1
  fetchProducts()
}

// 计算当前激活的菜单ID
const activeMenuId = computed(() => {
  // 如果当前分类是子分类，返回父分类ID
  const currentCategory = allCategories.value.find(cat => cat.id === categoryId.value)
  if (currentCategory && currentCategory.parentId !== 0) {
    return currentCategory.parentId.toString()
  }
  return categoryId.toString()
})

// 处理菜单选择
const handleMenuSelect = (index) => {
  const categoryId = parseInt(index)
  if (categoryId > 0) {
    // 检查是否是父分类
    const isParent = allCategories.value.some(cat => cat.parentId === categoryId)
    if (!isParent) {
      // 不是父分类，是子分类，跳转到对应的分类页面
      router.push(`/category/${categoryId}`)
    }
    // 如果是父分类，不跳转，只展开
  }
}

// 当前页码变化
const handleCurrentChange = (current) => {
  // 更新当前页码，重新获取数据
  currentPage.value = current
  fetchProducts()
}

// 页面加载时获取数据
onMounted(() => {
  fetchData()
})

// 监听路由参数变化，重新获取数据
watch(() => route.params.id, (newId) => {
  categoryId.value = parseInt(newId)
  fetchData()
})

// 监听路由查询参数变化，更新分页信息
watch(() => route.query, (newQuery) => {
  const { page, size } = getPaginationFromQuery()
  currentPage.value = page
  pageSize.value = size
  fetchData()
})

// 统一获取数据的函数
const fetchData = async () => {
  // 从路由查询参数中获取分页信息并初始化
  const { page, size } = getPaginationFromQuery()
  currentPage.value = page
  pageSize.value = size
  
  await Promise.all([
    fetchCategories(),
    fetchCategoryInfo(),
    fetchProducts()
  ])
  
  // 数据加载完成后，使用nextTick确保DOM更新，然后滚动到页面顶部
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

// 优化后的fetchProducts函数，带缓存机制
const optimizedFetchProducts = async () => {
  try {
    // 生成缓存键
    const cacheKey = `${categoryId.value}-${sortBy.value}-${currentPage.value}-${pageSize.value}`
    
    // 检查缓存
    if (cache.products.has(cacheKey)) {
      const cachedData = cache.products.get(cacheKey)
      products.value = cachedData.products
      total.value = cachedData.total
      return
    }
    
    // 调用原始fetchProducts获取数据
    await fetchProducts()
    
    // 缓存数据
    cache.products.set(cacheKey, {
      products: [...products.value],
      total: total.value
    })
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  }
}

// 防抖处理后的获取商品函数
const debouncedFetchProducts = debounce(optimizedFetchProducts, 300)
</script>

<style scoped>
/* 全局样式 */
.container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 10px;
  width: 100%;
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

/* 分类商品内容 */
.category-content {
  margin: 40px 0;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  overflow-x: hidden;
}

/* 左侧分类导航 */
.category-sidebar {
  flex: 0 0 160px;
  min-width: 140px;
  margin-right: 10px;
  padding-right: 10px;
  border-right: 1px solid #ebeef5;
}

.category-sidebar h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.category-menu {
  border: none;
}

/* 右侧商品列表 */
.product-list {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  padding-right: 10px;
}

.filter-bar {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow-x: hidden;
  width: 100%;
}

.filter-label {
  margin-right: 10px;
  font-weight: bold;
}

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

.product-info h3 {
  margin: 15px 0 10px;
  font-size: 16px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
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
  
  .content-wrapper {
    flex-direction: column;
  }
  
  .category-sidebar {
    flex: 1;
    margin-bottom: 20px;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .sort-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

/* 中等屏幕尺寸 - 2-4列布局 */
@media (min-width: 769px) and (max-width: 1199px) {
  /* 小屏幕下显示2列 */
  @media (min-width: 769px) and (max-width: 991px) {
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* 确保在接近1200px时过渡到4列布局 */
  @media (min-width: 992px) and (max-width: 1199px) {
    .product-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
</style>