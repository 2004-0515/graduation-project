<template>
  <div class="rational-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>理性消费助手</h1>
          <p class="subtitle">帮助您科学管理消费，养成健康的购物习惯</p>
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

        <!-- 预算概览Tab -->
        <div v-show="activeTab === 'budget'" class="tab-content">
          <!-- 预算概览卡片 -->
          <div class="budget-overview glass-card">
            <div class="budget-header">
              <div class="budget-title">
                <h2>本月预算</h2>
                <button class="edit-btn" @click="showBudgetDialog = true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  设置预算
                </button>
              </div>
              <div class="budget-amount">
                <span class="spent">{{ formatMoney(budgetStatus.spent) }}</span>
                <span class="divider">/</span>
                <span class="total">{{ formatMoney(budgetStatus.budget) }}</span>
              </div>
            </div>
            
            <div class="budget-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :class="progressClass"
                  :style="{ width: Math.min(budgetStatus.usedPercent || 0, 100) + '%' }"
                ></div>
              </div>
              <div class="progress-labels">
                <span>已使用 {{ budgetStatus.usedPercent || 0 }}%</span>
                <span>剩余 {{ formatMoney(budgetStatus.remaining) }}</span>
              </div>
            </div>

            <div v-if="budgetStatus.isOverBudget" class="budget-alert danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>本月消费已超出预算，建议控制后续支出</span>
            </div>
            <div v-else-if="budgetStatus.isNearLimit" class="budget-alert warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>预算使用已超过{{ budgetStatus.alertThreshold }}%，请注意控制消费</span>
            </div>
          </div>

          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card glass-card">
              <div class="stat-icon rational">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ report.rationalIndex || 0 }}</span>
                <span class="stat-label">理性消费指数</span>
                <span class="stat-level" :class="rationalLevelClass">{{ report.rationalLevel || '暂无数据' }}</span>
              </div>
            </div>

            <div class="stat-card glass-card">
              <div class="stat-icon orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ report.orderCount || 0 }}</span>
                <span class="stat-label">本月订单数</span>
              </div>
            </div>

            <div class="stat-card glass-card">
              <div class="stat-icon saved">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ formatMoney(report.savedAmount, false) }}</span>
                <span class="stat-label">本月节省</span>
              </div>
            </div>

            <div class="stat-card glass-card">
              <div class="stat-icon blocked">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ report.impulseBlockedCount || 0 }}</span>
                <span class="stat-label">冲动消费拦截</span>
              </div>
            </div>
          </div>

          <!-- 消费趋势图表 -->
          <div class="chart-section glass-card">
            <div class="section-header">
              <h3>消费趋势</h3>
              <div class="trend-change" v-if="report.monthOverMonthChange !== undefined">
                <span :class="report.monthOverMonthChange > 0 ? 'up' : 'down'">
                  {{ report.monthOverMonthChange > 0 ? '+' : '' }}{{ report.monthOverMonthChange }}%
                </span>
                <span class="trend-label">环比上月</span>
              </div>
            </div>
            <div class="chart-container">
              <div class="bar-chart">
                <div 
                  v-for="(item, index) in report.monthlyTrend || []" 
                  :key="index"
                  class="bar-item"
                >
                  <div class="bar-wrapper">
                    <div 
                      class="bar" 
                      :style="{ height: getBarHeight(item.amount) + '%' }"
                      :class="{ current: index === (report.monthlyTrend?.length || 0) - 1 }"
                    >
                      <span class="bar-value">{{ formatMoney(item.amount, false) }}</span>
                    </div>
                  </div>
                  <span class="bar-label">{{ formatMonth(item.month) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 分类消费分布 -->
          <div class="category-section glass-card">
            <div class="section-header">
              <h3>消费分布</h3>
            </div>
            <div class="category-list" v-if="report.categoryDistribution?.length">
              <div 
                v-for="cat in report.categoryDistribution" 
                :key="cat.categoryId"
                class="category-item"
              >
                <div class="cat-info">
                  <span class="cat-name">{{ cat.categoryName }}</span>
                  <span class="cat-percent">{{ cat.percent }}%</span>
                </div>
                <div class="cat-bar">
                  <div class="cat-fill" :style="{ width: cat.percent + '%' }"></div>
                </div>
                <span class="cat-amount">{{ formatMoney(cat.amount) }}</span>
              </div>
            </div>
            <div v-else class="empty-tip">暂无消费数据</div>
          </div>

          <!-- 消费建议 -->
          <div class="suggestions-section glass-card" v-if="report.suggestions?.length">
            <div class="section-header">
              <h3>消费建议</h3>
            </div>
            <div class="suggestions-list">
              <div v-for="(tip, index) in report.suggestions" :key="index" class="suggestion-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span>{{ tip }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 想要清单Tab -->
        <div v-show="activeTab === 'wishlist'" class="tab-content">
          <div class="wishlist-header glass-card">
            <div class="wishlist-intro">
              <h3>延迟满足 - 想要清单</h3>
              <p>将心仪商品加入清单，设置冷静期，避免冲动消费</p>
            </div>
            <div class="wishlist-stats">
              <div class="ws-stat">
                <span class="ws-value">{{ wishlistStats.coolingCount || 0 }}</span>
                <span class="ws-label">冷静中</span>
              </div>
              <div class="ws-stat">
                <span class="ws-value">{{ wishlistStats.readyCount || 0 }}</span>
                <span class="ws-label">可购买</span>
              </div>
              <div class="ws-stat">
                <span class="ws-value">{{ wishlistStats.removedCount || 0 }}</span>
                <span class="ws-label">已放弃</span>
              </div>
            </div>
          </div>

          <div class="wishlist-list" v-if="wishlist.length">
            <div 
              v-for="item in wishlist" 
              :key="item.id"
              class="wishlist-item glass-card"
            >
              <div class="wi-image">
                <img :src="item.productImage || '/placeholder.png'" :alt="item.productName" />
                <div v-if="item.status === 0" class="cooling-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ item.hoursLeft }}小时
                </div>
                <div v-else class="ready-badge">可购买</div>
              </div>
              <div class="wi-info">
                <h4 class="wi-name">{{ item.productName }}</h4>
                <div class="wi-prices">
                  <span class="wi-current">{{ formatMoney(item.currentPrice) }}</span>
                  <span v-if="item.priceDropped" class="wi-dropped">
                    降价 {{ formatMoney(Math.abs(item.priceChange)) }}
                  </span>
                  <span v-else-if="item.priceChange > 0" class="wi-raised">
                    涨价 {{ formatMoney(item.priceChange) }}
                  </span>
                </div>
                <p v-if="item.reason" class="wi-reason">{{ item.reason }}</p>
                <div class="wi-meta">
                  <span>加入时间: {{ formatDate(item.createdTime) }}</span>
                  <span v-if="item.status === 0">冷静期: {{ item.coolingDays }}天</span>
                </div>
              </div>
              <div class="wi-actions">
                <button 
                  v-if="item.status === 1" 
                  class="btn-buy"
                  @click="goToBuy(item.productId)"
                >
                  去购买
                </button>
                <button 
                  class="btn-remove"
                  @click="handleRemoveWishlist(item.id)"
                >
                  {{ item.status === 0 ? '不想要了' : '移除' }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-wishlist glass-card">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <p>想要清单为空</p>
            <span>在商品详情页点击"加入想要清单"，开启理性消费之旅</span>
          </div>
        </div>

        <!-- 成就系统Tab -->
        <div v-show="activeTab === 'achievements'" class="tab-content">
          <div class="achievements-header glass-card">
            <h3>消费成就</h3>
            <p>养成理性消费习惯，解锁专属成就</p>
            <div class="achievement-progress">
              <span>已解锁 {{ earnedCount }}/{{ achievements.length }}</span>
              <div class="ap-bar">
                <div class="ap-fill" :style="{ width: (earnedCount / achievements.length * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="achievements-grid">
            <div 
              v-for="ach in achievements" 
              :key="ach.type"
              :class="['achievement-card glass-card', { earned: ach.earned }]"
            >
              <div class="ach-icon" :class="ach.icon">
                <svg v-if="ach.icon === 'wishlist'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <svg v-else-if="ach.icon === 'clock'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <svg v-else-if="ach.icon === 'x-circle'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <svg v-else-if="ach.icon === 'target'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
                <svg v-else-if="ach.icon === 'star'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
              </div>
              <div class="ach-info">
                <h4>{{ ach.name }}</h4>
                <p>{{ ach.description }}</p>
                <span v-if="ach.earned" class="ach-time">{{ formatDate(ach.earnedTime) }} 达成</span>
                <span v-else class="ach-locked">未解锁</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />

    <!-- 设置预算弹窗 -->
    <el-dialog v-model="showBudgetDialog" title="设置月度预算" width="400px" :close-on-click-modal="false">
      <el-form :model="budgetForm" label-width="100px">
        <el-form-item label="预算金额">
          <el-input-number v-model="budgetForm.amount" :min="100" :max="100000" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-slider v-model="budgetForm.alertThreshold" :min="50" :max="100" :format-tooltip="(val: number) => val + '%'" />
          <span class="threshold-tip">当消费达到预算的{{ budgetForm.alertThreshold }}%时提醒</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBudgetDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBudget" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import rationalApi from '@/api/rationalApi'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const router = useRouter()
const userStore = useUserStore()

const tabs = [
  { key: 'budget', label: '预算概览' },
  { key: 'wishlist', label: '想要清单' },
  { key: 'achievements', label: '消费成就' }
]
const activeTab = ref('budget')

const budgetStatus = ref<any>({})
const report = ref<any>({})
const wishlist = ref<any[]>([])
const wishlistStats = ref<any>({})
const achievements = ref<any[]>([])
const showBudgetDialog = ref(false)
const saving = ref(false)
const budgetForm = ref({
  amount: 2000,
  alertThreshold: 80
})

const progressClass = computed(() => {
  const percent = budgetStatus.value.usedPercent || 0
  if (percent >= 100) return 'danger'
  if (percent >= 80) return 'warning'
  return 'normal'
})

const rationalLevelClass = computed(() => {
  const index = report.value.rationalIndex || 0
  if (index >= 90) return 'excellent'
  if (index >= 75) return 'good'
  if (index >= 60) return 'normal'
  return 'warning'
})

const earnedCount = computed(() => achievements.value.filter(a => a.earned).length)

const formatMoney = (val: number | undefined, showSymbol = true) => {
  if (val === undefined || val === null) return showSymbol ? '¥0.00' : '0'
  return showSymbol ? `¥${val.toFixed(2)}` : val.toFixed(0)
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const getBarHeight = (amount: number) => {
  if (!report.value.monthlyTrend?.length) return 0
  const max = Math.max(...report.value.monthlyTrend.map((t: any) => t.amount || 0))
  if (max === 0) return 0
  return Math.max(10, (amount / max) * 100)
}

const formatMonth = (month: string) => {
  if (!month) return ''
  const parts = month.split('-')
  return parts[1] + '月'
}

const fetchBudgetStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getBudgetStatus()
    if (res?.code === 200) {
      budgetStatus.value = res.data || {}
      budgetForm.value.amount = budgetStatus.value.budget || 2000
      budgetForm.value.alertThreshold = budgetStatus.value.alertThreshold || 80
    }
  } catch (error) {
    console.error('获取预算状态失败:', error)
  }
}

const fetchReport = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getReport()
    if (res?.code === 200) {
      report.value = res.data || {}
    }
  } catch (error) {
    console.error('获取消费报告失败:', error)
  }
}

