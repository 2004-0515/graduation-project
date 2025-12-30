<template>
  <div class="my-products-page">
    <Navbar />
    <div class="container">
      <div class="page-header">
        <h1>我的商品</h1>
        <el-button type="primary" @click="openDialog()">发布商品</el-button>
      </div>

      <!-- 商品列表 -->
      <div class="products-list" v-loading="loading">
        <div v-if="products.length === 0" class="empty-state">
          <el-empty description="暂无商品，点击上方按钮发布您的第一个商品" />
        </div>
        
        <div v-else class="product-cards">
          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-image">
              <el-image :src="getImageUrl(product.mainImage)" fit="cover">
                <template #error><div class="img-placeholder">暂无图片</div></template>
              </el-image>
              <div class="audit-badge" :class="getAuditClass(product.auditStatus)">
                {{ getAuditText(product.auditStatus) }}
              </div>
            </div>
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="price">¥{{ product.price }}</p>
              <p class="stock">库存: {{ product.stock }} | 销量: {{ product.sales }}</p>
              <p v-if="product.auditStatus === 2" class="reject-reason">
                拒绝原因: {{ product.auditRemark || '无' }}
              </p>
            </div>
            <div class="product-actions">
              <el-button size="small" @click="openDialog(product)" :disabled="product.auditStatus === 0">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(product)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 发布/编辑弹窗 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '发布商品'" width="600px">
        <el-form :model="form" label-width="100px">
          <el-form-item label="商品名称" required>
            <el-input v-model="form.name" placeholder="请输入商品名称" maxlength="100" />
          </el-form-item>
          <el-form-item label="商品分类" required>
            <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="商品价格" required>
            <el-input-number v-model="form.price" :min="0" :precision="2" placeholder="请输入价格" style="width: 100%" />
          </el-form-item>
          <el-form-item label="原价">
            <el-input-number v-model="form.originalPrice" :min="0" :precision="2" placeholder="可选" style="width: 100%" />
          </el-form-item>
          <el-form-item label="库存数量" required>
            <el-input-number v-model="form.stock" :min="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="商品图片">
            <div class="image-upload-area">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :http-request="handleImageUpload"
                :before-upload="beforeUpload"
                accept="image/*"
              >
                <el-image v-if="form.mainImage" :src="getImageUrl(form.mainImage)" class="preview-image" fit="cover" />
                <div v-else class="upload-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>上传图片</span>
                </div>
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item label="商品描述">
            <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入商品描述" />
          </el-form-item>
          <el-form-item label="广告视频">
            <div class="video-upload-area">
              <el-upload
                class="video-uploader"
                :show-file-list="false"
                :before-upload="beforeVideoUpload"
                :http-request="handleVideoUpload"
                accept="video/*"
              >
                <div v-if="form.adVideo" class="video-preview">
                  <video :src="getVideoUrl(form.adVideo)" class="preview-video"></video>
                  <div class="video-actions">
                    <span @click.stop="form.adVideo = ''">删除</span>
                  </div>
                </div>
                <div v-else class="upload-placeholder video-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>上传广告视频</span>
                </div>
              </el-upload>
              <div class="upload-tip">支持 mp4、webm 格式，最大 50MB（需管理员审核后启用）</div>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProduct" :loading="saving">
            {{ isEdit ? '保存' : '提交审核' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import axios from '@/utils/axios'
import fileApi from '@/api/fileApi'

const products = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const form = reactive({
  name: '',
  categoryId: null as number | null,
  price: null as number | null,
  originalPrice: null as number | null,
  stock: 1,
  mainImage: '',
  description: '',
  adVideo: ''
})

const resetForm = () => {
  form.name = ''
  form.categoryId = null
  form.price = null
  form.originalPrice = null
  form.stock = 1
  form.mainImage = ''
  form.description = ''
  form.adVideo = ''
}

const getAuditClass = (status: number) => {
  const map: Record<number, string> = { 0: 'pending', 1: 'approved', 2: 'rejected' }
  return map[status] || 'pending'
}

const getAuditText = (status: number) => {
  const map: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
  return map[status] || '未知'
}

const openDialog = (product?: any) => {
  if (product) {
    isEdit.value = true
    editId.value = product.id
    Object.assign(form, {
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      stock: product.stock,
      mainImage: product.mainImage,
      description: product.description,
      adVideo: product.adVideo || ''
    })
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const fetchCategories = async () => {
  try {
    const res: any = await axios.get('/categories')
    if (res?.code === 200) categories.value = res.data || []
  } catch (e) { console.error(e) }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const res: any = await axios.get('/products/my')
    if (res?.code === 200) products.value = res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}

const handleImageUpload = async (options: any) => {
  try {
    // 获取当前选择的分类名称，用于按分类存储图片
    const categoryName = form.categoryId 
      ? categories.value.find(c => c.id === form.categoryId)?.name 
      : undefined
    // 编辑时传入商品ID，审核通过后自动更新商品图片
    const productId = isEdit.value && editId.value ? editId.value : undefined
    const res: any = await fileApi.uploadProductImage(options.file, categoryName, productId)
    if (res?.code === 200 && res.data) {
      form.mainImage = res.data
      ElMessage.success(res.message || '图片上传成功')
    } else {
      ElMessage.error(res?.message || '上传失败')
    }
  } catch (e) {
    ElMessage.error('图片上传失败')
  }
}

const beforeVideoUpload = (file: File) => {
  const isVideo = file.type.startsWith('video/')
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isVideo) {
    ElMessage.error('只能上传视频文件')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('视频大小不能超过50MB')
    return false
  }
  return true
}

const handleVideoUpload = async (options: any) => {
  try {
    const res: any = await fileApi.uploadAdVideo(options.file)
    if (res?.code === 200 && res.data) {
      form.adVideo = res.data
      ElMessage.success('视频上传成功')
    } else {
      ElMessage.error(res?.message || '上传失败')
    }
  } catch (e) {
    ElMessage.error('视频上传失败')
  }
}

const getVideoUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `http://localhost:8080/api${normalizedPath}`
}

const submitProduct = async () => {
  if (!form.name || !form.categoryId || !form.price || form.price <= 0 || form.stock < 1) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  saving.value = true
  try {
    const productData = {
      ...form,
      adVideo: form.adVideo || null
    }
    
    if (isEdit.value && editId.value) {
      const res: any = await axios.put(`/products/${editId.value}`, productData)
      ElMessage.success(res?.message || '商品修改成功，等待管理员审核')
    } else {
      await axios.post('/products/submit', productData)
      ElMessage.success('商品提交成功，等待管理员审核')
    }
    dialogVisible.value = false
    fetchProducts()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally { saving.value = false }
}

const handleDelete = async (product: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品"${product.name}"吗？`, '提示', { type: 'warning' })
    await axios.delete(`/products/${product.id}`)
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
.my-products-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.products-list {
  min-height: 400px;
}

.empty-state {
  background: #fff;
  border-radius: 12px;
  padding: 60px 20px;
}

.product-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.product-image {
  position: relative;
  height: 200px;
}

.product-image .el-image {
  width: 100%;
  height: 100%;
}

.img-placeholder {
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.audit-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.audit-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.audit-badge.approved {
  background: #d4edda;
  color: #155724;
}

.audit-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.product-info {
  padding: 16px;
}

.product-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-info .price {
  font-size: 18px;
  font-weight: 600;
  color: #e74c3c;
  margin-bottom: 8px;
}

.product-info .stock {
  font-size: 13px;
  color: #666;
}

.product-info .reject-reason {
  font-size: 12px;
  color: #e74c3c;
  margin-top: 8px;
  padding: 8px;
  background: #fff5f5;
  border-radius: 6px;
}

.product-actions {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.image-upload-area {
  width: 100%;
}

.avatar-uploader {
  width: 200px;
  height: 200px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.preview-image {
  width: 200px;
  height: 200px;
}

.upload-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.upload-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }

/* 视频上传样式 */
.video-upload-area {
  width: 100%;
}

.video-uploader {
  width: 200px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.video-uploader:hover {
  border-color: #409eff;
}

.video-preview {
  width: 200px;
  height: 120px;
  position: relative;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.video-actions {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-preview:hover .video-actions {
  opacity: 1;
}

.video-actions span {
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.video-placeholder {
  width: 200px;
  height: 120px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>
