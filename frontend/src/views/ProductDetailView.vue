<template>
  <div class="product-detail-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 商品详情 -->
    <section class="product-detail">
      <div class="container">
        <el-card shadow="hover">
          <div class="product-info-wrapper">
            <div class="product-images">
              <el-image 
                :src="product.mainImage" 
                fit="cover" 
                :preview-src-list="[product.mainImage]" 
                preview-teleported
                style="width: 100%; height: 300px;"
              ></el-image>
            </div>
            <div class="product-details">
              <h2>{{ product.name || '加载中...' }}</h2>
              <div class="product-price">
                <span class="price">{{ product.price || '0' }}</span>
                <span class="original-price" v-if="product.originalPrice">{{ product.originalPrice }}</span>
              </div>
              <div class="product-stats">
                <el-rate 
                  v-model="product.rating" 
                  disabled 
                  show-score
                  :max="5"
                ></el-rate>
                <span class="sales">销量: {{ product.sales || 0 }}</span>
                <span class="stock">库存: {{ product.stock || 0 }}</span>
              </div>
              <div class="product-description">
                <h3>商品描述</h3>
                <p>{{ product.description || '暂无商品描述' }}</p>
              </div>
              <div class="product-actions">
                <div class="quantity-control">
                  <el-input-number 
                    v-model="quantity" 
                    :min="1" 
                    :max="product.stock || 100" 
                    label="数量"
                  ></el-input-number>
                </div>
                <div class="action-buttons">
                  <el-button type="primary" size="large" @click="addToCart">加入购物车</el-button>
                  <el-button type="success" size="large" @click="buyNow">立即购买</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <!-- 页脚 -->
    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell } from '@element-plus/icons-vue'
import productApi from '../api/productApi'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()

// 商品数据
// 初始化为默认值，确保页面渲染时有数据可用
const product = reactive({
  id: 1,
  name: '商品详情',
  price: '0',
  originalPrice: '',
  rating: 0,
  sales: 0,
  stock: 0,
  description: '暂无商品描述',
  mainImage: 'https://picsum.photos/300/300?random=1'
})

// 购买数量
const quantity = ref(1)

// 获取商品详情
  const fetchProductDetail = async () => {
    console.log('开始获取商品详情，当前路由ID:', route.params.id)
    
    // 重置商品数据为初始状态
    Object.assign(product, {
      id: 0,
      name: '',
      price: '',
      originalPrice: '',
      rating: 0,
      sales: 0,
      stock: 0,
      description: '',
      mainImage: ''
    })
    
    try {
      const id = parseInt(route.params.id)
      console.log('解析后的商品ID:', id)
      
      if (isNaN(id)) {
        console.error('无效的商品ID')
        ElMessage.error('无效的商品ID')
        // 即使ID无效，也显示默认数据
        const mockProduct = {
          id: 1,
          name: '商品详情',
          price: '0',
          originalPrice: '',
          rating: 0,
          sales: 0,
          stock: 0,
          description: '暂无商品描述',
          mainImage: 'https://picsum.photos/300/300?random=1'
        }
        Object.assign(product, mockProduct)
        return
      }
      
      // 尝试调用真实API
      console.log('开始调用API获取商品详情')
      const response = await productApi.getProductById(id)
      console.log('API响应:', response)
      
      // 处理响应数据，考虑两种情况：
      // 1. 响应是商品数据本身（axios拦截器直接返回了response.data）
      // 2. 响应是包含code、message、success和data字段的对象（后端标准Response格式）
      let apiProduct = response
      if (response.code !== undefined && response.data !== undefined) {
        // 情况2：响应是后端标准Response格式
        if (response.success === true && response.data) {
          apiProduct = response.data
        } else {
          // API调用失败，使用模拟数据
          console.log('API调用失败或返回错误，使用默认模拟数据')
          // 使用基于商品ID的不同模拟数据，确保点击不同商品显示不同信息
          apiProduct = {
            id: id,
            name: `商品 ${id}`,
            price: (Math.random() * 10000).toFixed(2),
            originalPrice: (Math.random() * 20000).toFixed(2),
            rating: Math.random() * 5 + 3.5,
            sales: Math.floor(Math.random() * 10000),
            stock: Math.floor(Math.random() * 1000),
            description: `这是商品 ${id} 的详细描述，包含商品的各种特性和优势。`,
            mainImage: `https://picsum.photos/300/300?random=${id}`
          }
        }
      }
      
      // 更新商品数据
      Object.assign(product, {
        id: apiProduct.id || id,
        name: apiProduct.name || '未命名商品',
        price: apiProduct.price?.toString() || '0',
        originalPrice: apiProduct.originalPrice?.toString() || '',
        rating: parseFloat(apiProduct.rating) || 0,
        sales: apiProduct.sales || 0,
        stock: apiProduct.stock || 0,
        description: apiProduct.description || '暂无商品描述',
        mainImage: apiProduct.mainImage || 'https://picsum.photos/300/300?random=1'
      })
    } catch (error) {
      console.error('获取商品详情失败:', error)
      ElMessage.error('获取商品详情失败，使用默认数据')
      
      // 显示默认模拟数据
      const mockProduct = {
        id: parseInt(route.params.id) || 1,
        name: '商品详情',
        price: '0',
        originalPrice: '',
        rating: 0,
        sales: 0,
        stock: 0,
        description: '暂无商品描述',
        mainImage: 'https://picsum.photos/300/300?random=1'
      }
      Object.assign(product, mockProduct)
    }
    
    console.log('商品数据获取完成，最终商品数据:', product)
  }

