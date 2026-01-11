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

      <!-- 图表区域 -->
      <div class="charts-row">
        <!-- 销售趋势图 -->
        <div class="chart-card">
          <h3>近7天销售趋势</h3>
          <div ref="salesChartRef" class="chart-container"></div>
        </div>
        <!-- 订单状态分布 -->
        <div class="chart-card">
          <h3>订单状态分布</h3>
          <div ref="orderPieRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 第二行图表 -->
      <div class="charts-row">
        <!-- 商品分类销量 -->
        <div class="chart-card">
          <h3>商品分类销量TOP5</h3>
          <div ref="categoryBarRef" class="chart-container"></div>
        </div>
        <!-- 今日数据 -->
        <div class="chart-card today-card">
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
            <div class="today-item">
              <span class="today-value">{{ stats.pendingOrders }}</span>
              <span class="today-label">待处理订单</span>
            </div>
            <div class="today-item warning">
              <span class="today-value">{{ stats.lowStockProducts }}</span>
              <span class="today-label">库存预警</span>
            </div>
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
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'
import * as echarts from 'echarts'

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
const allOrders = ref<any[]>([])
const allProducts = ref<any[]>([])

// 图表引用
const salesChartRef = ref<HTMLElement | null>(null)
const orderPieRef = ref<HTMLElement | null>(null)
const categoryBarRef = ref<HTMLElement | null>(null)

let salesChart: echarts.ECharts | null = null
let orderPieChart: echarts.ECharts | null = null
let categoryBarChart: echarts.ECharts | null = null

const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 6: '申请取消中' }[status] || '未知')
const getStatusClass = (status: number) => ({ 0: 'pending', 1: 'processing', 2: 'shipping', 3: 'completed', 4: 'cancelled', 6: 'cancel-requested' }[status] || '')

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`
}

// 初始化销售趋势图
const initSalesChart = () => {
  if (!salesChartRef.value) return
  salesChart = echarts.init(salesChartRef.value)
  
  // 计算近7天数据
  const days: string[] = []
  const salesData: number[] = []
  const orderCountData: number[] = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth()+1}/${date.getDate()}`
    days.push(dateStr)
    
    const dayOrders = allOrders.value.filter(o => {
      const orderDate = new Date(o.createdTime)
      return orderDate.toDateString() === date.toDateString() && o.orderStatus >= 1
    })
    salesData.push(dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))
    orderCountData.push(dayOrders.length)
  }
  
  salesChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['销售额', '订单数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { color: '#666' } },
    yAxis: [
      { type: 'value', name: '销售额', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666', formatter: '¥{value}' } },
      { type: 'value', name: '订单数', axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: '#666' } }
    ],
    series: [
      { name: '销售额', type: 'bar', data: salesData, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#5A8FD4' }, { offset: 1, color: '#9EC5FF' }]), borderRadius: [4, 4, 0, 0] } },
      { name: '订单数', type: 'line', yAxisIndex: 1, data: orderCountData, smooth: true, itemStyle: { color: '#f5a623' }, lineStyle: { width: 3 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(245, 166, 35, 0.3)' }, { offset: 1, color: 'rgba(245, 166, 35, 0.05)' }]) } }
    ]
  })
}

// 初始化订单状态饼图
const initOrderPieChart = () => {
  if (!orderPieRef.value) return
  orderPieChart = echarts.init(orderPieRef.value)
  
  const statusCount = [
    { value: allOrders.value.filter(o => o.orderStatus === 0).length, name: '待付款' },
    { value: allOrders.value.filter(o => o.orderStatus === 1).length, name: '待发货' },
    { value: allOrders.value.filter(o => o.orderStatus === 2).length, name: '待收货' },
    { value: allOrders.value.filter(o => o.orderStatus === 3).length, name: '已完成' },
    { value: allOrders.value.filter(o => o.orderStatus === 4).length, name: '已取消' },
    { value: allOrders.value.filter(o => o.orderStatus === 6).length, name: '申请取消中' }
  ].filter(item => item.value > 0)
  
  orderPieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: statusCount,
      color: ['#ffc107', '#5A8FD4', '#17a2b8', '#28a745', '#dc3545', '#fd7e14']
    }]
  })
}

// 初始化分类销量柱状图
const initCategoryBarChart = () => {
  if (!categoryBarRef.value) return
  categoryBarChart = echarts.init(categoryBarRef.value)
  
  // 统计各分类销量
  const categoryMap = new Map<string, number>()
  allProducts.value.forEach(p => {
    const catName = p.categoryName || '未分类'
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + (p.sales || 0))
  })
  
  const sortedCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  categoryBarChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666' } },
    yAxis: { type: 'category', data: sortedCategories.map(c => c[0]).reverse(), axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { color: '#666' } },
    series: [{
      type: 'bar',
      data: sortedCategories.map(c => c[1]).reverse(),
      itemStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: 20
    }]
  })
}

const fetchStats = async () => {
  try {
    // 获取用户数
    const usersRes: any = await adminApi.getUsers({ page: 0, size: 1 })
    if (usersRes?.code === 200) stats.totalUsers = usersRes.data?.totalElements || 0

    // 获取商品数据
    const productsRes: any = await adminApi.getProducts({ page: 0, size: 1000 })
    if (productsRes?.code === 200) {
      const products = productsRes.data?.content || []
      allProducts.value = products
      stats.totalProducts = productsRes.data?.totalElements || products.length
      stats.lowStockProducts = products.filter((p: any) => p.stock < 10).length
    }

    // 获取订单数据
    const ordersRes: any = await adminApi.getAllOrders({ page: 0, size: 1000 })
    if (ordersRes?.code === 200) {
      const orders = ordersRes.data || []
      allOrders.value = orders
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

    // 初始化图表
    await nextTick()
    initSalesChart()
    initOrderPieChart()
    initCategoryBarChart()
  } catch (e) {
    console.error('获取统计数据失败:', e)
  }
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  salesChart?.resize()
  orderPieChart?.resize()
  categoryBarChart?.resize()
}

onMounted(() => {
  fetchStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  salesChart?.dispose()
  orderPieChart?.dispose()
  categoryBarChart?.dispose()
})
</script>

<style scoped>
.dashboard { max-width: 1400px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
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

/* 图表区域 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0 0 16px;
}

.chart-container {
  height: 280px;
}

/* 今日数据卡片 */
.today-card .today-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  height: 280px;
  align-content: center;
}

.today-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.today-item.warning {
  background: #fff3cd;
}

.today-value {
  font-size: 32px;
  font-weight: 700;
  color: #5A8FD4;
}

.today-item.warning .today-value {
  color: #856404;
}

.today-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

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

.status-tag.cancel-requested { background: #ffe5d0; color: #c35a00; }

.empty {
  text-align: center;
  color: #999;
  padding: 40px !important;
}

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .today-card .today-stats { grid-template-columns: 1fr; }
}
</style>