const fetchWishlist = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getWishlist()
    if (res?.code === 200) {
      wishlist.value = res.data || []
    }
  } catch (error) {
    console.error('获取想要清单失败:', error)
  }
}

const fetchWishlistStats = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getWishlistStats()
    if (res?.code === 200) {
      wishlistStats.value = res.data || {}
    }
  } catch (error) {
    console.error('获取清单统计失败:', error)
  }
}

const fetchAchievements = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await rationalApi.getAchievements()
    if (res?.code === 200) {
      achievements.value = res.data || []
    }
  } catch (error) {
    console.error('获取成就失败:', error)
  }
}

const saveBudget = async () => {
  if (budgetForm.value.amount < 100) {
    ElMessage.warning('预算金额不能低于100元')
    return
  }
  saving.value = true
  try {
    const res: any = await rationalApi.setBudget(budgetForm.value.amount, budgetForm.value.alertThreshold)
    if (res?.code === 200) {
      ElMessage.success('预算设置成功')
      showBudgetDialog.value = false
      fetchBudgetStatus()
    } else {
      ElMessage.error(res?.message || '设置失败')
    }
  } catch (error) {
    ElMessage.error('设置失败')
  } finally {
    saving.value = false
  }
}

const handleRemoveWishlist = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要从想要清单中移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res: any = await rationalApi.removeFromWishlist(id)
    if (res?.code === 200) {
      ElMessage.success('已移除')
      fetchWishlist()
      fetchWishlistStats()
      fetchAchievements()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (e) {
    // 取消
  }
}

