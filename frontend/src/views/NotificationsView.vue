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
                @click="activeTab = tab.name"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="actions">
              <button class="action-btn" @click="markAllRead">全部已读</button>
            </div>
          </div>

          <div class="notifications-list">
            <template v-if="filteredNotifications.length > 0">
              <div 
                v-for="item in filteredNotifications" 
                :key="item.id"
                :class="['notification-item', { unread: !item.read }]"
                @click="item.read = true"
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
                    <span class="item-time">{{ item.time }}</span>
                  </div>
                  <p>{{ item.message }}</p>
                </div>
                <span v-if="!item.read" class="unread-dot"></span>
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

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const tabs = [
  { name: 'all', label: '全部' },
  { name: 'unread', label: '未读' },
  { name: 'system', label: '系统' },
  { name: 'promotion', label: '促销' }
]

const activeTab = ref('all')

const notifications = ref([
  { id: 1, type: 'system', title: '系统维护通知', message: '系统将于今晚22:00-24:00进行维护升级', time: '10分钟前', read: false },
  { id: 2, type: 'promotion', title: '限时优惠', message: '全场商品低至5折起，活动时间有限', time: '1小时前', read: false },
  { id: 3, type: 'order', title: '订单发货', message: '您的订单已发货，请注意查收', time: '2小时前', read: true },
  { id: 4, type: 'system', title: '账户安全', message: '检测到您的账户在新设备上登录', time: '昨天', read: true },
])

const totalCount = computed(() => notifications.value.length)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const filteredNotifications = computed(() => {
  switch (activeTab.value) {
    case 'unread': return notifications.value.filter(n => !n.read)
    case 'system': return notifications.value.filter(n => n.type === 'system')
    case 'promotion': return notifications.value.filter(n => n.type === 'promotion')
    default: return notifications.value
  }
})

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
  ElMessage.success('已全部标记为已读')
}
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

.action-btn:hover {
  border-color: var(--sakura);
  color: var(--sakura);
}

/* List */
.notifications-list {
  padding: 12px;
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

.item-icon.system { color: var(--sakura); }
.item-icon.promotion { color: #5A8FD4; }

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
}
</style>
