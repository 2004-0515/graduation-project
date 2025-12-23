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

// 分类ID
const categoryId = ref(parseInt(route.params.id))

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
const pageSize = ref(12)
const total = ref(0)

// 排序方式
const sortBy = ref('default')

// 监听排序方式变化，重新获取商品列表
const sortByChange = (value) => {
  sortBy.value = value
  currentPage.value = 1
  fetchProducts()
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
    // 模拟数据
    allCategories.value = [
      { id: 1, name: '手机数码', parentId: 0 },
      { id: 2, name: '家用电器', parentId: 0 },
      { id: 3, name: '服装鞋帽', parentId: 0 },
      { id: 4, name: '美妆护肤', parentId: 0 },
      { id: 5, name: '食品饮料', parentId: 0 },
      { id: 6, name: '图书音像', parentId: 0 },
      { id: 11, name: '智能手机', parentId: 1 },
      { id: 12, name: '笔记本电脑', parentId: 1 },
      { id: 13, name: '平板电脑', parentId: 1 },
      { id: 21, name: '冰箱', parentId: 2 },
      { id: 22, name: '洗衣机', parentId: 2 },
      { id: 23, name: '空调', parentId: 2 },
      { id: 31, name: '男装', parentId: 3 },
      { id: 32, name: '女装', parentId: 3 },
      { id: 33, name: '鞋子', parentId: 3 },
      { id: 34, name: '箱包', parentId: 3 }
    ]
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    allCategories.value = []
  }
}

