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
                :class="['notification-item', getActualType(item), { unread: !item.read }]"
                @click="openDetail(item)"
              >
                <div class="item-icon" :class="getActualType(item)">
                  <svg v-if="getActualType(item) === 'system'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  <svg v-else-if="getActualType(item) === 'promotion'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                  </svg>
                  <svg v-else-if="getActualType(item) === 'file_review'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <svg v-else-if="getActualType(item) === 'product_review'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  <svg v-else-if="getActualType(item) === 'review'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 2v4M16 2v4M2 10h20"/>
                  </svg>
                </div>
                <div class="item-content">
                  <div class="item-header">
                    <div class="item-title-row">
                      <span class="type-tag" :class="getActualType(item)">{{ getTypeName(getActualType(item)) }}</span>
                      <h4>{{ item.title }}</h4>
                    </div>
                    <span class="item-time">{{ item.timeAgo }}</span>
                  </div>
                  <p class="item-preview">{{ item.message }}</p>
                </div>
                <div class="type-indicator" :class="getActualType(item)"></div>
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
          <span class="detail-type" :class="getActualType(currentNotification)">
            {{ getTypeName(getActualType(currentNotification)) }}
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
          <el-button v-if="getActualType(currentNotification) === 'order'" 
                     type="primary" @click="goToOrder">
            查看订单
          </el-button>
          <el-button v-if="getActualType(currentNotification) === 'promotion'" 
                     type="primary" @click="goToPromotion">
            {{ isPriceAlertNotification(currentNotification) ? '查看商品' : (currentNotification?.relatedId ? '查看优惠券' : '领取优惠券') }}
          </el-button>
          <el-button v-if="isAdmin && getActualType(currentNotification) === 'file_review'" 
                     type="primary" @click="goToFileReview">
            去审核
          </el-button>
          <el-button v-if="isAdmin && getActualType(currentNotification) === 'product_review'" 
                     type="primary" @click="goToProductReview">
            去审核
          </el-button>
          <el-button v-if="getActualType(currentNotification) === 'review'" 
                     type="primary" @click="goToProductDetail">
            查看商品
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

import { useUserStore } from '../stores/userStore'

const router = useRouter()
const notificationStore = useNotificationStore()
const userStore = useUserStore()

// 判断是否是管理员
const isAdmin = computed(() => userStore.userInfo?.username === 'admin')

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'unread', label: '未读' },
  { name: 'read', label: '已读' },
  { name: 'system', label: '系统' },
  { name: 'order', label: '订单' },
  { name: 'promotion', label: '促销' },
  { name: 'file_review', label: '文件审核' },
  { name: 'product_review', label: '商品审核' },
  { name: 'review', label: '评价' }
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
    case 'system': return notifications.value.filter(n => n.type === 'system' && !isFileReviewNotification(n) && !isProductReviewNotification(n))
    case 'order': return notifications.value.filter(n => n.type === 'order')
    case 'promotion': return notifications.value.filter(n => n.type === 'promotion')
    case 'file_review': return notifications.value.filter(n => n.type === 'file_review' || isFileReviewNotification(n))
    case 'product_review': return notifications.value.filter(n => n.type === 'product_review' || isProductReviewNotification(n))
    case 'review': return notifications.value.filter(n => n.type === 'review')
    default: return notifications.value
  }
})

// 判断是否是文件审核相关通知（兼容旧的system类型）- 只包含头像审核
const isFileReviewNotification = (n: Notification) => {
  if (n.type === 'file_review') return true
  if (n.type === 'system') {
    const title = n.title || ''
    const message = n.message || ''
    // 只匹配头像审核，不包含商品图片
    return title.includes('头像') || message.includes('上传了新的头像')
  }
  return false
}

// 判断是否是商品审核相关通知（兼容旧的system类型）
const isProductReviewNotification = (n: Notification) => {
  if (n.type === 'product_review') return true
  if (n.type === 'system') {
    const title = n.title || ''
    const message = n.message || ''
    return (title.includes('商品') && (title.includes('待审核') || title.includes('审核'))) ||
           message.includes('提交了新商品') || message.includes('修改了商品') ||
           title.includes('商品图片') || message.includes('上传了新的商品图片')
  }
  return false
}

// 获取通知的实际类型（用于显示样式）
const getActualType = (n: Notification) => {
  if (n.type === 'file_review' || isFileReviewNotification(n)) return 'file_review'
  if (n.type === 'product_review' || isProductReviewNotification(n)) return 'product_review'
  if (n.type === 'review') return 'review'
  return n.type
}

