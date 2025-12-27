<template>
  <AdminLayout>
    <div class="products-manage">
      <!-- 操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="searchKeyword" placeholder="搜索商品名称" style="width: 240px" @keyup.enter="fetchProducts">
            <template #append>
              <el-button @click="fetchProducts">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="状态筛选" style="width: 120px" @change="fetchProducts">
            <el-option label="全部" :value="null" />
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="openDialog()">添加商品</el-button>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="table-card">
        <el-table :data="products" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="商品图片" width="100">
            <template #default="{ row }">
              <el-image :src="row.mainImage" style="width: 60px; height: 60px; border-radius: 8px" fit="cover">
                <template #error><div class="img-placeholder">暂无</div></template>
              </el-image>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="180" />
          <el-table-column prop="categoryId" label="分类" width="100">
            <template #default="{ row }">{{ getCategoryName(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.stock < 10 }">{{ row.stock }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sales" label="销量" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="fetchProducts" />
        </div>
      </div>

      <!-- 编辑弹窗 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '添加商品'" width="600px">
        <el-form :model="form" label-width="100px">
          <el-form-item label="商品名称" required>
            <el-input v-model="form.name" placeholder="请输入商品名称" />
          </el-form-item>
          <el-form-item label="商品分类" required>
            <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="商品价格" required>
            <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="原价">
            <el-input-number v-model="form.originalPrice" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="库存数量" required>
            <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="商品图片">
            <el-input v-model="form.mainImage" placeholder="请输入图片URL" />
          </el-form-item>
          <el-form-item label="商品描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
          </el-form-item>
          <el-form-item label="上架状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct" :loading="saving">保存</el-button>
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

const products = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const form = reactive({
  name: '',
  categoryId: null as number | null,
  price: 0,
  originalPrice: 0,
  stock: 0,
  mainImage: '',
  description: '',
  status: 1
})

const resetForm = () => {
  form.name = ''
  form.categoryId = null
  form.price = 0
  form.originalPrice = 0
  form.stock = 0
  form.mainImage = ''
  form.description = ''
  form.status = 1
}

const openDialog = (product?: any) => {
  if (product) {
    isEdit.value = true
    editId.value = product.id
    Object.assign(form, product)
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const getCategoryName = (id: number) => categories.value.find(c => c.id === id)?.name || '-'

const fetchCategories = async () => {
  try {
    const res: any = await adminApi.getCategories()
    if (res?.code === 200) categories.value = res.data || []
  } catch (e) { console.error(e) }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value - 1, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value !== null) params.status = filterStatus.value
    
    const res: any = await adminApi.getProducts(params)
    if (res?.code === 200) {
      products.value = res.data?.content || []
      total.value = res.data?.totalElements || 0
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const saveProduct = async () => {
  if (!form.name || !form.categoryId || form.price <= 0) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await adminApi.updateProduct(editId.value, form)
      ElMessage.success('商品更新成功')
    } else {
      await adminApi.createProduct(form)
      ElMessage.success('商品添加成功')
    }
    dialogVisible.value = false
    fetchProducts()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally { saving.value = false }
}

const toggleStatus = async (product: any) => {
  try {
    await adminApi.updateProduct(product.id, { status: product.status })
    ElMessage.success(product.status === 1 ? '已上架' : '已下架')
  } catch (e) {
    product.status = product.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (product: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品"${product.name}"吗？`, '提示', { type: 'warning' })
    await adminApi.deleteProduct(product.id)
    ElMessage.success('删除成功')
    fetchProducts()
  } catch {}
}

onMounted(() => {
  fetchCategories()
  fetchProducts()
})
</script>

<style scoped>
.products-manage { max-width: 1400px; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.img-placeholder {
  width: 60px;
  height: 60px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  border-radius: 8px;
}

.low-stock {
  color: #e74c3c;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
</style>