// 加入购物车
const addToCart = async () => {
  try {
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    await cartStore.addToCart(userStore.userInfo.id, product.id, quantity.value)
    ElMessage.success(`已将 ${product.name} 加入购物车`)
  } catch (error) {
    console.error('添加商品到购物车失败:', error)
    ElMessage.error('添加商品到购物车失败，请重试')
  }
}

// 立即购买
const buyNow = () => {
  ElMessage.info(`立即购买 ${product.name}`)
}

// 页面加载时获取商品详情
onMounted(() => {
  fetchProductDetail()
})

// 监听路由参数变化，重新获取数据
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    fetchProductDetail()
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

/* 商品详情 */
.product-detail {
  margin: 40px 0;
}

.product-info-wrapper {
  display: flex;
  gap: 40px;
}

.product-images {
  flex: 1;
}

.product-images .el-image {
  width: 100%;
  height: 500px;
  border-radius: 8px;
}

.product-details {
  flex: 1;
}

.product-details h2 {
  margin: 0 0 20px;
  font-size: 28px;
  color: #333;
}

.product-price {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.price {
  font-size: 32px;
  font-weight: bold;
  color: #f56c6c;
  margin-right: 15px;
}

.original-price {
  font-size: 20px;
  color: #999;
  text-decoration: line-through;
}

.product-stats {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.product-stats .sales, .product-stats .stock {
  color: #666;
  font-size: 16px;
}

.product-description {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.product-description h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #333;
}

.product-description p {
  margin: 0;
  color: #666;
  line-height: 1.8;
}

.product-actions {
  display: flex;
  gap: 30px;
  align-items: center;
}

.quantity-control {
  flex: 0 0 150px;
}

.action-buttons {
  flex: 1;
  display: flex;
  gap: 20px;
}

.action-buttons .el-button {
  flex: 1;
  height: 50px;
  font-size: 18px;
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
  
  .product-info-wrapper {
    flex-direction: column;
    gap: 20px;
  }
  
  .product-images .el-image {
    height: 300px;
  }
  
  .product-actions {
    flex-direction: column;
    gap: 20px;
  }
  
  .quantity-control {
    flex: 1;
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>