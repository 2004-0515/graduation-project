<template>
  <AdminLayout>
    <div class="users-manage">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="searchKeyword" placeholder="搜索用户名/邮箱" style="width: 240px" @keyup.enter="fetchUsers">
            <template #append>
              <el-button @click="fetchUsers">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="状态筛选" style="width: 120px" @change="fetchUsers">
            <el-option label="全部" :value="null" />
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <span class="total-count">共 {{ total }} 位用户</span>
        </div>
      </div>

      <div class="table-card">
        <el-table :data="users" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :size="40" :src="row.avatar || defaultAvatar">{{ row.username?.charAt(0).toUpperCase() }}</el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="nickname" label="昵称" width="120">
            <template #default="{ row }">{{ row.nickname || '-' }}</template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column prop="phone" label="手机号" width="130">
            <template #default="{ row }">{{ row.phone || '-' }}</template>
          </el-table-column>
          <el-table-column prop="points" label="积分" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdTime" label="注册时间" width="160">
            <template #default="{ row }">{{ formatDate(row.createdTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
              <el-button v-if="row.status === 1" type="warning" link @click="toggleStatus(row, 0)">禁用</el-button>
              <el-button v-else type="success" link @click="toggleStatus(row, 1)">启用</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="fetchUsers" />
        </div>
      </div>

      <!-- 用户详情弹窗 -->
      <el-dialog v-model="detailVisible" title="用户详情" width="600px">
        <div class="user-detail" v-if="currentUser">
          <div class="user-header">
            <el-avatar :size="80" :src="currentUser.avatar || defaultAvatar">{{ currentUser.username?.charAt(0).toUpperCase() }}</el-avatar>
            <div class="user-info">
              <h3>{{ currentUser.nickname || currentUser.username }}</h3>
              <p>@{{ currentUser.username }}</p>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">用户ID</span>
              <span class="value">{{ currentUser.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">邮箱</span>
              <span class="value">{{ currentUser.email }}</span>
            </div>
            <div class="detail-item">
              <span class="label">手机号</span>
              <span class="value">{{ currentUser.phone || '未绑定' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">积分</span>
              <span class="value">{{ currentUser.points }}</span>
            </div>
            <div class="detail-item">
              <span class="label">成长值</span>
              <span class="value">{{ currentUser.growthValue }}</span>
            </div>
            <div class="detail-item">
              <span class="label">会员天数</span>
              <span class="value">{{ currentUser.memberDays }} 天</span>
            </div>
            <div class="detail-item">
              <span class="label">注册时间</span>
              <span class="value">{{ formatDate(currentUser.createdTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">最后登录</span>
              <span class="value">{{ formatDate(currentUser.lastLoginTime) || '从未登录' }}</span>
            </div>
          </div>

          <div class="bio-section" v-if="currentUser.bio">
            <span class="label">个人简介</span>
            <p>{{ currentUser.bio }}</p>
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

const users = ref<any[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentUser = ref<any>(null)

const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const defaultAvatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=default'

const formatDate = (dateStr: string) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value - 1, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value !== null) params.status = filterStatus.value
    
    const res: any = await adminApi.getUsers(params)
    if (res?.code === 200) {
      users.value = res.data?.content || []
      total.value = res.data?.totalElements || 0
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const viewDetail = (user: any) => {
  currentUser.value = user
  detailVisible.value = true
}

const toggleStatus = async (user: any, status: number) => {
  const action = status === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户"${user.username}"吗？`, '提示', { type: 'warning' })
    await adminApi.updateUserStatus(user.id, status)
    user.status = status
    ElMessage.success(`用户已${action}`)
  } catch {}
}

onMounted(() => fetchUsers())
</script>

<style scoped>
.users-manage { max-width: 1400px; }

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

.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

/* 用户详情 */
.user-detail { padding: 0 10px; }

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.user-info h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #1a1f36;
}

.user-info p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 13px;
  color: #999;
}

.detail-item .value {
  font-size: 15px;
  color: #1a1f36;
}

.bio-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.bio-section .label {
  font-size: 13px;
  color: #999;
  display: block;
  margin-bottom: 8px;
}

.bio-section p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
</style>
