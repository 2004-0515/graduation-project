<template>
  <AdminLayout>
    <div class="categories-manage" data-testid="admin-categories-view">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="total-count">共 {{ categories.length }} 个分类</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" data-testid="admin-category-add" @click="openDialog()">添加分类</el-button>
        </div>
      </div>

      <div class="table-card">
        <el-table :data="categories" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="分类名称" min-width="150" />
          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="{ row }">{{ row.description || '-' }}</template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '添加分类'" width="500px">
        <el-form :model="form" label-width="100px">
          <el-form-item label="分类名称" required>
            <el-input v-model="form.name" placeholder="请输入分类名称" data-testid="admin-category-name" />
          </el-form-item>
          <el-form-item label="分类描述">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入分类描述" data-testid="admin-category-description" />
          </el-form-item>
          <el-form-item label="分类图标">
            <div class="category-icon-field">
              <el-upload
                class="category-icon-uploader"
                data-testid="admin-category-icon-upload"
                :show-file-list="false"
                :before-upload="beforeCategoryIconUpload"
                :http-request="handleCategoryIconUpload"
                accept="image/*"
              >
                <div class="category-icon-card" :class="{ uploading: uploadingIcon }">
                  <img
                    v-if="form.icon"
                    :src="getImageUrl(form.icon)"
                    alt="分类图标"
                    class="category-icon-preview"
                    data-testid="admin-category-icon-preview"
                  />
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传图标</span>
                  </div>
                </div>
              </el-upload>
              <div class="category-icon-meta">
                <span class="upload-tip">支持 jpg、png、webp，最大 2MB</span>
                <el-button
                  v-if="form.icon"
                  link
                  type="danger"
                  data-testid="admin-category-icon-clear"
                  @click="clearCategoryIcon"
                >
                  移除图标
                </el-button>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" data-testid="admin-category-save" @click="saveCategory" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'
import fileApi from '@/api/fileApi'
import { debugError } from '@/utils/debug'

const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const uploadingIcon = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
let latestCategoriesRequestId = 0
const invalidateCategoryRequests = () => {
  latestCategoriesRequestId += 1
}

const form = reactive({
  name: '',
  description: '',
  icon: '',
  sortOrder: 0,
  status: 1
})

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.icon = ''
  form.sortOrder = 0
  form.status = 1
}

const closeDialog = () => {
  dialogVisible.value = false
  isEdit.value = false
  editId.value = null
  resetForm()
}

const normalizePayload = () => ({
  name: form.name.trim(),
  description: form.description?.trim() || '',
  icon: form.icon.trim() || null,
  sortOrder: Number(form.sortOrder || 0),
  status: Number(form.status ?? 1)
})

const syncFormFromCategory = (category: any) => {
  Object.assign(form, {
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '',
    sortOrder: category?.sortOrder ?? 0,
    status: category?.status ?? 1
  })
}

const openDialog = (category?: any) => {
  if (category) {
    isEdit.value = true
    editId.value = category.id
    syncFormFromCategory(category)
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const beforeCategoryIconUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleCategoryIconUpload = async (options: any) => {
  uploadingIcon.value = true
  try {
    const res: any = await fileApi.uploadCategoryImage(options.file)
    if (res?.code === 200 && res.data) {
      form.icon = res.data
      ElMessage.success(res?.message || '分类图标上传成功')
      return
    }
    ElMessage.error(res?.message || '分类图标上传失败')
  } catch (error) {
    debugError('上传分类图标失败', error)
    ElMessage.error(getErrorMessage(error, '分类图标上传失败'))
  } finally {
    uploadingIcon.value = false
  }
}

const clearCategoryIcon = () => {
  form.icon = ''
}

const fetchCategories = async () => {
  const requestId = ++latestCategoriesRequestId
  loading.value = true
  try {
    const res: any = await adminApi.getCategories()
    if (requestId !== latestCategoriesRequestId) {
      return
    }
    if (res?.code === 200) {
      applyLocalCategories(res.data || [])
    } else {
      debugError('获取分类管理列表失败:', res?.message || '业务返回异常')
    }
  } catch (e) {
    if (requestId !== latestCategoriesRequestId) {
      return
    }
    debugError('获取分类管理列表失败', e)
  }
  finally {
    if (requestId === latestCategoriesRequestId) {
      loading.value = false
    }
  }
}

const getResponseMessage = (res: any, fallback: string) => res?.message || fallback

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const refreshCategoriesAfterSuccess = async (actionLabel: string) => {
  try {
    await fetchCategories()
  } catch (error) {
    debugError(`${actionLabel}成功后刷新分类列表失败`, error)
  }
}

const applyLocalCategories = (nextCategories: any[]) => {
  categories.value = nextCategories
  if (!isEdit.value || editId.value === null) return
  const matchedCategory = nextCategories.find((item) => item.id === editId.value)
  if (!matchedCategory) {
    closeDialog()
    return
  }
  syncFormFromCategory(matchedCategory)
}

const saveCategory = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  saving.value = true
  try {
    const actionLabel = isEdit.value ? '保存分类' : '新增分类'
    const payload = normalizePayload()
    if (isEdit.value && editId.value) {
      const res: any = await adminApi.updateCategory(editId.value, payload)
      if (res?.code === 200) {
        invalidateCategoryRequests()
        const updatedCategory = res?.data && typeof res.data === 'object'
          ? res.data
          : {
              ...payload,
              id: editId.value
            }
        applyLocalCategories(
          categories.value.map((item) => (item.id === editId.value ? updatedCategory : item))
        )
        ElMessage.success(getResponseMessage(res, '分类更新成功'))
      } else {
        const message = getResponseMessage(res, '保存失败')
        debugError('保存分类失败', message)
        ElMessage.error(message)
        return
      }
    } else {
      const res: any = await adminApi.createCategory(payload)
      if (res?.code === 200) {
        invalidateCategoryRequests()
        const createdCategory = res?.data && typeof res.data === 'object'
          ? res.data
          : {
              ...payload,
              id: Date.now()
            }
        applyLocalCategories([...categories.value, createdCategory])
        ElMessage.success(getResponseMessage(res, '分类添加成功'))
      } else {
        const message = getResponseMessage(res, '保存失败')
        debugError('保存分类失败', message)
        ElMessage.error(message)
        return
      }
    }
    closeDialog()
    await refreshCategoriesAfterSuccess(actionLabel)
  } catch (e) {
    debugError('保存分类失败', e)
    ElMessage.error(getErrorMessage(e, '保存失败'))
  } finally { saving.value = false }
}

const handleDelete = async (category: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？删除后该分类下的商品将无法显示。`, '提示', { type: 'warning' })
    const res: any = await adminApi.deleteCategory(category.id)
    if (res?.code === 200) {
      invalidateCategoryRequests()
      applyLocalCategories(categories.value.filter((item) => item.id !== category.id))
      ElMessage.success(getResponseMessage(res, '删除成功'))
    } else {
      const message = getResponseMessage(res, '删除失败')
      debugError('删除分类失败', message)
      ElMessage.error(message)
      return
    }
    await refreshCategoriesAfterSuccess('删除分类')
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    debugError('删除分类失败', error)
    ElMessage.error(getErrorMessage(error, '删除失败'))
  }
}

onMounted(() => fetchCategories())
</script>

<style scoped>
.categories-manage { 
  width: 100%;
  max-width: 100%;
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
  min-height: calc(100vh - 250px);
}

.category-icon-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.category-icon-card {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 10px;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.category-icon-card.uploading {
  opacity: 0.6;
}

.category-icon-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.category-icon-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
</style>
