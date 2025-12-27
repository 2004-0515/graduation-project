<template>
  <AdminLayout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">用户</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalUsers }}</span>
            <span class="stat-label">总用户数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon products">商品</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalProducts }}</span>
            <span class="stat-label">商品总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orders">订单</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalOrders }}</span>
            <span class="stat-label">订单总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue">收入</div>
          <div class="stat-info">
            <span class="stat-value">¥{{ stats.totalRevenue.toFixed(2) }}</span>
            <span class="stat-label">总收入</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="section">
        <h3>快捷操作</h3>
        <div class="quick-actions">
          <router-link to="/admin/products" class="action-btn">
            <span class="action-icon">+</span>
            <span>添加商品</span>
          </router-link>
          <router-link to="/admin/categories" class="action-btn">
            <span class="action-icon">+</span>
            <span>添加分类</span>
          </router-link>
          <router-link to="/admin/orders" class="action-btn">
            <span class="action-icon">待</span>
            <span>待处理订单 ({{ stats.pendingOrders }})</span>
          </router-link>
          <router-link to="/admin/products" class="action-btn warning">
            <span class="action-icon">!</span>
            <span>库存预警 ({{ stats.lowStockProducts }})</span>
          </router-link>
        </div>
      </div>

      <!-- 今日数据 -->
      <div class="section">
        <h3>今日数据</h3>
        <div class="today-stats">
          <div class="today-item">
            <span class="today-value">{{ stats.todayOrders }}</span>
            <span class="today-label">今日订单</span>
          </div>
          <div class="today-item">
            <span class="today-value">¥{{ stats.todayRevenue.toFixed(2) }}</span>
            <span class="today-label">今日收入</span>
          </div>
        </div>
      </div>

      <!-- 最近订单 -->
      <div class="section">
        <div class="section-header">
          <h3>最近订单</h3>
          <router-link to="/admin/orders" class="view-all">查看全部</router-link>
        </div>
        <div class="orders-table">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户</th>
                <th>金额</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td>{{ order.orderNo }}</td>
                <td>{{ order.username }}</td>
                <td>¥{{ order.totalAmount?.toFixed(2) }}</td>
                <td><span class="status-tag" :class="getStatusClass(order.orderStatus)">{{ getStatusText(order.orderStatus) }}</span></td>
                <td>{{ formatDate(order.createdTime) }}</td>
              </tr>
              <tr v-if="recentOrders.length === 0">
                <td colspan="5" class="empty">暂无订单数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'

const stats = reactive({
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  todayOrders: 0,
  todayRevenue: 0,
  pendingOrders: 0,
  lowStockProducts: 0
})

const recentOrders = ref<any[]>([])

const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }[status] || '未知')
const getStatusClass = (status: number) => ({ 0: 'pending', 1: 'processing', 2: 'shipping', 3: 'completed', 4: 'cancelled' }[status] || '')

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`
}

const fetchStats = async () => {
  try {
    // 获取用户数
    const usersRes: any = await adminApi.getUsers({ page: 0, size: 1 })
    if (usersRes?.code === 200) stats.totalUsers = usersRes.data?.totalElements || 0

    // 获取商品数
    const productsRes: any = await adminApi.getProducts({ page: 0, size: 1 })
    if (productsRes?.code === 200) stats.totalProducts = productsRes.data?.totalElements || 0

    // 获取订单数据（使用管理员API获取所有订单）
    const ordersRes: any = await adminApi.getAllOrders({ page: 0, size: 100 })
    if (ordersRes?.code === 200) {
      const orders = ordersRes.data || []
      stats.totalOrders = orders.length
      stats.totalRevenue = orders.filter((o: any) => o.orderStatus >= 1).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
      stats.pendingOrders = orders.filter((o: any) => o.orderStatus === 0 || o.orderStatus === 1).length
      
      // 今日数据
      const today = new Date().toDateString()
      const todayOrders = orders.filter((o: any) => new Date(o.createdTime).toDateString() === today)
      stats.todayOrders = todayOrders.length
      stats.todayRevenue = todayOrders.filter((o: any) => o.orderStatus >= 1).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
      
      // 最近订单
      recentOrders.value = orders.slice(0, 5)
    }

    // 低库存商品
    const allProductsRes: any = await adminApi.getProducts({ page: 0, size: 100 })
    if (allProductsRes?.code === 200) {
      const products = allProductsRes.data?.content || []
      stats.lowStockProducts = products.filter((p: any) => p.stock < 10).length
    }
  } catch (e) {
    console.error('获取统计数据失败:', e)
  }
}

onMounted(() => fetchStats())
</script>

<style scoped>
.dashboard { max-width: 1400px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.stat-icon.users { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.products { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.orders { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-icon.revenue { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 28px; font-weight: 700; color: #1a1f36; }
.stat-label { font-size: 14px; color: #666; margin-top: 4px; }

.section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0 0 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 { margin: 0; }

.view-all {
  font-size: 14px;
  color: #5A8FD4;
  text-decoration: none;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #1a1f36;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #e9ecef;
}

.action-btn.warning {
  background: #fff3cd;
  color: #856404;
}

.action-icon {
  width: 32px;
  height: 32px;
  background: #5A8FD4;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.action-btn.warning .action-icon {
  background: #ffc107;
  color: #856404;
}

.today-stats {
  display: flex;
  gap: 48px;
}

.today-item {
  display: flex;
  flex-direction: column;
}

.today-value {
  font-size: 32px;
  font-weight: 700;
  color: #5A8FD4;
}

.today-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.orders-table {
  overflow-x: auto;
}

.orders-table table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.orders-table th {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: #fafafa;
}

.orders-table td {
  font-size: 14px;
  color: #1a1f36;
}

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.pending { background: #fff3cd; color: #856404; }
.status-tag.processing { background: #cce5ff; color: #004085; }
.status-tag.shipping { background: #d4edda; color: #155724; }
.status-tag.completed { background: #d1ecf1; color: #0c5460; }
.status-tag.cancelled { background: #f8d7da; color: #721c24; }

.empty {
  text-align: center;
  color: #999;
  padding: 40px !important;
}

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-actions { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .quick-actions { grid-template-columns: 1fr; }
}
</style>
