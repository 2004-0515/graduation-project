<template>
  <AdminLayout>
    <div class="contact-messages-view" data-testid="admin-contact-messages-view">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="total-count">共 {{ filteredMessages.length }} 条留言</span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="handled" />
          </el-select>
        </div>
      </div>

      <div class="table-card">
        <el-table :data="filteredMessages" v-loading="loading" stripe>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="contact" label="联系方式" min-width="180" />
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'handled' ? 'success' : 'warning'">
                {{ getTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="留言内容" min-width="280" />
          <el-table-column label="提交时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'handled' ? 'success' : 'warning'">
                {{ row.status === 'handled' ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button
                v-if="row.status !== 'handled'"
                type="primary"
                link
                size="small"
                @click="markHandled(row)"
              >
                标记已处理
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'
import { debugError } from '@/utils/debug'

type ContactMessage = {
  id: number
  name: string
  contact: string
  type: string
  content: string
  status: 'pending' | 'handled'
  createdTime: string
}

const messages = ref<ContactMessage[]>([])
const loading = ref(false)
const statusFilter = ref<'all' | 'pending' | 'handled'>('all')
let latestMessagesRequestId = 0
const invalidateMessageRequests = () => {
  latestMessagesRequestId += 1
}

const filteredMessages = computed(() => {
  if (statusFilter.value === 'all') {
    return messages.value
  }
  return messages.value.filter((item) => item.status === statusFilter.value)
})

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const getResponseMessage = (response: { message?: string } | null | undefined, fallback: string) =>
  response?.message || fallback

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    product: '商品咨询',
    order: '订单问题',
    payment: '支付问题',
    return: '退换货',
    feedback: '投诉建议',
    other: '其他'
  }
  return map[type] || '其他'
}

const formatDateTime = (value: string) => {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

const fetchMessages = async () => {
  const requestId = ++latestMessagesRequestId
  loading.value = true
  try {
    const res: any = await adminApi.getContactMessages()
    if (requestId !== latestMessagesRequestId) {
      return
    }
    if (res?.code === 200) {
      messages.value = Array.isArray(res.data) ? res.data : []
    } else {
      debugError('获取留言列表失败', res?.message || '留言列表返回异常')
    }
  } catch (error) {
    if (requestId !== latestMessagesRequestId) {
      return
    }
    debugError('获取留言列表失败', error)
  } finally {
    if (requestId === latestMessagesRequestId) {
      loading.value = false
    }
  }
}

const refreshMessagesAfterSuccess = async (actionLabel: string) => {
  try {
    await fetchMessages()
  } catch (error) {
    debugError(`${actionLabel}后刷新留言列表失败`, error)
  }
}

const applyLocalMessageUpdate = (messageId: number, updater: (message: ContactMessage) => ContactMessage) => {
  messages.value = messages.value.map((item) => (item.id === messageId ? updater(item) : item))
}

const markHandled = async (row: ContactMessage) => {
  try {
    const res: any = await adminApi.updateContactMessageStatus(row.id, 'handled')
    if (res?.code === 200) {
      invalidateMessageRequests()
      applyLocalMessageUpdate(row.id, (item) => ({
        ...item,
        status: 'handled'
      }))
      ElMessage.success(getResponseMessage(res, '已标记为已处理'))
      await refreshMessagesAfterSuccess('更新留言状态')
      return
    }

    const message = getResponseMessage(res, '更新留言状态失败')
    debugError('更新留言状态失败', message)
    ElMessage.error(message)
  } catch (error) {
    debugError('更新留言状态失败', error)
    ElMessage.error(getErrorMessage(error, '更新留言状态失败'))
  }
}

const handleDelete = async (row: ContactMessage) => {
  try {
    await ElMessageBox.confirm(`确定要删除留言“${row.name}”吗？`, '提示', { type: 'warning' })
    const res: any = await adminApi.deleteContactMessage(row.id)
    if (res?.code !== 200) {
      const message = getResponseMessage(res, '删除留言失败')
      debugError('删除留言失败', message)
      ElMessage.error(message)
      return
    }

    ElMessage.success(getResponseMessage(res, '删除成功'))
    invalidateMessageRequests()
    messages.value = messages.value.filter((item) => item.id !== row.id)
    await refreshMessagesAfterSuccess('删除留言')
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    debugError('删除留言失败', error)
    ElMessage.error(getErrorMessage(error, '删除留言失败'))
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.contact-messages-view {
  width: 100%;
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.total-count {
  font-size: 14px;
  color: #666;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
</style>
