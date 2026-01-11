<template>
  <div class="seller-orders-page">
    <Navbar />
    <div class="container">
      <div class="page-header">
        <h1>卖家发货</h1>
        <p class="subtitle">管理您销售商品的订单，及时发货</p>
      </div>

      <!-- 筛选工具栏 -->
      <div class="toolbar">
        <el-radio-group v-model="filterStatus" @change="handleFilterChange">
          <el-radio-button :label="null">全部</el-radio-button>
          <el-radio-button :label="0">
            待发货
            <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
          </el-radio-button>
          <el-radio-button :label="1">已发货</el-radio-button>
        </el-radio-group>
        <span class="total-count">共 {{ orderItems.length }} 条记录</span>
      </div>

      <!-- 订单列表 -->
      <div class="orders-list" v-loading="loading">
        <div v-if="orderItems.length === 0" class="empty-state">
          <el-empty :description="filterStatus === 0 ? '暂无待发货订单' : '暂无订单记录'" />
        </div>

        <div v-else class="order-cards">
          <div v-for="item in orderItems" :key="item.id" class="order-card">
            <div class="card-header">
              <div class="order-info">
                <span class="order-no">订单号: {{ item.orderNo }}</span>
                <span class="buyer">买家: {{ item.buyerName }}</span>
                <span class="order-status-tag" :class="getOrderStatusClass(item.orderStatus)">
                  {{ getOrderStatusText(item.orderStatus) }}
                </span>
              </div>
              <div class="ship-status" :class="item.shipStatus === 1 ? 'shipped' : 'pending'">
                {{ item.shipStatus === 1 ? '已发货' : '待发货' }}
              </div>
            </div>
            
            <div class="card-body">
              <div class="product-info">
                <el-image :src="getImageUrl(item.productImage)" class="product-image" fit="cover">
                  <template #error><div class="img-placeholder">暂无图片</div></template>
                </el-image>
                <div class="product-detail">
                  <h3>{{ item.productName }}</h3>
                  <p class="price-qty">¥{{ item.price }} x {{ item.quantity }}</p>
                  <p class="subtotal">小计: ¥{{ (item.price * item.quantity).toFixed(2) }}</p>
                </div>
              </div>
              
              <div class="address-info" v-if="item.shippingAddress">
                <div class="address-title">收货地址</div>
                <p>{{ formatAddress(item.shippingAddress) }}</p>
              </div>
            </div>

            <div class="card-footer">
              <span class="time">下单时间: {{ formatDate(item.createdTime) }}</span>
              <div class="actions">
                <template v-if="item.shipStatus === 0">
                  <el-button type="primary" @click="handleShip(item)">发货</el-button>
                </template>
                <template v-else>
                  <span class="ship-time">发货时间: {{ formatDate(item.shipTime) }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import axios from '@/utils/axios'
import fileApi from '@/api/fileApi'

const orderItems = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref<number | null>(null)
const pendingCount = ref(0)

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

// 订单状态文本
const getOrderStatusText = (status: number) => {
  const map: Record<number, string> = { 1: '待发货', 2: '待收货', 3: '已完成' }
  return map[status] || ''
}

// 订单状态样式类
const getOrderStatusClass = (status: number) => {
  const map: Record<number, string> = { 1: 'pending', 2: 'shipping', 3: 'completed' }
  return map[status] || ''
}

const formatAddress = (addr: any) => {
  if (!addr) return ''
  return `${addr.name || addr.receiver || ''} ${addr.phone || ''} ${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.detail || ''}`
}

const fetchPendingCount = async () => {
  try {
    const res: any = await axios.get('/orders/seller/pending/count')
    if (res?.code === 200) {
      pendingCount.value = res.data || 0
    }
  } catch (e) { console.error(e) }
}

const fetchOrderItems = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterStatus.value !== null) {
      params.shipStatus = filterStatus.value
    }
    const res: any = await axios.get('/orders/seller/items', { params })
    if (res?.code === 200) {
      orderItems.value = res.data || []
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleFilterChange = () => {
  fetchOrderItems()
}

const handleShip = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要发货商品"${item.productName}"吗？`,
      '确认发货',
      { confirmButtonText: '确定发货', cancelButtonText: '取消', type: 'info' }
    )
    await axios.put(`/orders/seller/items/${item.id}/ship`)
    ElMessage.success('发货成功')
    fetchOrderItems()
    fetchPendingCount()
  } catch {}
}

onMounted(() => {
  fetchOrderItems()
  fetchPendingCount()
})
</script>

<style scoped>
.seller-orders-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 100px 20px 60px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-header .subtitle {
  font-size: 14px;
  color: #666;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.total-count {
  font-size: 14px;
  color: #666;
}

.badge {
  display: inline-block;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  margin-left: 4px;
  font-size: 12px;
  background: #f56c6c;
  color: #fff;
  border-radius: 9px;
}

.orders-list {
  min-height: 400px;
}

.empty-state {
  background: #fff;
  border-radius: 12px;
  padding: 60px 20px;
}

.order-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
  align-items: center;
}

.order-no {
  font-weight: 500;
  color: #333;
}

.order-status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.order-status-tag.pending {
  background: #e6f7ff;
  color: #1890ff;
}

.order-status-tag.shipping {
  background: #fff7e6;
  color: #fa8c16;
}

.order-status-tag.completed {
  background: #f6ffed;
  color: #52c41a;
}

.ship-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.ship-status.pending {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  color: #856404;
}

.ship-status.shipped {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
}

.card-body {
  padding: 20px;
}

.product-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.img-placeholder {
  width: 80px;
  height: 80px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.product-detail h3 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.product-detail .price-qty {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.product-detail .subtotal {
  font-size: 15px;
  font-weight: 600;
  color: #5A8FD4;
}

.address-info {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.address-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.address-info p {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.time {
  font-size: 13px;
  color: #999;
}

.ship-time {
  font-size: 13px;
  color: #52c41a;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-radio-button__inner) {
  border-radius: 20px !important;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 8px;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 20px !important;
}

:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 20px !important;
}
</style>
