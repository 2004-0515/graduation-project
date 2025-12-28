<template>
  <div class="notifications-page">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>消息通知</h1>
          <p>查看你的最新消息</p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-label">全部消息</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ unreadCount }}</span>
            <span class="stat-label">未读消息</span>
          </div>
        </div>

        <!-- 通知卡片 -->
        <div class="notifications-card">
          <div class="card-header">
            <div class="tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.name"
                :class="['tab-btn', { active: activeTab === tab.name }]"
                @click="switchTab(tab.name)"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="actions">
              <button class="action-btn" @click="markAllRead" :disabled="unreadCount === 0">全部已读</button>
              <button class="action-btn danger" @click="clearAllNotifications" :disabled="totalCount === 0">清空</button>
            </div>
          </div>

          <div class="notifications-list" v-loading="loading">
            <template v-if="filteredNotifications.length > 0">
              <div 
                v-for="item in filteredNotifications" 
                :key="item.id"
                :class="['notification-item', { unread: !item.read }]"
                @click="openDetail(item)"
              >
                <div class="item-icon" :class="item.type">
                  <svg v-if="item.type === 'system'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  <svg v-else-if="item.type === 'promotion'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div class="item-content">
                  <div class="item-header">
                    <h4>{{ item.title }}</h4>
                    <span class="item-time">{{ item.timeAgo }}</span>
                  </div>
                  <p class="item-preview">{{ item.message }}</p>
                </div>
                <span v-if="!item.read" class="unread-dot"></span>
                <button class="delete-btn" @click.stop="deleteItem(item)" title="删除">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </template>
            <div v-else class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <p>暂无通知</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 消息详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="currentNotification?.title" width="500px" class="notification-dialog">
      <div class="detail-content" v-if="currentNotification">
        <div class="detail-meta">
          <span class="detail-type" :class="currentNotification.type">
            {{ getTypeName(currentNotification.type) }}
          </span>
          <span class="detail-time">{{ currentNotification.timeAgo }}</span>
        </div>
        <div class="detail-message">
          {{ currentNotification.message }}
        </div>
        <div class="detail-status">
          <span class="read-status">✓ 已读</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="currentNotification?.type === 'order' && currentNotification?.relatedId" 
                     type="primary" @click="goToOrder">
            查看订单
          </el-button>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import notificationApi, { type Notification } from '../api/notificationApi'
import { useNotificationStore } from '../stores/notificationStore'

const router = useRouter()
const notificationStore = useNotificationStore()

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'unread', label: '未读' },
  { name: 'read', label: '已读' },
  { name: 'system', label: '系统' },
  { name: 'order', label: '订单' },
  { name: 'promotion', label: '促销' }
]