const getTypeName = (type: string) => {
  const names: Record<string, string> = {
    system: '系统通知',
    order: '订单消息',
    promotion: '促销活动',
    file_review: '文件审核',
    product_review: '商品审核',
    review: '商品评价'
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
  
  // 判断是否是管理员
  const isAdmin = userStore.userInfo?.username === 'admin'
  
  // 检查消息内容，判断是管理员自己的订单还是需要管理的用户订单
  const message = currentNotification.value?.message || ''
  const isOwnOrder = message.includes('您的订单') || message.includes('你的订单')
  
  if (isAdmin && !isOwnOrder) {
    // 管理员处理其他用户的订单，跳转到订单管理页面
    router.push('/admin/orders')
  } else {
    // 管理员自己的订单或普通用户，跳转到我的订单页面
    // 从消息内容中提取订单号（格式：您的订单 XXX 状态更新）
    if (message) {
      const match = message.match(/订单\s*(\S+)\s/)
      if (match && match[1]) {
        router.push(`/orders?search=${match[1]}`)
        return
      }
    }
    router.push('/orders')
  }
}

const goToCoupon = () => {
  detailVisible.value = false
  if (currentNotification.value?.relatedId) {
    router.push(`/coupon/${currentNotification.value.relatedId}`)
  } else {
    router.push('/promotions')
  }
}

// 判断是否是降价提醒通知
const isPriceAlertNotification = (n: Notification | null) => {
  if (!n) return false
  return n.type === 'promotion' && (n.title?.includes('降价提醒') || n.message?.includes('已降价至'))
}

// 跳转到促销相关页面
const goToPromotion = () => {
  detailVisible.value = false
  if (isPriceAlertNotification(currentNotification.value)) {
    // 降价提醒，跳转到商品详情页
    if (currentNotification.value?.relatedId) {
      router.push(`/product/${currentNotification.value.relatedId}`)
    } else {
      router.push('/products')
    }
  } else {
    // 其他促销通知，跳转到优惠券页面
    if (currentNotification.value?.relatedId) {
      router.push(`/coupon/${currentNotification.value.relatedId}`)
    } else {
      router.push('/promotions')
    }
  }
}

const goToFileReview = () => {
  detailVisible.value = false
  router.push('/admin/files')
}

const goToProductReview = () => {
  detailVisible.value = false
  router.push('/admin/products?tab=pending')
}

const goToProductDetail = () => {
  detailVisible.value = false
  if (currentNotification.value?.relatedId) {
    router.push(`/product/${currentNotification.value.relatedId}`)
  } else {
    router.push('/my-products')
  }
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
  padding-left: 24px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border-left: 5px solid transparent;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.6);
}

/* 系统通知 - 深蓝色 */
.notification-item.system {
  border-left-color: #4A7FC4;
  background: linear-gradient(135deg, rgba(74, 127, 196, 0.08) 0%, rgba(90, 143, 212, 0.04) 100%);
}

.notification-item.system:hover {
  background: linear-gradient(135deg, rgba(74, 127, 196, 0.15) 0%, rgba(90, 143, 212, 0.08) 100%);
  box-shadow: 0 4px 20px rgba(74, 127, 196, 0.15);
}

/* 订单消息 - 青蓝色 */
.notification-item.order {
  border-left-color: #5DADE2;
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.08) 0%, rgba(133, 193, 233, 0.04) 100%);
}

.notification-item.order:hover {
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.15) 0%, rgba(133, 193, 233, 0.08) 100%);
  box-shadow: 0 4px 20px rgba(93, 173, 226, 0.15);
}

/* 促销活动 - 紫蓝色 */
.notification-item.promotion {
  border-left-color: #8E7CC3;
  background: linear-gradient(135deg, rgba(142, 124, 195, 0.08) 0%, rgba(165, 148, 210, 0.04) 100%);
}

.notification-item.promotion:hover {
  background: linear-gradient(135deg, rgba(142, 124, 195, 0.15) 0%, rgba(165, 148, 210, 0.08) 100%);
  box-shadow: 0 4px 20px rgba(142, 124, 195, 0.15);
}

/* 文件审核 - 橙色 */
.notification-item.file_review {
  border-left-color: #E67E22;
  background: linear-gradient(135deg, rgba(230, 126, 34, 0.08) 0%, rgba(243, 156, 18, 0.04) 100%);
}

.notification-item.file_review:hover {
  background: linear-gradient(135deg, rgba(230, 126, 34, 0.15) 0%, rgba(243, 156, 18, 0.08) 100%);
  box-shadow: 0 4px 20px rgba(230, 126, 34, 0.15);
}

/* 商品审核 - 绿色 */
.notification-item.product_review {
  border-left-color: #27AE60;
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.08) 0%, rgba(46, 204, 113, 0.04) 100%);
}

.notification-item.product_review:hover {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.15) 0%, rgba(46, 204, 113, 0.08) 100%);
  box-shadow: 0 4px 20px rgba(39, 174, 96, 0.15);
}

