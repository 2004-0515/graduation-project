<template>
  <AdminLayout>
    <div class="notifications-manage">
      <div class="page-header">
        <h2>消息管理</h2>
        <p>向用户发送系统通知、促销信息等</p>
      </div>

      <!-- 发送消息表单 -->
      <div class="send-card">
        <h3>发送新消息</h3>
        <el-form :model="form" label-width="100px" class="send-form">
          <el-form-item label="发送对象">
            <el-radio-group v-model="form.target">
              <el-radio value="all">所有用户</el-radio>
              <el-radio value="selected">指定用户</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="form.target === 'selected'" label="选择用户">
            <el-select
              v-model="form.selectedUsers"
              multiple
              filterable
              placeholder="搜索并选择用户"
              style="width: 100%"
            >
              <el-option
                v-for="user in users"
                :key="user.id"
                :label="`${user.username} (${user.email})`"
                :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="消息类型">
            <el-select v-model="form.type" placeholder="选择类型" style="width: 200px">
              <el-option label="系统通知" value="system" />
              <el-option label="促销活动" value="promotion" />
              <el-option label="订单相关" value="order" />
            </el-select>
          </el-form-item>

          <el-form-item label="消息标题">
            <el-input v-model="form.title" placeholder="请输入消息标题" maxlength="50" show-word-limit />
          </el-form-item>

          <el-form-item label="消息内容">
            <el-input
              v-model="form.message"
              type="textarea"
              :rows="4"
              placeholder="请输入消息内容"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="sendMessage" :loading="sending">
              <el-icon><Promotion /></el-icon>
              发送消息
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 快捷模板 -->
      <div class="templates-card">
        <h3>快捷模板</h3>
        <div class="templates-grid">
          <div class="template-item" @click="useTemplate('welcome')">
            <div class="template-icon system">👋</div>
            <div class="template-info">
              <span class="template-name">欢迎消息</span>
              <span class="template-desc">欢迎新用户加入</span>
            </div>
          </div>
          <div class="template-item" @click="useTemplate('promotion')">
            <div class="template-icon promotion">🎉</div>
            <div class="template-info">
              <span class="template-name">促销活动</span>
              <span class="template-desc">限时优惠通知</span>
            </div>
          </div>
          <div class="template-item" @click="useTemplate('maintenance')">
            <div class="template-icon system">🔧</div>
            <div class="template-info">
              <span class="template-name">系统维护</span>
              <span class="template-desc">维护公告通知</span>
            </div>
          </div>
          <div class="template-item" @click="useTemplate('newProduct')">
            <div class="template-icon promotion">✨</div>
            <div class="template-info">
              <span class="template-name">新品上架</span>
              <span class="template-desc">新品推荐通知</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'

const users = ref<any[]>([])
const sending = ref(false)

const form = reactive({
  target: 'all',
  selectedUsers: [] as number[],
  type: 'system',
  title: '',
  message: ''
})

const templates = {
  welcome: {
    type: 'system',
    title: '欢迎加入雅集',
    message: '感谢您注册成为雅集会员！在这里您可以发现各种精选好物，享受优质的购物体验。如有任何问题，请随时联系我们的客服团队。'
  },
  promotion: {
    type: 'promotion',
    title: '限时优惠活动',
    message: '尊敬的用户，我们正在举办限时优惠活动！全场商品低至5折起，活动时间有限，快来选购心仪的商品吧！'
  },
  maintenance: {
    type: 'system',
    title: '系统维护通知',
    message: '尊敬的用户，为了给您提供更好的服务，我们将于今晚22:00-24:00进行系统维护升级，届时部分功能可能暂时无法使用，给您带来的不便敬请谅解。'
  },
  newProduct: {
    type: 'promotion',
    title: '新品上架通知',
    message: '尊敬的用户，我们上架了一批精选新品！涵盖多个品类，品质保证，价格优惠。快来看看有没有您心仪的商品吧！'
  }
}

const fetchUsers = async () => {
  try {
    const res: any = await adminApi.getUsers({ page: 0, size: 1000 })
    if (res?.code === 200) {
      users.value = res.data?.content || res.data || []
    }
  } catch (e) {
    console.error('获取用户列表失败', e)
  }
}

const useTemplate = (key: keyof typeof templates) => {
  const template = templates[key]
  form.type = template.type
  form.title = template.title
  form.message = template.message
}

const resetForm = () => {
  form.target = 'all'
  form.selectedUsers = []
  form.type = 'system'
  form.title = ''
  form.message = ''
}

const sendMessage = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请输入消息标题')
    return
  }
  if (!form.message.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  if (form.target === 'selected' && form.selectedUsers.length === 0) {
    ElMessage.warning('请选择发送对象')
    return
  }

  sending.value = true
  try {
    const userIds = form.target === 'all' 
      ? users.value.map(u => u.id) 
      : form.selectedUsers

    await adminApi.broadcastNotification({
      userIds,
      type: form.type,
      title: form.title,
      message: form.message
    })
    
    ElMessage.success(`消息已发送给 ${userIds.length} 位用户`)
    resetForm()
  } catch (e) {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.notifications-manage {
  max-width: 900px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0 0 8px;
}

.page-header p {
  color: #666;
  margin: 0;
}

.send-card, .templates-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 24px;
}

.send-card h3, .templates-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.send-form {
  max-width: 600px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.template-item:hover {
  background: #f0f7ff;
  border-color: #5A8FD4;
}

.template-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 10px;
}

.template-icon.system {
  background: rgba(90, 143, 212, 0.1);
}

.template-icon.promotion {
  background: rgba(230, 126, 34, 0.1);
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1f36;
}

.template-desc {
  font-size: 12px;
  color: #999;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 20px;
}
</style>
