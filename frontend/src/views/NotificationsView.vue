<template>
  <div class="notifications-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 消息通知内容 -->
    <section class="notifications-content">
      <div class="container">
        <h2 class="section-title">消息通知</h2>
        
        <!-- 通知标签 -->
        <div class="notifications-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all">
              <div class="notifications-list">
                <el-empty description="暂无通知" :image-size="200">
                  <el-button type="primary" @click="refreshNotifications">刷新</el-button>
                </el-empty>
              </div>
            </el-tab-pane>
            <el-tab-pane label="未读" name="unread">
              <div class="notifications-list">
                <el-empty description="暂无未读通知" :image-size="200">
                  <el-button type="primary" @click="refreshNotifications">刷新</el-button>
                </el-empty>
              </div>
            </el-tab-pane>
            <el-tab-pane label="系统" name="system">
              <div class="notifications-list">
                <el-empty description="暂无系统通知" :image-size="200">
                  <el-button type="primary" @click="refreshNotifications">刷新</el-button>
                </el-empty>
              </div>
            </el-tab-pane>
            <el-tab-pane label="促销" name="promotion">
              <div class="notifications-list">
                <el-empty description="暂无促销通知" :image-size="200">
                  <el-button type="primary" @click="refreshNotifications">刷新</el-button>
                </el-empty>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()

// 当前激活的标签
const activeTab = ref('all')

// 消息通知列表
const notifications = ref([])

// 刷新通知
const refreshNotifications = () => {
  ElMessage.info('刷新通知')
}

// 处理标签切换
const handleTabChange = (tab) => {
  console.log('切换到标签:', tab)
}

// 页面加载时获取通知
onMounted(() => {
  // 这里可以调用API获取通知列表
  console.log('消息通知页面加载')
})
</script>

<style scoped>
/* 全局样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  margin: 40px 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

/* 导航栏 */
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 消息通知内容 */
.notifications-content {
  margin: 40px 0;
}

.notifications-tabs {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.notifications-list {
  padding: 20px 0;
}

/* 通知项样式 */
.notification-item {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.notification-item:hover {
  background-color: #fafafa;
}

.notification-item:last-child {
  border-bottom: none;
}

/* 页脚 */
.footer {
  background-color: #333;
  color: #fff;
  padding: 40px 0;
  margin-top: 60px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notifications-tabs {
    padding: 10px;
  }
  
  .section-title {
    font-size: 20px;
    margin: 20px 0;
  }
  
  .notifications-content {
    margin: 20px 0;
  }
}
</style>