/* 商品评价 - 金黄色 */
.notification-item.review {
  border-left-color: #F1C40F;
  background: linear-gradient(135deg, rgba(241, 196, 15, 0.08) 0%, rgba(243, 156, 18, 0.04) 100%);
}

.notification-item.review:hover {
  background: linear-gradient(135deg, rgba(241, 196, 15, 0.15) 0%, rgba(243, 156, 18, 0.08) 100%);
  box-shadow: 0 4px 20px rgba(241, 196, 15, 0.15);
}

/* 未读状态 - 加深背景和左边框 */
.notification-item.unread {
  border-left-width: 6px;
}

.notification-item.unread.system {
  background: linear-gradient(135deg, rgba(74, 127, 196, 0.15) 0%, rgba(90, 143, 212, 0.08) 100%);
}

.notification-item.unread.order {
  background: linear-gradient(135deg, rgba(93, 173, 226, 0.15) 0%, rgba(133, 193, 233, 0.08) 100%);
}

.notification-item.unread.promotion {
  background: linear-gradient(135deg, rgba(142, 124, 195, 0.15) 0%, rgba(165, 148, 210, 0.08) 100%);
}

.notification-item.unread.file_review {
  background: linear-gradient(135deg, rgba(230, 126, 34, 0.15) 0%, rgba(243, 156, 18, 0.08) 100%);
}

.notification-item.unread.product_review {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.15) 0%, rgba(46, 204, 113, 0.08) 100%);
}

.notification-item.unread.review {
  background: linear-gradient(135deg, rgba(241, 196, 15, 0.15) 0%, rgba(243, 156, 18, 0.08) 100%);
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

.item-icon.system { color: #4A7FC4; background: rgba(74, 127, 196, 0.15); }
.item-icon.order { color: #5DADE2; background: rgba(93, 173, 226, 0.15); }
.item-icon.promotion { color: #8E7CC3; background: rgba(142, 124, 195, 0.15); }
.item-icon.file_review { color: #E67E22; background: rgba(230, 126, 34, 0.15); }
.item-icon.product_review { color: #27AE60; background: rgba(39, 174, 96, 0.15); }
.item-icon.review { color: #F1C40F; background: rgba(241, 196, 15, 0.15); }

/* 类型标签样式 */
.type-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
  letter-spacing: 0.5px;
}

.type-tag.system {
  background: linear-gradient(135deg, #4A7FC4, #5A8FD4);
  color: #fff;
  box-shadow: 0 2px 8px rgba(74, 127, 196, 0.3);
}

.type-tag.order {
  background: linear-gradient(135deg, #5DADE2, #85C1E9);
  color: #fff;
  box-shadow: 0 2px 8px rgba(93, 173, 226, 0.3);
}

.type-tag.promotion {
  background: linear-gradient(135deg, #8E7CC3, #A594D2);
  color: #fff;
  box-shadow: 0 2px 8px rgba(142, 124, 195, 0.3);
}

.type-tag.file_review {
  background: linear-gradient(135deg, #E67E22, #F39C12);
  color: #fff;
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.3);
}

.type-tag.product_review {
  background: linear-gradient(135deg, #27AE60, #2ECC71);
  color: #fff;
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
}

.type-tag.review {
  background: linear-gradient(135deg, #F1C40F, #F39C12);
  color: #fff;
  box-shadow: 0 2px 8px rgba(241, 196, 15, 0.3);
}

/* 右侧类型指示器 */
.type-indicator {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.type-indicator.system {
  background: linear-gradient(180deg, #4A7FC4, #5A8FD4);
}

.type-indicator.order {
  background: linear-gradient(180deg, #5DADE2, #85C1E9);
}

.type-indicator.promotion {
  background: linear-gradient(180deg, #8E7CC3, #A594D2);
}

.type-indicator.file_review {
  background: linear-gradient(180deg, #E67E22, #F39C12);
}

.type-indicator.product_review {
  background: linear-gradient(180deg, #27AE60, #2ECC71);
}

.type-indicator.review {
  background: linear-gradient(180deg, #F1C40F, #F39C12);
}

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

.item-title-row {
  display: flex;
  align-items: center;
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
  right: 20px;
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
  z-index: 2;
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
  background: linear-gradient(135deg, #4A7FC4, #5A8FD4);
  color: #fff;
}

.detail-type.order {
  background: linear-gradient(135deg, #5DADE2, #85C1E9);
  color: #fff;
}

.detail-type.promotion {
  background: linear-gradient(135deg, #8E7CC3, #A594D2);
  color: #fff;
}

.detail-type.file_review {
  background: linear-gradient(135deg, #E67E22, #F39C12);
  color: #fff;
}

.detail-type.product_review {
  background: linear-gradient(135deg, #27AE60, #2ECC71);
  color: #fff;
}

.detail-type.review {
  background: linear-gradient(135deg, #F1C40F, #F39C12);
  color: #fff;
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
