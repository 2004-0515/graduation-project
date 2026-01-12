<template>
  <AdminLayout>
    <div class="rational-manage">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon wishlist">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalWishlistItems || 0 }}</span>
            <span class="stat-label">想要清单总数</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon cooling">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.coolingItems || 0 }}</span>
            <span class="stat-label">冷静期中</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon conversion">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.wishlistConversionRate || 0 }}%</span>
            <span class="stat-label">冷静期转化率</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon budget">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.usersWithBudget || 0 }}</span>
            <span class="stat-label">设置预算用户</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon achievement">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalAchievementsGranted || 0 }}</span>
            <span class="stat-label">成就发放总数</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon users">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.usersWithAchievements || 0 }}</span>
            <span class="stat-label">获得成就用户</span>
          </div>
        </div>
      </div>

      <!-- Tab切换 -->
      <div class="tab-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 消费趋势 -->
      <div v-show="activeTab === 'trend'" class="content-section">
        <div class="section-card">
          <div class="section-header">
            <h3>全站消费趋势（近6个月）</h3>
          </div>
          <div class="chart-container">
            <div ref="trendChartRef" class="trend-chart"></div>
          </div>
          <div class="trend-table">
            <table>
              <thead>
                <tr>
                  <th>月份</th>
                  <th>消费总额</th>
                  <th>订单数</th>
                  <th>设置预算用户</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in consumptionTrend" :key="item.month">
                  <td>{{ item.month }}</td>
                  <td class="amount">¥{{ formatMoney(item.totalAmount) }}</td>
                  <td>{{ item.orderCount }}</td>
                  <td>{{ item.budgetUsers }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 想要清单活动 -->
      <div v-show="activeTab === 'wishlist'" class="content-section">
        <div class="section-card">
          <div class="section-header">
            <h3>最近想要清单活动</h3>
            <div class="wishlist-summary">
              <span class="summary-item">
                <span class="dot cooling"></span>冷静中: {{ stats.coolingItems || 0 }}
              </span>
              <span class="summary-item">
                <span class="dot purchased"></span>已购买: {{ stats.purchasedFromWishlist || 0 }}
              </span>
              <span class="summary-item">
                <span class="dot removed"></span>已放弃: {{ stats.removedFromWishlist || 0 }}
              </span>
            </div>
          </div>
          <div class="activity-list">
            <div v-for="item in wishlistActivity" :key="item.id" class="activity-item">
              <img :src="getImageUrl(item.productImage)" class="product-img" @error="imgErr" />
              <div class="activity-info">
                <div class="activity-main">
                  <span class="username">{{ item.username }}</span>
                  <span class="action">将</span>
                  <span class="product-name">{{ item.productName }}</span>
                  <span class="action">加入想要清单</span>
                </div>
                <div class="activity-meta">
                  <span :class="['status-tag', getStatusClass(item.status)]">{{ item.statusName }}</span>
                  <span class="cooling-days" v-if="item.coolingDays">冷静期{{ item.coolingDays }}天</span>
                  <span class="time">{{ formatTime(item.createdTime) }}</span>
                </div>
              </div>
              <span class="price">¥{{ item.productPrice }}</span>
            </div>
            <div v-if="wishlistActivity.length === 0" class="empty-tip">暂无想要清单活动</div>
          </div>
        </div>
      </div>

      <!-- 成就管理 -->
      <div v-show="activeTab === 'achievements'" class="content-section">
        <div class="section-card">
          <div class="section-header">
            <h3>成就发放统计</h3>
          </div>
          <div class="achievement-stats">
            <div 
              v-for="(count, type) in stats.achievementDistribution" 
              :key="type"
              class="achievement-stat-item"
            >
              <span class="ach-name">{{ getAchievementName(type) }}</span>
              <div class="ach-bar">
                <div class="ach-fill" :style="{ width: getAchievementPercent(count) + '%' }"></div>
              </div>
              <span class="ach-count">{{ count }}人</span>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>最近获得成就</h3>
          </div>
          <div class="achievement-list">
            <div v-for="item in recentAchievements" :key="item.id" class="achievement-item">
              <div class="ach-icon" :class="getAchievementIcon(item.type)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
              </div>
              <div class="ach-info">
                <span class="ach-title">{{ item.name }}</span>
                <span class="ach-user">{{ item.username }}</span>
              </div>
              <span class="ach-time">{{ formatTime(item.achievedTime) }}</span>
              <button class="revoke-btn" @click="handleRevokeAchievement(item)">撤销</button>
            </div>
            <div v-if="recentAchievements.length === 0" class="empty-tip">暂无成就记录</div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>手动授予成就</h3>
          </div>
          <div class="grant-form">
            <el-form :inline="true">
              <el-form-item label="用户ID">
                <el-input-number v-model="grantForm.userId" :min="1" placeholder="输入用户ID" />
              </el-form-item>
              <el-form-item label="成就类型">
                <el-select v-model="grantForm.type" placeholder="选择成就">
                  <el-option 
                    v-for="ach in achievementTypes" 
                    :key="ach.type" 
                    :label="ach.name" 
                    :value="ach.type" 
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleGrantAchievement" :loading="granting">授予成就</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import AdminLayout from '@/components/AdminLayout.vue'
import rationalApi from '@/api/rationalApi'
import fileApi from '@/api/fileApi'

const tabs = [
  { key: 'trend', label: '消费趋势' },
  { key: 'wishlist', label: '想要清单' },
  { key: 'achievements', label: '成就管理' }
]
const activeTab = ref('trend')

const stats = ref<any>({})
const consumptionTrend = ref<any[]>([])
const wishlistActivity = ref<any[]>([])
const recentAchievements = ref<any[]>([])

const trendChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null

const grantForm = ref({ userId: null as number | null, type: '' })
const granting = ref(false)

const achievementTypes = [
  { type: 'FIRST_WISHLIST', name: '理性第一步' },
  { type: 'DELAYED_GRATIFICATION_3', name: '延迟满足达人' },
  { type: 'RATIONAL_GIVEUP_5', name: '理性放弃者' },
  { type: 'BUDGET_MASTER', name: '预算大师' },
  { type: 'SAVING_STAR', name: '节约之星' },
  { type: 'RATIONAL_100', name: '理性消费达人' }
]

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const imgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect fill="#f0f0f0" width="48" height="48"/></svg>')
}

