<template>
  <div class="alerts-page">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <div class="header-left">
            <button class="back-btn" @click="$router.back()">
              <span>&larr;</span>
              <span>返回</span>
            </button>
            <h1>我的降价提醒</h1>
          </div>
          <p>当商品降价到目标价格时，我们会通知您</p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-num">{{ alerts.length }}</span>
            <span class="stat-label">全部提醒</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ activeCount }}</span>
            <span class="stat-label">监控中</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ triggeredCount }}</span>
            <span class="stat-label">已触发</span>
          </div>
        </div>

        <!-- 提醒列表 -->
        <div class="alerts-card">
          <div class="card-header">
            <div class="tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.value"
                :class="['tab-btn', { active: activeTab === tab.value }]"
                @click="activeTab = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="alerts-list" v-loading="loading">
            <template v-if="filteredAlerts.length > 0">
              <div 
                v-for="alert in filteredAlerts" 
                :key="alert.id"
                :class="['alert-item', getStatusClass(alert.status)]"
              >
                <div class="product-info" @click="goToProduct(alert.productId)">
                  <div class="product-image">
                    <img :src="getImageUrl(alert.productImage)" @error="imgErr" />
                  </div>
                  <div class="product-detail">
                    <h4>{{ alert.productName || `商品${alert.productId}` }}</h4>
                    <div class="price-info">
                      <span class="current-price">当前 ¥{{ alert.productPrice || alert.currentPrice }}</span>
                      <span class="target-price">目标 ¥{{ alert.targetPrice }}</span>
                    </div>
                  </div>
                </div>
                <div class="alert-status">
                  <span :class="['status-tag', getStatusClass(alert.status)]">{{ getStatusText(alert.status) }}</span>
                  <span class="alert-time">{{ formatTime(alert.createdTime) }}</span>
                </div>
                <div class="alert-actions">
                  <button v-if="alert.status === 0" class="action-btn edit" @click="openEditDialog(alert)">修改</button>
                  <button class="action-btn cancel" @click="handleCancel(alert)">
                    {{ alert.status === 0 ? '取消' : '删除' }}
                  </button>
                </div>
              </div>
            </template>
            <div v-else class="empty-state">
              <div class="empty-icon">🔔</div>
              <p>暂无降价提醒</p>
              <p class="empty-tip">在商品详情页设置降价提醒，我们会在降价时通知您</p>
              <button class="browse-btn" @click="$router.push('/')">去逛逛</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 修改目标价格弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改目标价格" width="400px">
      <div class="edit-form" v-if="editingAlert">
        <div class="form-item">
          <span class="label">商品</span>
          <span class="value">{{ editingAlert.productName }}</span>
        </div>
        <div class="form-item">
          <span class="label">当前价格</span>
          <span class="value price">¥{{ editingAlert.productPrice || editingAlert.currentPrice }}</span>
        </div>
        <div class="form-item">
          <span class="label">目标价格</span>
          <div class="input-wrapper">
            <span class="currency">¥</span>
            <input type="number" v-model.number="newTargetPrice" :max="editingAlert.productPrice - 0.01" min="0.01" step="0.01" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <Footer />
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import priceApi from '@/api/priceApi'
import fileApi from '@/api/fileApi'
import axios from '@/utils/axios'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const alerts = ref<any[]>([])
const activeTab = ref('all')
const editDialogVisible = ref(false)
const editingAlert = ref<any>(null)
const newTargetPrice = ref(0)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '监控中', value: 'active' },
  { label: '已触发', value: 'triggered' },
  { label: '已取消', value: 'cancelled' }
]

const activeCount = computed(() => alerts.value.filter(a => a.status === 0).length)
const triggeredCount = computed(() => alerts.value.filter(a => a.status === 1).length)

const filteredAlerts = computed(() => {
  if (activeTab.value === 'all') return alerts.value
  if (activeTab.value === 'active') return alerts.value.filter(a => a.status === 0)
  if (activeTab.value === 'triggered') return alerts.value.filter(a => a.status === 1)
  if (activeTab.value === 'cancelled') return alerts.value.filter(a => a.status === 2)
  return alerts.value
})

const getStatusClass = (status: number) => {
  const map: Record<number, string> = { 0: 'active', 1: 'triggered', 2: 'cancelled' }
  return map[status] || ''
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '监控中', 1: '已触发', 2: '已取消' }
  return map[status] || '未知'
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 16)
}

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const imgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#f8f8fc" width="80" height="80"/><text fill="#ccc" font-family="Arial" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em">商品</text></svg>')
}