const activeTab = ref('all')
const notifications = ref<Notification[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentNotification = ref<Notification | null>(null)

const totalCount = computed(() => notifications.value.length)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const filteredNotifications = computed(() => {
  switch (activeTab.value) {
    case 'unread': return notifications.value.filter(n => !n.read)
    case 'read': return notifications.value.filter(n => n.read)
    case 'system': return notifications.value.filter(n => n.type === 'system')
    case 'order': return notifications.value.filter(n => n.type === 'order')
    case 'promotion': return notifications.value.filter(n => n.type === 'promotion')
    default: return notifications.value
  }
})

const getTypeName = (type: string) => {
  const names: Record<string, string> = {
    system: '系统通知',
    order: '订单消息',
    promotion: '促销活动'
  }
  return names[type] || '通知'
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res: any = await notificationApi.getNotifications()
    if (res?.code === 200) {
      notifications.value = res.data || []
    }
  } catch (e) {
    console.error('获取通知失败', e)
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: string) => {
  activeTab.value = tab
}

const openDetail = async (item: Notification) => {
  // 先标记为已读
  if (!item.read) {
    try {
      await notificationApi.markAsRead(item.id)
      item.read = true
      notificationStore.decreaseCount(1)
    } catch {}
  }
  // 打开详情弹窗
  currentNotification.value = item
  detailVisible.value = true
}

const goToOrder = () => {
  detailVisible.value = false
  // 从消息内容中提取订单号（格式：您的订单 XXX 状态更新）
  if (currentNotification.value?.message) {
    const match = currentNotification.value.message.match(/订单\s*(\S+)\s/)
    if (match && match[1]) {
      router.push(`/orders?search=${match[1]}`)
      return
    }
  }
  router.push('/orders')
}

const markAllRead = async () => {
  try {
    await notificationApi.markAllAsRead()
    notifications.value.forEach(n => n.read = true)
    notificationStore.clearCount()
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

const deleteItem = async (item: Notification) => {
  try {
    await notificationApi.deleteNotification(item.id)
    // 如果删除的是未读消息，减少计数
    if (!item.read) {
      notificationStore.decreaseCount(1)
    }
    notifications.value = notifications.value.filter(n => n.id !== item.id)
    ElMessage.success('已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

const clearAllNotifications = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有通知吗？', '提示', { type: 'warning' })
    await notificationApi.clearAll()
    notifications.value = []
    notificationStore.clearCount()
    ElMessage.success('已清空所有通知')
  } catch {}
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: var(--white);
  position: relative;
}

.notifications-page::before {
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
  animation: floatAnim 20s ease-in-out infinite;
}

.notifications-page::after {
  content: '';
  position: fixed;
  bottom: 5%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite reverse;
}

@keyframes floatAnim {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content {
  position: relative;
  z-index: 1;
  padding: 100px 0 80px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-title);
  margin: 0 0 8px;
}

.page-header p {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  max-width: 200px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
}

.stat-num {
  display: block;
  font-size: 32px;
  font-weight: 600;
  color: #5A8FD4;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
}

/* Card */
.notifications-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(200, 220, 255, 0.3);
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(230, 242, 255, 0.5);
}

.tab-btn.active {
  background: var(--sakura);
  color: #fff;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(90, 143, 212, 0.4);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--sakura);
  color: var(--sakura);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.danger:hover:not(:disabled) {
  border-color: #e74c3c;
  color: #e74c3c;
}

/* List */
.notifications-list {
  padding: 12px;
  min-height: 200px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.notification-item:hover {
  background: rgba(230, 242, 255, 0.3);
}

.notification-item.unread {
  background: rgba(230, 242, 255, 0.2);
}

.item-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(230, 242, 255, 0.5);
  border-radius: 50%;
  color: var(--text-body);
  flex-shrink: 0;
}

.item-icon.system { color: var(--sakura); background: rgba(90, 143, 212, 0.1); }
.item-icon.order { color: #27ae60; background: rgba(39, 174, 96, 0.1); }
.item-icon.promotion { color: #e67e22; background: rgba(230, 126, 34, 0.1); }

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.item-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-title);
}

.item-time {
  font-size: 13px;
  color: var(--text-muted);
}

.item-content p {
  margin: 0;
  font-size: 15px;
  color: var(--text-body);
  line-height: 1.6;
}

.unread-dot {
  width: 10px;
  height: 10px;
  background: var(--sakura);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 8px;
}

.delete-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  padding: 8px;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s;
  border-radius: 50%;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.4;
  color: var(--sakura);
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

@media (max-width: 768px) {
  .stats-row {
    flex-direction: column;
  }
  
  .stat-card {
    max-width: none;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .tabs {
    overflow-x: auto;
  }
  
  .actions {
    justify-content: flex-end;
  }
}

/* 消息预览 */
.item-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}

/* 详情弹窗 */
.detail-content {
  padding: 10px 0;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-type {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.detail-type.system {
  background: rgba(90, 143, 212, 0.1);
  color: #5A8FD4;
}

.detail-type.order {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.detail-type.promotion {
  background: rgba(230, 126, 34, 0.1);
  color: #e67e22;
}

.detail-time {
  font-size: 13px;
  color: #999;
}

.detail-message {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 16px;
}

.detail-status {
  display: flex;
  justify-content: flex-end;
}

.read-status {
  font-size: 13px;
  color: #27ae60;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.notification-dialog .el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

:deep(.notification-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.notification-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}
</style>