const formatMoney = (val: number) => {
  if (!val) return '0.00'
  return Number(val).toFixed(2)
}

const formatTime = (time: string) => {
  if (!time) return ''
  return time.substring(0, 16).replace('T', ' ')
}

const getStatusClass = (status: number) => {
  const classes: Record<number, string> = { 0: 'cooling', 1: 'ready', 2: 'purchased', 3: 'removed' }
  return classes[status] || ''
}

const getAchievementName = (type: string) => {
  const names: Record<string, string> = {
    'FIRST_WISHLIST': '理性第一步',
    'DELAYED_GRATIFICATION_3': '延迟满足达人',
    'RATIONAL_GIVEUP_5': '理性放弃者',
    'BUDGET_MASTER': '预算大师',
    'SAVING_STAR': '节约之星',
    'RATIONAL_100': '理性消费达人'
  }
  return names[type] || type
}

const getAchievementIcon = (type: string) => {
  const icons: Record<string, string> = {
    'FIRST_WISHLIST': 'wishlist',
    'DELAYED_GRATIFICATION_3': 'clock',
    'RATIONAL_GIVEUP_5': 'x-circle',
    'BUDGET_MASTER': 'target',
    'SAVING_STAR': 'star',
    'RATIONAL_100': 'award'
  }
  return icons[type] || 'award'
}

const getAchievementPercent = (count: number) => {
  const total = stats.value.totalAchievementsGranted || 1
  return Math.min(100, (count / total) * 100)
}

const fetchStats = async () => {
  try {
    const res: any = await rationalApi.getAdminStats()
    if (res?.code === 200) {
      stats.value = res.data || {}
    }
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

const fetchConsumptionTrend = async () => {
  try {
    const res: any = await rationalApi.getConsumptionTrend()
    if (res?.code === 200) {
      consumptionTrend.value = res.data || []
      nextTick(() => initTrendChart())
    }
  } catch (e) {
    console.error('获取消费趋势失败', e)
  }
}

const fetchWishlistActivity = async () => {
  try {
    const res: any = await rationalApi.getWishlistActivity()
    if (res?.code === 200) {
      wishlistActivity.value = res.data || []
    }
  } catch (e) {
    console.error('获取想要清单活动失败', e)
  }
}

const fetchRecentAchievements = async () => {
  try {
    const res: any = await rationalApi.getRecentAchievements()
    if (res?.code === 200) {
      recentAchievements.value = res.data || []
    }
  } catch (e) {
    console.error('获取成就记录失败', e)
  }
}

const initTrendChart = () => {
  if (!trendChartRef.value || consumptionTrend.value.length === 0) return
  
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)
  
  const months = consumptionTrend.value.map(t => t.month)
  const amounts = consumptionTrend.value.map(t => t.totalAmount || 0)
  const orders = consumptionTrend.value.map(t => t.orderCount || 0)
  
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['消费总额', '订单数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: [
      { type: 'value', name: '金额(元)', position: 'left' },
      { type: 'value', name: '订单数', position: 'right' }
    ],
    series: [
      {
        name: '消费总额',
        type: 'bar',
        data: amounts,
        itemStyle: { color: '#5A8FD4' }
      },
      {
        name: '订单数',
        type: 'line',
        yAxisIndex: 1,
        data: orders,
        itemStyle: { color: '#52c41a' }
      }
    ]
  }
  
  trendChart.setOption(option)
}