const goToBuy = (productId: number) => {
  router.push(`/product/${productId}`)
}

onMounted(() => {
  fetchBudgetStatus()
  fetchReport()
  fetchWishlist()
  fetchWishlistStats()
  fetchAchievements()
})
</script>

<style scoped>
.rational-page { min-height: 100vh; background: var(--white); position: relative; }

.rational-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 8px; }
.page-header .subtitle { font-size: 15px; color: var(--text-muted); margin: 0; }

/* Tab导航 */
.tab-nav { display: flex; gap: 8px; margin-bottom: 24px; background: rgba(255,255,255,0.6); padding: 6px; border-radius: 12px; width: fit-content; }
.tab-btn { padding: 10px 24px; border: none; background: transparent; border-radius: 8px; font-size: 14px; color: var(--text-body); cursor: pointer; transition: all 0.3s; }
.tab-btn:hover { background: rgba(90, 143, 212, 0.1); }
.tab-btn.active { background: #5A8FD4; color: white; }

.glass-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}

/* 预算概览 */
.budget-overview { padding: 28px; }
.budget-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.budget-title { display: flex; align-items: center; gap: 16px; }
.budget-title h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-title); }
.edit-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(90, 143, 212, 0.1); border: none; border-radius: 20px; color: #5A8FD4; font-size: 13px; cursor: pointer; transition: all 0.3s; }
.edit-btn:hover { background: rgba(90, 143, 212, 0.2); }

