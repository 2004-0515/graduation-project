<template>
  <AdminLayout>
    <div class="categories-manage">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="total-count">共 {{ categories.length }} 个分类</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="openDialog()">添加分类</el-button>
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
            <el-input v-model="form.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="分类描述">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入分类描述" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCategory" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'

const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  name: '',
  description: '',
  sortOrder: 0,
  status: 1
})

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.sortOrder = 0
  form.status = 1
}

const openDialog = (category?: any) => {
  if (category) {
    isEdit.value = true
    editId.value = category.id
    Object.assign(form, category)
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const res: any = await adminApi.getCategories()
    if (res?.code === 200) categories.value = res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const saveCategory = async () => {
  if (!form.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await adminApi.updateCategory(editId.value, form)
      ElMessage.success('分类更新成功')
    } else {
      await adminApi.createCategory(form)
      ElMessage.success('分类添加成功')
    }
    dialogVisible.value = false
    fetchCategories()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally { saving.value = false }
}

const handleDelete = async (category: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？删除后该分类下的商品将无法显示。`, '提示', { type: 'warning' })
    await adminApi.deleteCategory(category.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch {}
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

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
</style>
