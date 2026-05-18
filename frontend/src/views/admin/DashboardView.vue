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
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { graphic, init, type ECharts } from 'echarts/core'
import { debugError } from '@/utils/debug'

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

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
const dashboardData = ref<any>(null)

// 图表引用
const salesChartRef = ref<HTMLElement | null>(null)
const orderPieRef = ref<HTMLElement | null>(null)
const categoryBarRef = ref<HTMLElement | null>(null)

let salesChart: ECharts | null = null
let orderPieChart: ECharts | null = null
let categoryBarChart: ECharts | null = null
let latestStatsRequestId = 0
const getResponseMessage = (res: any, fallback: string) => res?.message || fallback

const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '申请取消中' }[status] || '未知')
const getStatusClass = (status: number) => ({ 0: 'pending', 1: 'processing', 2: 'shipping', 3: 'completed', 4: 'cancelled', 5: 'refunding', 6: 'cancel-requested' }[status] || '')

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`
}

// 初始化销售趋势图
const initSalesChart = () => {
  if (!salesChartRef.value) return
  salesChart = init(salesChartRef.value)
  
  const trend = dashboardData.value?.salesTrend || []
  const days = trend.map((item: any) => {
    const date = new Date(item.date)
    return `${date.getMonth()+1}/${date.getDate()}`
  })
  const salesData = trend.map((item: any) => Number(item.revenue || 0))
  const orderCountData = trend.map((item: any) => Number(item.orderCount || 0))
  
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
      { name: '销售额', type: 'bar', data: salesData, itemStyle: { color: new graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#9b87f5' }, { offset: 1, color: 'rgba(155, 135, 245, 0.6)' }]), borderRadius: [4, 4, 0, 0] } },
      { name: '订单数', type: 'line', yAxisIndex: 1, data: orderCountData, smooth: true, itemStyle: { color: '#f5a623' }, lineStyle: { width: 3 }, areaStyle: { color: new graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(245, 166, 35, 0.3)' }, { offset: 1, color: 'rgba(245, 166, 35, 0.05)' }]) } }
    ]
  })
}

// 初始化订单状态饼图
const initOrderPieChart = () => {
  if (!orderPieRef.value) return
  orderPieChart = init(orderPieRef.value)
  
  const statusCount = (dashboardData.value?.orderStatusDistribution || [])
    .map((item: any) => ({
      value: Number(item.count || 0),
      name: getStatusText(Number(item.status))
    }))
    .filter((item: any) => item.value > 0)
  
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
      color: ['#ffc107', '#9b87f5', '#17a2b8', '#28a745', '#dc3545', '#fd7e14']
    }]
  })
}

// 初始化分类销量柱状图
const initCategoryBarChart = () => {
  if (!categoryBarRef.value) return
  categoryBarChart = init(categoryBarRef.value)
  
  const sortedCategories: Array<[string, number]> = (dashboardData.value?.topCategories || [])
    .map((item: any) => [item.categoryName, Number(item.sales || 0)] as [string, number])
  
  categoryBarChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666' } },
    yAxis: { type: 'category', data: sortedCategories.map(c => c[0]).reverse(), axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { color: '#666' } },
    series: [{
      type: 'bar',
      data: sortedCategories.map(c => c[1]).reverse(),
      itemStyle: { 
        color: new graphic.LinearGradient(0, 0, 1, 0, [
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
  const requestId = ++latestStatsRequestId
  try {
    const statsRes: any = await adminApi.getDashboardStats()
    if (requestId !== latestStatsRequestId) {
      return
    }
    if (statsRes?.code === 200) {
      dashboardData.value = statsRes.data || {}
      stats.totalUsers = Number(statsRes.data?.totalUsers || 0)
      stats.totalProducts = Number(statsRes.data?.totalProducts || 0)
      stats.totalOrders = Number(statsRes.data?.totalOrders || 0)
      stats.totalRevenue = Number(statsRes.data?.totalRevenue || 0)
      stats.todayOrders = Number(statsRes.data?.todayOrders || 0)
      stats.todayRevenue = Number(statsRes.data?.todayRevenue || 0)
      stats.pendingOrders = Number(statsRes.data?.pendingOrders || 0)
      stats.lowStockProducts = Number(statsRes.data?.lowStockProducts || 0)
      recentOrders.value = statsRes.data?.recentOrders || []
    } else {
      debugError('获取仪表盘统计失败:', getResponseMessage(statsRes, '业务返回异常'))
    }

    if (requestId !== latestStatsRequestId) {
      return
    }
    await nextTick()
    initSalesChart()
    initOrderPieChart()
    initCategoryBarChart()
  } catch (e) {
    if (requestId !== latestStatsRequestId) {
      return
    }
    debugError('获取仪表盘统计数据失败:', e)
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
  color: var(--primary);
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
  color: var(--primary);
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
