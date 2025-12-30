<template>
  <AdminLayout>
    <div class="file-review-page">
      <div class="page-header">
        <h1>文件审核</h1>
        <p>审核用户上传的图片</p>
      </div>

      <div class="filter-bar">
        <el-select v-model="filters.status" placeholder="审核状态" clearable @change="fetchFiles">
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-select v-model="filters.fileType" placeholder="文件类型" clearable @change="fetchFiles">
          <el-option label="用户头像" value="AVATAR" />
          <el-option label="商品图片" value="PRODUCT" />
          <el-option label="评价图片" value="REVIEW" />
        </el-select>
        <el-button @click="fetchFiles">刷新</el-button>
      </div>

      <div class="file-grid" v-if="files.length > 0">
        <div v-for="file in files" :key="file.id" class="file-card" :class="getStatusClass(file.status)">
          <div class="file-image" @click="previewImage(file)">
            <img :src="getImageUrl(file.filePath)" :alt="file.originalName" />
            <div class="file-overlay">
              <span>点击预览</span>
            </div>
          </div>
          <div class="file-info">
            <div class="file-meta">
              <span class="file-type">{{ getFileTypeLabel(file.fileType) }}</span>
              <span class="file-status" :class="getStatusClass(file.status)">{{ getStatusLabel(file.status) }}</span>
            </div>
            <p class="file-user">上传者: {{ file.username }}</p>
            <p class="file-time">{{ formatTime(file.createdTime) }}</p>
            <p class="file-name" :title="file.originalName">{{ file.originalName }}</p>
          </div>
          <div class="file-actions" v-if="file.status === 0">
            <el-button type="success" size="small" @click="handleReview(file, 1)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReview(file, 2)">拒绝</el-button>
            <el-button type="info" size="small" @click="handleDelete(file)">删除</el-button>
          </div>
          <div class="file-review-info" v-else>
            <p v-if="file.reviewerName">审核人: {{ file.reviewerName }}</p>
            <p v-if="file.reviewRemark">备注: {{ file.reviewRemark }}</p>
            <el-button type="danger" size="small" plain @click="handleDelete(file)" style="margin-top: 8px;">删除记录</el-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>暂无文件</p>
      </div>

      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="pageNo"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchFiles"
        />
      </div>

      <!-- 图片预览 -->
      <el-dialog v-model="previewVisible" title="图片预览" width="600px">
        <img :src="previewUrl" style="width: 100%;" />
      </el-dialog>

      <!-- 拒绝原因弹窗 -->
      <el-dialog v-model="rejectVisible" title="拒绝原因" width="400px">
        <el-input v-model="rejectRemark" type="textarea" :rows="3" placeholder="请输入拒绝原因（可选）" />
        <template #footer>
          <el-button @click="rejectVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import axios from '@/utils/axios'
import fileApi from '@/api/fileApi'

// 注入刷新侧边栏待审核数量的方法
const refreshPendingFileCount = inject<() => void>('refreshPendingFileCount', () => {})

const files = ref<any[]>([])
const pageNo = ref(1)
const pageSize = ref(12)
const total = ref(0)

const filters = reactive({
  status: null as number | null,
  fileType: ''
})

const previewVisible = ref(false)
const previewUrl = ref('')
const rejectVisible = ref(false)
const rejectRemark = ref('')
const currentFile = ref<any>(null)

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const getFileTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    AVATAR: '用户头像',
    PRODUCT: '商品图片',
    CATEGORY: '分类图片',
    PROMOTION: '促销图片',
    REVIEW: '评价图片'
  }
  return map[type] || type
}

const getStatusLabel = (status: number) => {
  return ['待审核', '已通过', '已拒绝'][status] || '未知'
}

const getStatusClass = (status: number) => {
  return ['pending', 'approved', 'rejected'][status] || ''
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const fetchFiles = async () => {
  try {
    const params: any = { pageNo: pageNo.value - 1, pageSize: pageSize.value }
    if (filters.status !== null) params.status = filters.status
    if (filters.fileType) params.fileType = filters.fileType
    
    const res: any = await axios.get('/files/pending', { params })
    if (res?.code === 200) {
      files.value = res.data?.content || []
      total.value = res.data?.totalElements || 0
    }
  } catch (e) {
    console.error(e)
  }
}

const previewImage = (file: any) => {
  previewUrl.value = getImageUrl(file.filePath)
  previewVisible.value = true
}

const handleReview = async (file: any, status: number) => {
  if (status === 2) {
    currentFile.value = file
    rejectRemark.value = ''
    rejectVisible.value = true
    return
  }
  
  try {
    const res: any = await axios.put(`/files/${file.id}/review`, { status, remark: '审核通过' })
    if (res?.code === 200) {
      ElMessage.success('审核通过')
      fetchFiles()
      refreshPendingFileCount() // 刷新侧边栏数量
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const confirmReject = async () => {
  if (!currentFile.value) return
  
  try {
    const res: any = await axios.put(`/files/${currentFile.value.id}/review`, { 
      status: 2, 
      remark: rejectRemark.value || '审核未通过' 
    })
    if (res?.code === 200) {
      ElMessage.success('已拒绝')
      rejectVisible.value = false
      fetchFiles()
      refreshPendingFileCount() // 刷新侧边栏数量
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (file: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除文件"${file.originalName}"吗？此操作不可恢复。`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res: any = await axios.delete(`/files/${file.id}`)
    if (res?.code === 200) {
      ElMessage.success('删除成功')
      fetchFiles()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => fetchFiles())
</script>

<style scoped>
.file-review-page { padding: 24px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; margin: 0 0 8px; }
.page-header p { color: #666; margin: 0; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 24px; }
.filter-bar .el-select { width: 150px; }

.file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }

.file-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: all 0.3s; }
.file-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); transform: translateY(-2px); }
.file-card.pending { border-left: 4px solid #e6a23c; }
.file-card.approved { border-left: 4px solid #67c23a; }
.file-card.rejected { border-left: 4px solid #f56c6c; }

.file-image { position: relative; height: 160px; background: #f5f5f5; cursor: pointer; overflow: hidden; }
.file-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.file-image:hover img { transform: scale(1.05); }
.file-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
.file-overlay span { color: #fff; font-size: 14px; }
.file-image:hover .file-overlay { opacity: 1; }

.file-info { padding: 16px; }
.file-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.file-type { font-size: 12px; padding: 2px 8px; background: #f0f0f0; border-radius: 4px; }
.file-status { font-size: 12px; font-weight: 500; }
.file-status.pending { color: #e6a23c; }
.file-status.approved { color: #67c23a; }
.file-status.rejected { color: #f56c6c; }

.file-user, .file-time { font-size: 13px; color: #666; margin: 4px 0; }
.file-name { font-size: 12px; color: #999; margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.file-actions { padding: 12px 16px; border-top: 1px solid #eee; display: flex; gap: 8px; }
.file-review-info { padding: 12px 16px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
.file-review-info p { margin: 4px 0; }

.empty-state { text-align: center; padding: 60px; color: #999; }
.pagination { margin-top: 24px; display: flex; justify-content: center; }
</style>