.budget-amount { text-align: right; }
.budget-amount .spent { font-size: 32px; font-weight: 700; color: #5A8FD4; }
.budget-amount .divider { margin: 0 8px; color: var(--text-muted); font-size: 24px; }
.budget-amount .total { font-size: 20px; color: var(--text-muted); }

.budget-progress { margin-bottom: 16px; }
.progress-bar { height: 12px; background: rgba(200, 220, 255, 0.3); border-radius: 6px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; }
.progress-fill.normal { background: linear-gradient(90deg, #9EC5FF, #5A8FD4); }
.progress-fill.warning { background: linear-gradient(90deg, #f5a623, #f7b84b); }
.progress-fill.danger { background: linear-gradient(90deg, #e74c3c, #c0392b); }

.progress-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: var(--text-muted); }

.budget-alert { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: var(--radius-md); font-size: 14px; margin-top: 16px; }
.budget-alert.warning { background: rgba(245, 166, 35, 0.1); color: #e67e22; border: 1px solid rgba(245, 166, 35, 0.3); }
.budget-alert.danger { background: rgba(231, 76, 60, 0.1); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); }

/* 统计卡片 */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
.stat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.stat-icon.rational { background: linear-gradient(135deg, rgba(90, 143, 212, 0.15), rgba(158, 197, 255, 0.2)); color: #5A8FD4; }
.stat-icon.orders { background: linear-gradient(135deg, rgba(82, 196, 26, 0.15), rgba(115, 209, 61, 0.2)); color: #52c41a; }
.stat-icon.saved { background: linear-gradient(135deg, rgba(245, 166, 35, 0.15), rgba(247, 184, 75, 0.2)); color: #f5a623; }
.stat-icon.blocked { background: linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(192, 57, 43, 0.2)); color: #e74c3c; }

.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 26px; font-weight: 700; color: var(--text-title); line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.stat-level { font-size: 12px; padding: 3px 10px; border-radius: 10px; margin-top: 6px; display: inline-block; }
.stat-level.excellent { background: rgba(82, 196, 26, 0.15); color: #52c41a; }
.stat-level.good { background: rgba(90, 143, 212, 0.15); color: #5A8FD4; }
.stat-level.normal { background: rgba(245, 166, 35, 0.15); color: #f5a623; }
.stat-level.warning { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }

/* 图表区域 */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-header h3 { margin: 0; font-size: 17px; font-weight: 600; color: var(--text-title); }

.trend-change { display: flex; align-items: center; gap: 8px; }
.trend-change .up { color: #e74c3c; font-weight: 600; }
.trend-change .down { color: #52c41a; font-weight: 600; }
.trend-label { font-size: 13px; color: var(--text-muted); }

.chart-container { padding: 20px 0; }
.bar-chart { display: flex; justify-content: space-around; align-items: flex-end; height: 200px; }
.bar-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.bar-wrapper { height: 160px; display: flex; align-items: flex-end; width: 100%; justify-content: center; }
.bar { width: 40px; background: linear-gradient(180deg, #B7D4FF, #9EC5FF); border-radius: 6px 6px 0 0; position: relative; min-height: 20px; transition: height 0.5s ease; }
.bar.current { background: linear-gradient(180deg, #5A8FD4, #7BA8E8); }
.bar-value { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--text-body); white-space: nowrap; }
.bar-label { margin-top: 10px; font-size: 13px; color: var(--text-muted); }

/* 分类消费 */
.category-list { display: flex; flex-direction: column; gap: 16px; }
.category-item { display: grid; grid-template-columns: 120px 1fr 80px; gap: 16px; align-items: center; }
.cat-info { display: flex; justify-content: space-between; }
.cat-name { font-size: 14px; color: var(--text-body); }
.cat-percent { font-size: 13px; color: var(--text-muted); }
.cat-bar { height: 8px; background: rgba(200, 220, 255, 0.3); border-radius: 4px; overflow: hidden; }
.cat-fill { height: 100%; background: linear-gradient(90deg, #9EC5FF, #5A8FD4); border-radius: 4px; }
.cat-amount { font-size: 14px; font-weight: 600; color: #5A8FD4; text-align: right; }

/* 消费建议 */
.suggestions-list { display: flex; flex-direction: column; gap: 12px; }
.suggestion-item { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; background: rgba(230, 242, 255, 0.4); border-radius: var(--radius-md); font-size: 14px; color: var(--text-body); }
.suggestion-item svg { color: #5A8FD4; flex-shrink: 0; margin-top: 2px; }

.empty-tip { text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px; }
.threshold-tip { display: block; font-size: 12px; color: var(--text-muted); margin-top: 8px; }

/* 想要清单 */
.wishlist-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.wishlist-intro h3 { margin: 0 0 8px; font-size: 18px; color: var(--text-title); }
.wishlist-intro p { margin: 0; font-size: 14px; color: var(--text-muted); }
.wishlist-stats { display: flex; gap: 32px; }
.ws-stat { text-align: center; }
.ws-value { display: block; font-size: 28px; font-weight: 700; color: #5A8FD4; }
.ws-label { font-size: 13px; color: var(--text-muted); }

.wishlist-item { display: flex; gap: 20px; align-items: center; }
.wi-image { position: relative; width: 100px; height: 100px; flex-shrink: 0; }
.wi-image img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
.cooling-badge, .ready-badge { position: absolute; bottom: 6px; left: 6px; padding: 4px 8px; border-radius: 12px; font-size: 11px; display: flex; align-items: center; gap: 4px; }
.cooling-badge { background: rgba(245, 166, 35, 0.9); color: white; }
.ready-badge { background: rgba(82, 196, 26, 0.9); color: white; }

.wi-info { flex: 1; min-width: 0; }
.wi-name { margin: 0 0 8px; font-size: 15px; font-weight: 500; color: var(--text-title); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wi-prices { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.wi-current { font-size: 18px; font-weight: 600; color: #5A8FD4; }
.wi-dropped { font-size: 12px; padding: 2px 8px; background: rgba(82, 196, 26, 0.15); color: #52c41a; border-radius: 10px; }
.wi-raised { font-size: 12px; padding: 2px 8px; background: rgba(231, 76, 60, 0.15); color: #e74c3c; border-radius: 10px; }
.wi-reason { margin: 0 0 8px; font-size: 13px; color: var(--text-muted); font-style: italic; }
.wi-meta { font-size: 12px; color: var(--text-muted); display: flex; gap: 16px; }

.wi-actions { display: flex; flex-direction: column; gap: 8px; }
.btn-buy { padding: 10px 24px; background: #5A8FD4; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn-buy:hover { background: #4a7fc4; }
.btn-remove { padding: 10px 24px; background: transparent; color: var(--text-muted); border: 1px solid rgba(200, 220, 255, 0.5); border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn-remove:hover { border-color: #e74c3c; color: #e74c3c; }

.empty-wishlist { text-align: center; padding: 60px 20px; }
.empty-wishlist svg { color: #B7D4FF; margin-bottom: 16px; }
.empty-wishlist p { margin: 0 0 8px; font-size: 16px; color: var(--text-title); }
.empty-wishlist span { font-size: 14px; color: var(--text-muted); }

/* 成就系统 */
.achievements-header { text-align: center; padding: 32px; }
.achievements-header h3 { margin: 0 0 8px; font-size: 20px; color: var(--text-title); }
.achievements-header p { margin: 0 0 20px; font-size: 14px; color: var(--text-muted); }
.achievement-progress { max-width: 300px; margin: 0 auto; }
.achievement-progress span { display: block; font-size: 13px; color: var(--text-body); margin-bottom: 8px; }
.ap-bar { height: 8px; background: rgba(200, 220, 255, 0.3); border-radius: 4px; overflow: hidden; }
.ap-fill { height: 100%; background: linear-gradient(90deg, #9EC5FF, #5A8FD4); border-radius: 4px; transition: width 0.5s; }

.achievements-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.achievement-card { display: flex; gap: 16px; align-items: center; padding: 20px; opacity: 0.5; transition: all 0.3s; }
.achievement-card.earned { opacity: 1; }
.ach-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(200, 220, 255, 0.3); color: var(--text-muted); }
.achievement-card.earned .ach-icon { background: linear-gradient(135deg, rgba(90, 143, 212, 0.2), rgba(158, 197, 255, 0.3)); color: #5A8FD4; }
.ach-info h4 { margin: 0 0 4px; font-size: 15px; color: var(--text-title); }
.ach-info p { margin: 0 0 6px; font-size: 13px; color: var(--text-muted); }
.ach-time { font-size: 12px; color: #52c41a; }
.ach-locked { font-size: 12px; color: var(--text-muted); }

@media (max-width: 1000px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .achievements-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 700px) {
  .stats-grid { grid-template-columns: 1fr; }
  .achievements-grid { grid-template-columns: 1fr; }
  .budget-header { flex-direction: column; gap: 16px; }
  .budget-amount { text-align: left; }
  .category-item { grid-template-columns: 1fr; gap: 8px; }
  .wishlist-item { flex-direction: column; text-align: center; }
  .wi-actions { flex-direction: row; }
  .tab-nav { width: 100%; justify-content: center; }
}
</style>