const fetchAlerts = async () => {
  loading.value = true
  try {
    // 获取用户的降价提醒列表（带商品信息）
    const res: any = await axios.get('/price/alerts/detail')
    if (res?.code === 200) {
      alerts.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const goToProduct = (productId: number) => {
  router.push(`/product/${productId}`)
}

const openEditDialog = (alert: any) => {
  editingAlert.value = alert
  newTargetPrice.value = alert.targetPrice
  editDialogVisible.value = true
}

const saveEdit = async () => {
  if (!editingAlert.value) return
  const maxPrice = editingAlert.value.productPrice || editingAlert.value.currentPrice
  if (newTargetPrice.value >= maxPrice) {
    ElMessage.warning('目标价格必须低于当前价格')
    return
  }
  if (newTargetPrice.value <= 0) {
    ElMessage.warning('请输入有效的目标价格')
    return
  }
  
  saving.value = true
  try {
    const res: any = await priceApi.createAlert(editingAlert.value.productId, newTargetPrice.value)
    if (res?.code === 200) {
      ElMessage.success('目标价格已更新')
      editDialogVisible.value = false
      fetchAlerts()
    } else {
      ElMessage.error(res?.message || '更新失败')
    }
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}

const handleCancel = async (alert: any) => {
  const action = alert.status === 0 ? '取消' : '删除'
  try {
    await ElMessageBox.confirm(`确定要${action}这条降价提醒吗？`, '提示', { type: 'warning' })
    const res: any = await priceApi.cancelAlert(alert.productId)
    if (res?.code === 200) {
      ElMessage.success(`已${action}`)
      fetchAlerts()
    } else {
      ElMessage.error(res?.message || `${action}失败`)
    }
  } catch {}
}

onMounted(() => fetchAlerts())
</script>


<style scoped>
.alerts-page {
  min-height: 100vh;
  background: #f8f9fc;
}

.main-content {
  padding: 100px 0 60px;
}

.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(90, 143, 212, 0.1);
  border: 1px solid rgba(90, 143, 212, 0.2);
  border-radius: 8px;
  color: #5A8FD4;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #5A8FD4;
  color: #fff;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0;
}

.page-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 600;
  color: #5A8FD4;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.alerts-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(90, 143, 212, 0.1);
}

.tab-btn.active {
  background: #5A8FD4;
  color: #fff;
}

.alerts-list {
  min-height: 300px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.3s;
}

.alert-item:hover {
  background: #fafbfc;
}

.alert-item:last-child {
  border-bottom: none;
}

.product-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-detail h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.price-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.current-price {
  color: #5A8FD4;
}

.target-price {
  color: #52c41a;
}

.alert-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 100px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-tag.active {
  background: rgba(90, 143, 212, 0.1);
  color: #5A8FD4;
}

.status-tag.triggered {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.status-tag.cancelled {
  background: rgba(153, 153, 153, 0.1);
  color: #999;
}

.alert-time {
  font-size: 12px;
  color: #999;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.edit {
  background: rgba(90, 143, 212, 0.1);
  border: 1px solid rgba(90, 143, 212, 0.2);
  color: #5A8FD4;
}

.action-btn.edit:hover {
  background: #5A8FD4;
  color: #fff;
}

.action-btn.cancel {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
}

.action-btn.cancel:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 8px;
  color: #666;
}

.empty-tip {
  font-size: 13px;
  color: #999;
}

.browse-btn {
  margin-top: 20px;
  padding: 10px 32px;
  background: linear-gradient(135deg, #5A8FD4, #7BA8E8);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.3s;
}

.browse-btn:hover {
  transform: translateY(-2px);
}

/* 编辑弹窗 */
.edit-form {
  padding: 10px 0;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.form-item .label {
  width: 80px;
  color: #666;
  font-size: 14px;
}

.form-item .value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.form-item .value.price {
  color: #5A8FD4;
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.input-wrapper .currency {
  padding: 8px 12px;
  background: #f5f5f5;
  color: #666;
}

.input-wrapper input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  font-size: 14px;
  outline: none;
}

:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .stats-row {
    flex-wrap: wrap;
  }
  
  .stat-card {
    min-width: calc(50% - 8px);
  }
  
  .alert-item {
    flex-wrap: wrap;
  }
  
  .product-info {
    width: 100%;
  }
  
  .alert-status {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }
  
  .alert-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
