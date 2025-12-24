<template>
  <div class="orders-container">
    <div class="orders-header">
      <h1>我的订单</h1>
      <p class="orders-subtitle">查看和管理您的所有订单</p>
    </div>
    
    <div class="orders-content">
      <!-- 订单状态筛选 -->
      <el-card class="filter-card">
        <div class="order-filters">
          <el-radio-group v-model="activeFilter" class="filter-tabs">
            <el-radio-button label="all">全部订单</el-radio-button>
            <el-radio-button label="pending">待付款</el-radio-button>
            <el-radio-button label="processing">处理中</el-radio-button>
            <el-radio-button label="shipped">已发货</el-radio-button>
            <el-radio-button label="completed">已完成</el-radio-button>
            <el-radio-button label="cancelled">已取消</el-radio-button>
          </el-radio-group>
          
          <div class="filter-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索订单号或商品名称"
              clearable
              size="small"
              class="search-input"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="small" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </el-card>
      
      <!-- 订单列表 -->
      <div class="orders-list">
        <el-card v-if="orders.length === 0" class="empty-orders-card">
          <el-empty description="暂无订单">
            <el-button type="primary" @click="$router.push('/')">去购物</el-button>
          </el-empty>
        </el-card>
        
        <!-- 订单项 -->
        <el-card v-for="order in orders" :key="order.id" class="order-item-card">
          <div class="order-header-info">
            <div class="order-basic-info">
              <div class="order-id">订单号: {{ order.orderId }}</div>
              <div class="order-date">{{ formatDate(order.createdTime) }}</div>
            </div>
            <div class="order-status">
              <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
            </div>
          </div>
          
          <div class="order-items">
            <div class="order-item" v-for="item in order.items" :key="item.id">
              <div class="item-image">
                <img :src="item.productImage || 'https://placehold.co/80x80'" alt="商品图片" />
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.productName }}</div>
                <div class="item-spec">{{ item.specifications || '标准规格' }}</div>
                <div class="item-price-info">
                  <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
                  <div class="item-quantity">x{{ item.quantity }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-total">
              <div class="total-label">共 {{ order.items.length }} 件商品</div>
              <div class="total-price">合计: <span class="price-value">¥{{ order.totalAmount.toFixed(2) }}</span></div>
            </div>
            
            <div class="order-actions">
              <el-button v-if="order.status === 'pending'" type="danger" size="small" @click="cancelOrder(order.id)">取消订单</el-button>
              <el-button v-if="order.status === 'pending'" type="primary" size="small" @click="payOrder(order.id)">立即付款</el-button>
              <el-button v-if="order.status === 'shipped'" type="success" size="small" @click="confirmReceipt(order.id)">确认收货</el-button>
              <el-button v-if="order.status === 'completed'" type="info" size="small" @click="viewOrderDetails(order.id)">查看详情</el-button>
              <el-button type="text" size="small" @click="viewOrderDetails(order.id)">订单详情</el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 分页 -->
      <div class="pagination" v-if="orders.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalOrders"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// 模拟订单数据
const orders = ref([])
const totalOrders = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const activeFilter = ref('all')
const searchKeyword = ref('')

// 订单状态映射
const statusMap = {
  pending: { text: '待付款', type: 'warning' },
  processing: { text: '处理中', type: 'info' },
  shipped: { text: '已发货', type: 'primary' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'danger' }
}

// 获取状态文本
const getStatusText = (status) => {
  return statusMap[status]?.text || '未知状态'
}

// 获取状态类型
const getStatusType = (status) => {
  return statusMap[status]?.type || 'info'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'  
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 搜索订单
const handleSearch = () => {
  // 实际项目中这里应该调用API搜索订单
  ElMessage.info('搜索功能开发中...')
}

// 取消订单
const cancelOrder = (orderId) => {
  ElMessage.info('取消订单功能开发中...')
}

// 支付订单
const payOrder = (orderId) => {
  ElMessage.info('支付功能开发中...')
}

// 确认收货
const confirmReceipt = (orderId) => {
  ElMessage.info('确认收货功能开发中...')
}

// 查看订单详情
const viewOrderDetails = (orderId) => {
  ElMessage.info('订单详情功能开发中...')
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  // 实际项目中这里应该重新加载数据
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  // 实际项目中这里应该重新加载数据
}

// 组件挂载时初始化订单数据
onMounted(() => {
  // 实际项目中这里应该调用API获取订单数据
  // 这里使用模拟数据
  orders.value = []
  totalOrders.value = 0
})
</script>

<style scoped>
.orders-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.orders-header {
  margin-bottom: 30px;
  text-align: center;
}

.orders-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.orders-subtitle {
  color: #666;
  font-size: 16px;
}

.orders-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.order-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-tabs {
  flex: 1;
  min-width: 300px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 250px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-orders-card {
  text-align: center;
  padding: 60px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.order-item-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.order-item-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.order-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.order-basic-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.order-id {
  font-weight: 500;
  color: #333;
}

.order-date {
  color: #999;
}

.order-status {
  display: flex;
  align-items: center;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.order-item:hover {
  background-color: #f0f9ff;
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-spec {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.item-price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
}

.item-quantity {
  font-size: 14px;
  color: #666;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.order-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 16px;
  color: #333;
}

.price-value {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-tabs {
    min-width: auto;
  }
  
  .search-input {
    width: 100%;
  }
  
  .order-header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .order-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .order-actions {
    justify-content: center;
  }
  
  .order-total {
    align-items: center;
  }
}
</style>