const handleGrantAchievement = async () => {
  if (!grantForm.value.userId || !grantForm.value.type) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  granting.value = true
  try {
    const res: any = await rationalApi.grantAchievement(grantForm.value.userId, grantForm.value.type)
    if (res?.code === 200) {
      ElMessage.success('成就授予成功')
      grantForm.value = { userId: null, type: '' }
      fetchStats()
      fetchRecentAchievements()
    } else {
      ElMessage.error(res?.message || '授予失败')
    }
  } catch (e) {
    ElMessage.error('授予失败')
  } finally {
    granting.value = false
  }
}

const handleRevokeAchievement = async (item: any) => {
  try {
    await ElMessageBox.confirm(`确定要撤销用户 ${item.username} 的成就"${item.name}"吗？`, '确认撤销', { type: 'warning' })
    const res: any = await rationalApi.revokeAchievement(item.userId, item.type)
    if (res?.code === 200) {
      ElMessage.success('成就已撤销')
      fetchStats()
      fetchRecentAchievements()
    } else {
      ElMessage.error(res?.message || '撤销失败')
    }
  } catch (e) {
    // 取消
  }
}

watch(activeTab, (tab) => {
  if (tab === 'trend') {
    nextTick(() => initTrendChart())
  } else if (tab === 'wishlist') {
    fetchWishlistActivity()
  } else if (tab === 'achievements') {
    fetchRecentAchievements()
  }
})

onMounted(() => {
  fetchStats()
  fetchConsumptionTrend()
  fetchWishlistActivity()
  fetchRecentAchievements()
  
  window.addEventListener('resize', () => trendChart?.resize())
})
</script>


<style scoped>
.rational-manage { max-width: 100%; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.wishlist { background: rgba(90, 143, 212, 0.15); color: #5A8FD4; }
.stat-icon.cooling { background: rgba(245, 166, 35, 0.15); color: #f5a623; }
.stat-icon.conversion { background: rgba(82, 196, 26, 0.15); color: #52c41a; }
.stat-icon.budget { background: rgba(114, 46, 209, 0.15); color: #722ed1; }
.stat-icon.achievement { background: rgba(250, 173, 20, 0.15); color: #faad14; }
.stat-icon.users { background: rgba(24, 144, 255, 0.15); color: #1890ff; }

.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: #1a1f36; }
.stat-label { font-size: 13px; color: #666; margin-top: 4px; }

.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #fff;
  padding: 6px;
  border-radius: 10px;
  width: fit-content;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover { background: rgba(90, 143, 212, 0.1); }
.tab-btn.active { background: #5A8FD4; color: white; }

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1f36;
}

.chart-container { height: 300px; margin-bottom: 20px; }
.trend-chart { width: 100%; height: 100%; }

.trend-table table {
  width: 100%;
  border-collapse: collapse;
}

.trend-table th, .trend-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.trend-table th {
  background: #fafafa;
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

.trend-table td { font-size: 14px; color: #333; }
.trend-table td.amount { color: #5A8FD4; font-weight: 600; }

.wishlist-summary {
  display: flex;
  gap: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.cooling { background: #f5a623; }
.dot.purchased { background: #52c41a; }
.dot.removed { background: #999; }

.activity-list { display: flex; flex-direction: column; gap: 12px; }

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
}

.product-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.activity-info { flex: 1; }

.activity-main {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.username { font-weight: 600; color: #5A8FD4; }
.action { color: #666; margin: 0 4px; }
.product-name { font-weight: 500; }

.activity-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.status-tag.cooling { background: rgba(245, 166, 35, 0.15); color: #f5a623; }
.status-tag.ready { background: rgba(82, 196, 26, 0.15); color: #52c41a; }
.status-tag.purchased { background: rgba(90, 143, 212, 0.15); color: #5A8FD4; }
.status-tag.removed { background: rgba(153, 153, 153, 0.15); color: #999; }

.cooling-days { color: #999; }
.time { color: #999; }
.price { font-size: 16px; font-weight: 600; color: #5A8FD4; }

.achievement-stats { display: flex; flex-direction: column; gap: 16px; }

.achievement-stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ach-name {
  width: 120px;
  font-size: 14px;
  color: #333;
}

.ach-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.ach-fill {
  height: 100%;
  background: linear-gradient(90deg, #5A8FD4, #7BA8E8);
  border-radius: 10px;
  transition: width 0.5s;
}

.ach-count {
  width: 60px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #5A8FD4;
}

.achievement-list { display: flex; flex-direction: column; gap: 12px; }

.achievement-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 10px;
}

.ach-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(90, 143, 212, 0.15);
  color: #5A8FD4;
}

.ach-info { flex: 1; }
.ach-title { display: block; font-size: 14px; font-weight: 500; color: #333; }
.ach-user { display: block; font-size: 12px; color: #666; margin-top: 2px; }
.ach-time { font-size: 12px; color: #999; }

.revoke-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.revoke-btn:hover {
  background: #e74c3c;
  color: #fff;
}

.grant-form {
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

@media (max-width: 1400px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
