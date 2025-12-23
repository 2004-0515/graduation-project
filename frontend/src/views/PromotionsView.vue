<template>
  <div class="promotions-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 促销活动内容 -->
    <main class="promotions-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>促销活动</h2>
          <p>最新促销活动，限时特惠</p>
        </div>

        <!-- 活动分类标签 -->
        <div class="promotion-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange" type="card">
            <el-tab-pane label="全部活动" name="all">
              <!-- 全部活动内容 -->
            </el-tab-pane>
            <el-tab-pane label="限时特惠" name="flash-sale">
              <!-- 限时特惠内容 -->
            </el-tab-pane>
            <el-tab-pane label="满减活动" name="discount">
              <!-- 满减活动内容 -->
            </el-tab-pane>
            <el-tab-pane label="新品上市" name="new-arrival">
              <!-- 新品上市内容 -->
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 促销活动列表 -->
        <div class="promotions-list">
          <div class="promotion-card" v-for="promotion in promotions" :key="promotion.id">
            <el-card shadow="hover" class="promotion-item">
              <div class="promotion-content">
                <div class="promotion-banner">
                  <el-image 
                    :src="promotion.bannerImage" 
                    fit="cover" 
                    class="promotion-image"
                  ></el-image>
                </div>
                <div class="promotion-info">
                  <div class="promotion-header">
                    <h3>{{ promotion.title }}</h3>
                    <el-tag :type="promotion.tagType" size="large">{{ promotion.tag }}</el-tag>
                  </div>
                  <p class="promotion-description">{{ promotion.description }}</p>
                  <div class="promotion-details">
                    <div class="promotion-time">
                      <el-icon class="time-icon"><Timer /></el-icon>
                      <span>{{ promotion.startTime }} - {{ promotion.endTime }}</span>
                    </div>
                    <div class="promotion-status">
                      <el-badge :value="promotion.status" :type="promotion.status === '进行中' ? 'success' : 'warning'">
                        {{ promotion.status }}
                      </el-badge>
                    </div>
                  </div>
                  <div class="promotion-actions">
                    <el-button type="primary" size="large" @click="viewPromotionDetails(promotion)">查看详情</el-button>
                  </div>
                </div>
              </div>
              
              <!-- 关联商品 -->
              <div class="related-products">
                <h4>关联商品</h4>
                <div class="product-list">
                  <div class="related-product" v-for="product in promotion.relatedProducts" :key="product.id">
                    <el-image 
                      :src="product.mainImage" 
                      fit="cover" 
                      @click="$router.push(`/product/${product.id}`)" 
                      preview-teleported
                      class="related-product-image"
                    ></el-image>
                    <p class="related-product-name">{{ product.name }}</p>
                    <div class="related-product-price">
                      <span class="price">{{ product.price }}</span>
                      <span class="original-price" v-if="product.originalPrice">{{ product.originalPrice }}</span>
                    </div>
                  </div>
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
            total-text="共 {total} 个活动"
          ></el-pagination>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell, Timer } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()

// 活动分类标签
const activeTab = ref('all')

// 分页信息
const currentPage = ref(1)
const pageSize = ref(6)

// 促销活动列表
const promotions = reactive([
  // 模拟数据
  {
    id: 1,
    title: '双11全球狂欢节',
    description: '全场商品低至5折，满1000减200，上不封顶',
    tag: '双11',
    tagType: 'danger',
    startTime: '2025-11-01',
    endTime: '2025-11-11',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=31',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  {
    id: 2,
    title: '618年中盛典',
    description: '年中大促，全场商品8折起，满300减50',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-06-01',
    endTime: '2025-06-18',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=32',
    relatedProducts: [
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' }
    ]
  },
  {
    id: 3,
    title: '新年特惠',
    description: '新年新气象，全场商品满500减100，满1000减250',
    tag: '新年',
    tagType: 'success',
    startTime: '2025-01-01',
    endTime: '2025-01-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=33',
    relatedProducts: [
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' }
    ]
  },
  {
    id: 4,
    title: '春季新品上市',
    description: '春季新品首发，全场新品8.5折，限时一周',
    tag: '新品',
    tagType: 'warning',
    startTime: '2025-03-01',
    endTime: '2025-03-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=34',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 5,
    title: '夏日清凉特卖',
    description: '夏日清凉商品大促销，家电类商品满2000减300',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-07-01',
    endTime: '2025-07-31',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=35',
    relatedProducts: [
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 6,
    title: '会员专享日',
    description: '会员专享8折优惠，新用户注册即送100元优惠券',
    tag: '会员',
    tagType: 'success',
    startTime: '2025-05-15',
    endTime: '2025-05-16',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=36',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  }
])

// 计算总活动数
const total = computed(() => {
  return promotions.length
})

// 标签页切换
const handleTabChange = (tab) => {
  currentPage.value = 1
  // 实际项目中这里应该根据标签页类型重新调用API获取数据
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

// 查看活动详情
const viewPromotionDetails = (promotion) => {
  ElMessage.info(`查看活动详情: ${promotion.title}`)
  // 实际项目中这里应该跳转到活动详情页
}
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

/* 促销活动内容 */
.promotions-content {
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

/* 活动分类标签 */
.promotion-tabs {
  margin-bottom: 30px;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 促销活动列表 */
.promotions-list {
  margin-bottom: 30px;
}

.promotion-card {
  margin-bottom: 20px;
}

.promotion-item {
  transition: transform 0.3s;
}

.promotion-item:hover {
  transform: translateY(-5px);
}

.promotion-content {
  display: flex;
  flex-direction: column;
}

.promotion-banner {
  margin-bottom: 20px;
}

.promotion-image {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  transition: transform 0.3s;
}

.promotion-image:hover {
  transform: scale(1.01);
}

.promotion-info {
  padding: 0 10px;
}

.promotion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.promotion-header h3 {
  margin: 0;
  font-size: 24px;
  color: #333;
  flex: 1;
}

.promotion-description {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.promotion-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.promotion-status {
  display: flex;
  align-items: center;
}

.promotion-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

/* 关联商品 */
.related-products {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.related-products h4 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #333;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.related-product {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.related-product:hover {
  transform: translateY(-3px);
}

.related-product-image {
  width: 100%;
  height: 150px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.related-product-name {
  margin: 0 0 8px;
  font-size: 14px;
  color: #333;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.related-product-price {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.related-product-price .price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.related-product-price .original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
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
  
  .promotion-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .promotion-details {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-list {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .related-product-image {
    height: 120px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>