// 获取商品列表
const fetchProducts = async () => {
  try {
    // 模拟数据 - 增加更多数据用于测试分页
    const mockProducts = [
      // 智能手机分类（categoryId: 11）
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', discount: 9, sales: 1234, stock: 500, mainImage: 'https://picsum.photos/300/300?random=11', categoryId: 11 },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', discount: 8.7, sales: 2345, stock: 300, mainImage: 'https://picsum.photos/300/300?random=12', categoryId: 11 },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', discount: 9.2, sales: 3456, stock: 400, mainImage: 'https://picsum.photos/300/300?random=13', categoryId: 11 },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', discount: 8.9, sales: 1876, stock: 200, mainImage: 'https://picsum.photos/300/300?random=14', categoryId: 11 },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', discount: 9.2, sales: 1567, stock: 350, mainImage: 'https://picsum.photos/300/300?random=15', categoryId: 11 },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', discount: 9.1, sales: 1432, stock: 420, mainImage: 'https://picsum.photos/300/300?random=16', categoryId: 11 },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', discount: 9.2, sales: 1789, stock: 280, mainImage: 'https://picsum.photos/300/300?random=17', categoryId: 11 },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', discount: 9.1, sales: 1345, stock: 360, mainImage: 'https://picsum.photos/300/300?random=18', categoryId: 11 },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', discount: 9.2, sales: 987, stock: 200, mainImage: 'https://picsum.photos/300/300?random=27', categoryId: 11 },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', discount: 9.0, sales: 876, stock: 180, mainImage: 'https://picsum.photos/300/300?random=28', categoryId: 11 },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', discount: 8.9, sales: 765, stock: 150, mainImage: 'https://picsum.photos/300/300?random=29', categoryId: 11 },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', discount: 9.0, sales: 654, stock: 120, mainImage: 'https://picsum.photos/300/300?random=30', categoryId: 11 },
      
      // 笔记本电脑分类（categoryId: 12）
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', discount: 9.3, sales: 897, stock: 150, mainImage: 'https://picsum.photos/300/300?random=19', categoryId: 12 },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', discount: 9.1, sales: 1123, stock: 220, mainImage: 'https://picsum.photos/300/300?random=20', categoryId: 12 },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', discount: 9.4, sales: 789, stock: 180, mainImage: 'https://picsum.photos/300/300?random=21', categoryId: 12 },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', discount: 9.2, sales: 654, stock: 120, mainImage: 'https://picsum.photos/300/300?random=22', categoryId: 12 },
      { id: 21, name: '华硕 ROG Zephyrus G14', price: '8999', originalPrice: '9999', discount: 9.0, sales: 1098, stock: 190, mainImage: 'https://picsum.photos/300/300?random=31', categoryId: 12 },
      { id: 22, name: '微星 Stealth 15', price: '10999', originalPrice: '11999', discount: 9.1, sales: 876, stock: 130, mainImage: 'https://picsum.photos/300/300?random=32', categoryId: 12 },
      { id: 23, name: '雷蛇灵刃 14', price: '13999', originalPrice: '14999', discount: 9.3, sales: 765, stock: 100, mainImage: 'https://picsum.photos/300/300?random=33', categoryId: 12 },
      { id: 24, name: '华为 MateBook X Pro', price: '9999', originalPrice: '10999', discount: 9.1, sales: 1234, stock: 210, mainImage: 'https://picsum.photos/300/300?random=34', categoryId: 12 },
      
      // 平板电脑分类（categoryId: 13）
      { id: 13, name: 'iPad Pro 12.9', price: '8999', originalPrice: '9999', discount: 9.0, sales: 3456, stock: 400, mainImage: 'https://picsum.photos/300/300?random=23', categoryId: 13 },
      { id: 14, name: '华为 MatePad Pro 13.2', price: '6999', originalPrice: '7999', discount: 8.7, sales: 2345, stock: 300, mainImage: 'https://picsum.photos/300/300?random=24', categoryId: 13 },
      { id: 15, name: '小米平板 7 Pro', price: '3999', originalPrice: '4499', discount: 8.9, sales: 4567, stock: 500, mainImage: 'https://picsum.photos/300/300?random=25', categoryId: 13 },
      { id: 16, name: '三星 Galaxy Tab S9 Ultra', price: '8499', originalPrice: '9499', discount: 8.9, sales: 1876, stock: 250, mainImage: 'https://picsum.photos/300/300?random=26', categoryId: 13 },
      { id: 25, name: '联想小新 Pad Pro', price: '2999', originalPrice: '3499', discount: 8.6, sales: 5678, stock: 600, mainImage: 'https://picsum.photos/300/300?random=35', categoryId: 13 },
      { id: 26, name: '荣耀平板 V9 Pro', price: '3299', originalPrice: '3799', discount: 8.7, sales: 4321, stock: 450, mainImage: 'https://picsum.photos/300/300?random=36', categoryId: 13 },
      { id: 27, name: 'OPPO Pad 2', price: '2799', originalPrice: '3299', discount: 8.5, sales: 3890, stock: 550, mainImage: 'https://picsum.photos/300/300?random=37', categoryId: 13 },
      { id: 28, name: 'vivo Pad Air', price: '2599', originalPrice: '2999', discount: 8.6, sales: 3456, stock: 500, mainImage: 'https://picsum.photos/300/300?random=38', categoryId: 13 },
      
      // 冰箱分类（categoryId: 21）
      { id: 29, name: '海尔 冰箱 BCD-500WGHTD78B1U1', price: '5999', originalPrice: '6999', discount: 8.6, sales: 2109, stock: 150, mainImage: 'https://picsum.photos/300/300?random=39', categoryId: 21 },
      { id: 30, name: '美的 冰箱 BCD-542WKPZM(E)', price: '4999', originalPrice: '5999', discount: 8.3, sales: 1890, stock: 130, mainImage: 'https://picsum.photos/300/300?random=40', categoryId: 21 },
      { id: 31, name: '西门子 冰箱 KA92NV09TI', price: '7999', originalPrice: '8999', discount: 8.9, sales: 1567, stock: 100, mainImage: 'https://picsum.photos/300/300?random=41', categoryId: 21 },
      { id: 32, name: '容声 冰箱 BCD-536WD18HP', price: '4599', originalPrice: '5299', discount: 8.7, sales: 1345, stock: 120, mainImage: 'https://picsum.photos/300/300?random=42', categoryId: 21 },
      
      // 洗衣机分类（categoryId: 22）
      { id: 33, name: '海尔 洗衣机 EG100HMAX2S', price: '3999', originalPrice: '4599', discount: 8.7, sales: 2890, stock: 180, mainImage: 'https://picsum.photos/300/300?random=43', categoryId: 22 },
      { id: 34, name: '美的 洗衣机 MD100VT717WDY5', price: '3499', originalPrice: '3999', discount: 8.7, sales: 2567, stock: 160, mainImage: 'https://picsum.photos/300/300?random=44', categoryId: 22 },
      { id: 35, name: '小天鹅 洗衣机 TG100VT096WDG-Y1T', price: '2999', originalPrice: '3599', discount: 8.3, sales: 3210, stock: 200, mainImage: 'https://picsum.photos/300/300?random=45', categoryId: 22 },
      { id: 36, name: '西门子 洗衣机 WM12P2689W', price: '5999', originalPrice: '6999', discount: 8.6, sales: 1789, stock: 110, mainImage: 'https://picsum.photos/300/300?random=46', categoryId: 22 }
    ]
    
    let filteredProducts = mockProducts
    if (categoryId.value > 0) {
      // 过滤出当前分类下的商品
      filteredProducts = mockProducts.filter(product => {
        // 检查商品分类ID是否等于当前分类ID，或者是当前分类的子分类
        const productCategory = allCategories.value.find(cat => cat.id === product.categoryId)
        return productCategory && (productCategory.id === categoryId.value || productCategory.parentId === categoryId.value)
      })
    }
    
    // 根据排序方式对商品进行排序
    let sortedProducts = [...filteredProducts]
    switch (sortBy.value) {
      case 'price-asc':
        // 价格从低到高排序
        sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case 'price-desc':
        // 价格从高到低排序
        sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case 'sales':
        // 销量最高排序
        sortedProducts.sort((a, b) => b.sales - a.sales)
        break
      case 'default':
      default:
        // 默认排序，按商品ID排序
        sortedProducts.sort((a, b) => a.id - b.id)
        break
    }
    
    // 实现分页逻辑
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    products.value = sortedProducts.slice(startIndex, endIndex)
    total.value = sortedProducts.length
    
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
const addToCart = (product) => {
  ElMessage.success(`已将 ${product.name} 加入购物车`)
}

// 立即购买
const buyNow = (product) => {
  ElMessage.info(`立即购买 ${product.name}`)
}

// 分页大小变化
const handleSizeChange = (size) => {
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

// 统一获取数据的函数
const fetchData = async () => {
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

/* 分类商品内容 */
.category-content {
  margin: 40px 0;
}

.content-wrapper {
  display: flex;
  gap: 20px;
}

/* 左侧分类导航 */
.category-sidebar {
  flex: 0 0 250px;
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
}

.filter-bar {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.filter-label {
  margin-right: 10px;
  font-weight: bold;
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
</style>