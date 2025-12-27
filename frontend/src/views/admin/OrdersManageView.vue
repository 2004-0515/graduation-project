<template>
  <AdminLayout>
    <div class="orders-manage">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="searchKeyword" placeholder="搜索订单号" style="width: 200px" @keyup.enter="fetchOrders">
            <template #append>
              <el-button @click="fetchOrders">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="订单状态" style="width: 120px" @change="fetchOrders">
            <el-option label="全部" :value="null" />
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <span class="total-count">共 {{ total }} 条订单</span>
        </div>
      </div>

      <div class="table-card">
        <el-table :data="orders" v-loading="loading" stripe>
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <div class="order-items">
                <span v-for="(item, i) in (row.items || []).slice(0, 2)" :key="i" class="item-name">
                  {{ item.productName }} x{{ item.quantity }}
                </span>
                <span v-if="(row.items || []).length > 2" class="more">等{{ row.items.length }}件商品</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="金额" width="100">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.orderStatus)">{{ getStatusText(row.orderStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdTime" label="下单时间" width="160">
            <template #default="{ row }">{{ formatDate(row.createdTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
              <el-button v-if="row.orderStatus === 1" type="success" link @click="shipOrder(row)">发货</el-button>
              <el-button v-if="row.orderStatus === 0" type="warning" link @click="cancelOrder(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="fetchOrders" />
        </div>
      </div>

      <!-- 订单详情弹窗 -->
      <el-dialog v-model="detailVisible" title="订单详情" width="700px">
        <div class="order-detail" v-if="currentOrder">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">订单号：</span><span>{{ currentOrder.orderNo }}</span></div>
              <div class="detail-item"><span class="label">下单时间：</span><span>{{ formatDate(currentOrder.createdTime) }}</span></div>
              <div class="detail-item"><span class="label">订单状态：</span><el-tag :type="getStatusType(currentOrder.orderStatus)">{{ getStatusText(currentOrder.orderStatus) }}</el-tag></div>
              <div class="detail-item"><span class="label">支付方式：</span><span>{{ currentOrder.paymentMethod === 1 ? '微信支付' : '支付宝' }}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>商品信息</h4>
            <div class="items-list">
              <div v-for="item in currentOrder.items" :key="item.id" class="item-row">
                <el-image :src="item.productImage" style="width: 50px; height: 50px; border-radius: 6px" fit="cover" />
                <div class="item-info">
                  <span class="name">{{ item.productName }}</span>
                  <span class="price">¥{{ item.price }} x {{ item.quantity }}</span>
                </div>
                <span class="subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>收货信息</h4>
            <div class="address-info" v-if="currentOrder.shippingAddress">
              <p>{{ parseAddress(currentOrder.shippingAddress) }}</p>
            </div>
          </div>

          <div class="detail-footer">
            <span class="total-label">订单总额：</span>
            <span class="total-amount">¥{{ currentOrder.totalAmount?.toFixed(2) }}</span>
          </div>
        </div>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'

const orders = ref<any[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentOrder = ref<any>(null)

const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const getStatusText = (status: number) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }[status] || '未知')
const getStatusType = (status: number) => ({ 0: 'warning', 1: 'primary', 2: 'info', 3: 'success', 4: 'danger' }[status] || 'info') as any

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const parseAddress = (addr: any) => {
  if (typeof addr === 'string') {
    try { addr = JSON.parse(addr) } catch { return addr }
  }
  return `${addr.name || addr.receiver || ''} ${addr.phone || ''} ${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.detail || ''}`
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value - 1, size: pageSize.value }
    if (filterStatus.value !== null) params.status = filterStatus.value
    
    const res: any = await adminApi.getAllOrders(params)
    if (res?.code === 200) {
      let list = res.data || []
      if (searchKeyword.value) {
        list = list.filter((o: any) => o.orderNo?.includes(searchKeyword.value))
      }
      orders.value = list
      total.value = list.length
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const viewDetail = (order: any) => {
  currentOrder.value = order
  detailVisible.value = true
}

const shipOrder = async (order: any) => {
  try {
    await ElMessageBox.confirm('确定要发货吗？', '提示')
    await adminApi.shipOrder(order.id)
    order.orderStatus = 2
    ElMessage.success('发货成功')
  } catch {}
}

const cancelOrder = async (order: any) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', { type: 'warning' })
    await adminApi.updateOrderStatus(order.id, 4)
    order.orderStatus = 4
    ElMessage.success('订单已取消')
  } catch {}
}

onMounted(() => fetchOrders())
</script>

<style scoped>
.orders-manage { max-width: 1400px; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left { display: flex; gap: 12px; }
.total-count { font-size: 14px; color: #666; }

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.order-items { display: flex; flex-direction: column; gap: 4px; }
.item-name { font-size: 13px; color: #333; }
.more { font-size: 12px; color: #999; }

.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

/* 详情弹窗 */
.order-detail { padding: 0 10px; }

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-of-type { border-bottom: none; }

.detail-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0 0 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  font-size: 14px;
  color: #666;
}

.detail-item .label {
  color: #999;
}

.items-list { display: flex; flex-direction: column; gap: 12px; }

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-info .name { font-size: 14px; color: #333; }
.item-info .price { font-size: 13px; color: #999; }
.subtotal { font-size: 15px; font-weight: 600; color: #5A8FD4; }

.address-info p { margin: 0; font-size: 14px; color: #666; line-height: 1.6; }

.detail-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
}

.total-label { font-size: 14px; color: #666; }
.total-amount { font-size: 24px; font-weight: 700; color: #5A8FD4; }

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
</style>
