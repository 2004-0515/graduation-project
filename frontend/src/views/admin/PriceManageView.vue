<template>
  <AdminLayout>
    <div class="price-manage">
      <!-- Tab切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="价格历史" name="history" />
        <el-tab-pane name="alerts">
          <template #label>
            <span>降价提醒 <el-badge v-if="activeAlertCount > 0" :value="activeAlertCount" class="tab-badge" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 价格历史Tab -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div class="toolbar">
          <div class="toolbar-left">
            <el-select v-model="selectedProductId" placeholder="选择商品查看价格历史" filterable style="width: 300px" @change="fetchPriceHistory">
              <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id">
                <span>{{ p.name }}</span>
                <span class="option-price">¥{{ p.price }}</span>
              </el-option>
            </el-select>
            <el-button @click="fetchProducts" :loading="loadingProducts">刷新商品</el-button>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" @click="openRecordDialog" :disabled="!selectedProductId">手动记录价格</el-button>
          </div>
        </div>

        <!-- 价格统计卡片 -->
        <div v-if="priceStats" class="stats-cards">
          <div class="stat-card">
            <span class="stat-label">当前价格</span>
            <span class="stat-value current">¥{{ priceStats.currentPrice }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">历史最低</span>
            <span class="stat-value lowest">¥{{ priceStats.lowestPrice }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">历史最高</span>
            <span class="stat-value highest">¥{{ priceStats.highestPrice }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">平均价格</span>
            <span class="stat-value avg">¥{{ priceStats.avgPrice }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">记录数</span>
            <span class="stat-value">{{ priceStats.recordCount }}</span>
          </div>
        </div>

        <!-- 价格历史表格 -->
        <div class="table-card">
          <el-table :data="priceHistory" v-loading="loadingHistory" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="价格" width="120">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column label="原价" width="120">
              <template #default="{ row }">
                <span v-if="row.originalPrice">¥{{ row.originalPrice }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="变化类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getChangeTagType(row.changeType)" size="small">{{ getChangeText(row.changeType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变化金额" width="120">
              <template #default="{ row }">
                <span v-if="row.changeAmount" :class="getChangeClass(row.changeAmount)">
                  {{ row.changeAmount > 0 ? '+' : '' }}¥{{ row.changeAmount }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="变化率" width="100">
              <template #default="{ row }">
                <span v-if="row.changeRate" :class="getChangeClass(row.changeRate)">
                  {{ row.changeRate > 0 ? '+' : '' }}{{ row.changeRate }}%
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="记录时间" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.recordedTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDeleteHistory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 降价提醒Tab -->
      <div v-if="activeTab === 'alerts'" class="tab-content">
        <div class="toolbar">
          <div class="toolbar-left">
            <el-select v-model="alertStatusFilter" placeholder="状态筛选" style="width: 140px" @change="fetchAllAlerts">
              <el-option label="全部" value="" />
              <el-option label="监控中" :value="0" />
              <el-option label="已触发" :value="1" />
              <el-option label="已取消" :value="2" />
            </el-select>
            <el-input v-model="alertSearchKeyword" placeholder="搜索用户名/商品名" style="width: 200px" @keyup.enter="fetchAllAlerts">
              <template #append>
                <el-button @click="fetchAllAlerts">搜索</el-button>
              </template>
            </el-input>
          </div>
          <div class="toolbar-right">
            <span class="total-count">共 {{ alerts.length }} 条提醒</span>
          </div>
        </div>

        <div class="table-card">
          <el-table :data="alerts" v-loading="loadingAlerts" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="用户" width="120">
              <template #default="{ row }">{{ row.username || `用户${row.userId}` }}</template>
            </el-table-column>
            <el-table-column label="商品" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.productName || `商品${row.productId}` }}</template>
            </el-table-column>
            <el-table-column label="目标价格" width="100">
              <template #default="{ row }">¥{{ row.targetPrice }}</template>
            </el-table-column>
            <el-table-column label="设置时价格" width="110">
              <template #default="{ row }">¥{{ row.currentPrice }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getAlertStatusType(row.status)" size="small">{{ getAlertStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="触发价格" width="100">
              <template #default="{ row }">
                <span v-if="row.triggeredPrice">¥{{ row.triggeredPrice }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="已通知" width="80">
              <template #default="{ row }">
                <el-tag :type="row.notified ? 'success' : 'info'" size="small">{{ row.notified ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.createdTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button v-if="row.status === 0" type="warning" link size="small" @click="handleTriggerAlert(row)">手动触发</el-button>
                <el-button v-if="row.status === 1" type="primary" link size="small" @click="handleResetAlert(row)">回退触发</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteAlert(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 手动记录价格弹窗 -->
      <el-dialog v-model="recordDialogVisible" title="手动记录价格" width="450px">
        <el-form :model="recordForm" label-width="100px">
          <el-form-item label="商品">
            <span class="selected-product">{{ selectedProduct?.name }}</span>
          </el-form-item>
          <el-form-item label="当前价格">
            <span>¥{{ selectedProduct?.price }}</span>
          </el-form-item>
          <el-form-item label="记录价格" required>
            <el-input-number v-model="recordForm.price" :min="0.01" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="原价">
            <el-input-number v-model="recordForm.originalPrice" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="recordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRecord" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'
import priceApi from '@/api/priceApi'
import type { PriceHistory, PriceStats, PriceAlert } from '@/api/priceApi'
import axios from '@/utils/axios'

const activeTab = ref('history')
const loadingProducts = ref(false)
const loadingHistory = ref(false)
const loadingAlerts = ref(false)
const saving = ref(false)

// 价格历史相关
const products = ref<any[]>([])
const selectedProductId = ref<number | null>(null)
const priceHistory = ref<PriceHistory[]>([])
const priceStats = ref<PriceStats | null>(null)
const recordDialogVisible = ref(false)
const recordForm = reactive({
  price: 0,
  originalPrice: 0
})

// 降价提醒相关
const alerts = ref<any[]>([])
const alertStatusFilter = ref<number | string>('')
const alertSearchKeyword = ref('')
const activeAlertCount = ref(0)

const selectedProduct = computed(() => products.value.find(p => p.id === selectedProductId.value))

const handleTabChange = () => {
  if (activeTab.value === 'alerts') {
    fetchAllAlerts()
  }
}

const getChangeTagType = (type: string) => {
  const map: Record<string, string> = { INITIAL: 'info', INCREASE: 'danger', DECREASE: 'success', UNCHANGED: 'warning' }
  return map[type] || 'info'
}

const getChangeText = (type: string) => {
  const map: Record<string, string> = { INITIAL: '初始', INCREASE: '涨价', DECREASE: '降价', UNCHANGED: '不变' }
  return map[type] || type
}

const getChangeClass = (value: number) => {
  if (value > 0) return 'text-danger'
  if (value < 0) return 'text-success'
  return ''
}

const getAlertStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'primary', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getAlertStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '监控中', 1: '已触发', 2: '已取消' }
  return map[status] || '未知'
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 19)
}

const fetchProducts = async () => {
  loadingProducts.value = true
  try {
    const res: any = await adminApi.getProducts({ page: 0, size: 1000 })
    if (res?.code === 200) {
      products.value = res.data?.content || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingProducts.value = false
  }
}

const fetchPriceHistory = async () => {
  if (!selectedProductId.value) return
  loadingHistory.value = true
  try {
    const [historyRes, statsRes]: any[] = await Promise.all([
      priceApi.getPriceHistory(selectedProductId.value),
      priceApi.getPriceStats(selectedProductId.value)
    ])
    if (historyRes?.code === 200) {
      priceHistory.value = historyRes.data || []
    }
    if (statsRes?.code === 200) {
      priceStats.value = statsRes.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingHistory.value = false
  }
}

const fetchAllAlerts = async () => {
  loadingAlerts.value = true
  try {
    const params: any = {}
    if (alertStatusFilter.value !== '') params.status = alertStatusFilter.value
    if (alertSearchKeyword.value) params.keyword = alertSearchKeyword.value
    
    const res: any = await axios.get('/price/admin/alerts', { params })
    if (res?.code === 200) {
      alerts.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingAlerts.value = false
  }
}

const fetchActiveAlertCount = async () => {
  try {
    const res: any = await axios.get('/price/admin/alerts/count')
    if (res?.code === 200) {
      activeAlertCount.value = res.data || 0
    }
  } catch (e) {
    console.error(e)
  }
}

const openRecordDialog = () => {
  if (!selectedProduct.value) return
  recordForm.price = selectedProduct.value.price
  recordForm.originalPrice = selectedProduct.value.originalPrice || 0
  recordDialogVisible.value = true
}

const saveRecord = async () => {
  if (!selectedProductId.value || recordForm.price <= 0) {
    ElMessage.warning('请输入有效价格')
    return
  }
  saving.value = true
  try {
    const res: any = await axios.post('/price/admin/record', {
      productId: selectedProductId.value,
      price: recordForm.price,
      originalPrice: recordForm.originalPrice || null
    })
    if (res?.code === 200) {
      ElMessage.success('价格记录成功')
      recordDialogVisible.value = false
      fetchPriceHistory()
    } else {
      ElMessage.error(res?.message || '记录失败')
    }
  } catch (e) {
    ElMessage.error('记录失败')
  } finally {
    saving.value = false
  }
}

const handleDeleteHistory = async (row: PriceHistory) => {
  try {
    await ElMessageBox.confirm('确定要删除这条价格记录吗？', '提示', { type: 'warning' })
    const res: any = await axios.delete(`/price/admin/history/${row.id}`)
    if (res?.code === 200) {
      ElMessage.success('删除成功')
      fetchPriceHistory()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch {}
}

const handleTriggerAlert = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要手动触发这条降价提醒吗？将立即发送通知给用户。', '提示', { type: 'warning' })
    const res: any = await axios.post(`/price/admin/alert/${row.id}/trigger`)
    if (res?.code === 200) {
      ElMessage.success('已触发并发送通知')
      await fetchAllAlerts()
      await fetchActiveAlertCount()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch {}
}

const handleResetAlert = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要回退这条降价提醒到监控状态吗？', '提示', { type: 'warning' })
    const res: any = await axios.post(`/price/admin/alert/${row.id}/reset`)
    if (res?.code === 200) {
      ElMessage.success('已回退到监控状态')
      await fetchAllAlerts()
      await fetchActiveAlertCount()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch {}
}

const handleDeleteAlert = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条降价提醒吗？', '提示', { type: 'warning' })
    const res: any = await axios.delete(`/price/admin/alert/${row.id}`)
    if (res?.code === 200) {
      ElMessage.success('删除成功')
      fetchAllAlerts()
      fetchActiveAlertCount()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch {}
}

onMounted(() => {
  fetchProducts()
  fetchActiveAlertCount()
})
</script>


<style scoped>
.price-manage { 
  width: 100%;
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
}

.tab-content {
  margin-top: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  font-size: 14px;
  color: #666;
}

.option-price {
  float: right;
  color: #5A8FD4;
  font-size: 13px;
}

.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 140px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.stat-value.current { color: #5A8FD4; }
.stat-value.lowest { color: #52c41a; }
.stat-value.highest { color: #ff4d4f; }
.stat-value.avg { color: #faad14; }

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.text-muted { color: #999; }
.text-success { color: #52c41a; }
.text-danger { color: #ff4d4f; }

.tab-badge {
  margin-left: 6px;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }

.selected-product {
  font-weight: 500;
  color: #333;
}
</style>
