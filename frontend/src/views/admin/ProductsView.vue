<template>
  <AdminLayout>
    <div class="products-manage">
      <!-- Tab切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部商品" name="all" />
        <el-tab-pane name="pending">
          <template #label>
            <span>待审核 <el-badge v-if="pendingCount > 0" :value="pendingCount" class="tab-badge" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="searchKeyword" placeholder="搜索商品名称" style="width: 240px" @keyup.enter="fetchProducts">
            <template #append>
              <el-button @click="fetchProducts">搜索</el-button>
            </template>
          </el-input>
          <el-select v-if="activeTab === 'all'" v-model="filterStatus" placeholder="状态筛选" style="width: 140px" @change="fetchProducts">
            <el-option label="全部" value="" />
            <el-option label="上架" value="on" />
            <el-option label="下架" value="off" />
            <el-option label="库存预警" value="lowStock" />
          </el-select>
          <div v-if="filterStatus === 'lowStock'" class="threshold-input">
            <span class="threshold-label">库存少于</span>
            <el-input-number 
              v-model="lowStockThreshold" 
              :min="1" 
              :max="9999"
              :step="5"
              controls-position="right"
              @change="fetchProducts"
            />
            <span class="threshold-unit">件</span>
          </div>
        </div>
        <div class="toolbar-right">
          <el-button-group v-if="activeTab === 'all'" class="batch-actions">
            <el-button type="success" :disabled="selectedProducts.length === 0" @click="batchUpdateStatus(1)">
              一键上架{{ selectedProducts.length > 0 ? ` (${selectedProducts.length})` : '' }}
            </el-button>
            <el-button type="warning" :disabled="selectedProducts.length === 0" @click="batchUpdateStatus(0)">
              一键下架{{ selectedProducts.length > 0 ? ` (${selectedProducts.length})` : '' }}
            </el-button>
          </el-button-group>
          <el-button-group v-if="activeTab === 'all'" class="batch-actions">
            <el-button type="success" plain @click="batchUpdateAllStatus(1)">全部上架</el-button>
            <el-button type="warning" plain @click="batchUpdateAllStatus(0)">全部下架</el-button>
          </el-button-group>
          <el-button type="primary" @click="openDialog()">添加商品</el-button>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="table-card">
        <el-table :data="products" v-loading="loading" stripe @selection-change="handleSelectionChange">
          <el-table-column v-if="activeTab === 'all'" type="selection" width="45" />
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="图片" width="70">
            <template #default="{ row }">
              <el-image 
                :src="getImageUrl(row.mainImage)" 
                style="width: 45px; height: 45px; border-radius: 4px; cursor: pointer" 
                fit="cover"
                :preview-src-list="[getImageUrl(row.mainImage)]"
                preview-teleported
              >
                <template #error><div class="img-placeholder">暂无</div></template>
              </el-image>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip />
          <el-table-column label="分类" width="100">
            <template #default="{ row }">{{ row.categoryName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="price" label="价格" width="120">
            <template #default="{ row }">
              <div class="price-cell">
                <span class="current-price">¥{{ row.price }}</span>
                <div v-if="row.pendingPrice && activeTab === 'pending'" class="pending-price-info">
                  <el-icon class="arrow-icon"><Bottom /></el-icon>
                  <span class="new-price">¥{{ row.pendingPrice }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="70">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.stock < 10 }">{{ row.stock }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sales" label="销量" width="70" />
          <el-table-column label="卖家" width="80" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.sellerName || '平台' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'all'" prop="status" label="上架" width="65">
            <template #default="{ row }">
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="toggleStatus(row)" />
            </template>
          </el-table-column>
          <el-table-column label="审核" width="85">
            <template #default="{ row }">
              <el-tag :type="getAuditTagType(row.auditStatus)" size="small">
                {{ getAuditText(row.auditStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'pending'" label="广告视频" width="90">
            <template #default="{ row }">
              <div v-if="row.adVideo" class="video-cell" @click="openVideoPreview(row)">
                <video :src="getVideoUrl(row.adVideo)" class="video-thumb" muted></video>
                <div class="video-play-icon">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
              <span v-else class="no-video">无</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="activeTab === 'pending' ? 150 : 120" fixed="right">
            <template #default="{ row }">
              <template v-if="activeTab === 'pending'">
                <el-button type="success" link size="small" @click="handleAudit(row, 1)">通过</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, 2)">拒绝</el-button>
                <el-button type="primary" link size="small" @click="openCompareDialog(row)">查看</el-button>
              </template>
              <template v-else>
                <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
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
            <div class="image-upload-area">
              <el-upload
                class="image-uploader"
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="handleImageUpload"
                accept="image/*"
              >
                <div v-if="form.mainImage" class="image-preview">
                  <el-image :src="getImageUrl(form.mainImage)" alt="商品图片" fit="cover">
                    <template #error>
                      <div class="image-error">加载失败</div>
                    </template>
                  </el-image>
                  <div class="image-actions">
                    <span @click.stop="form.mainImage = ''">删除</span>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传图片</span>
                </div>
              </el-upload>
              <div class="upload-tip">支持 jpg、png 格式，最大 5MB</div>
            </div>
          </el-form-item>
          <el-form-item label="商品描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
          </el-form-item>
          <el-form-item label="上架状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
          
          <!-- 广告视频设置 -->
          <el-divider content-position="left">广告视频设置</el-divider>
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
                    <span @click.stop="previewVideo">预览</span>
                    <span @click.stop="form.adVideo = ''">删除</span>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传视频</span>
                </div>
              </el-upload>
              <div class="upload-tip">支持 mp4、webm 格式，最大 50MB</div>
            </div>
          </el-form-item>
          <el-form-item label="广告时长">
            <el-input-number v-model="form.adVideoDuration" :min="3" :max="30" :step="1" />
            <span class="form-tip">秒（用户需观看此时长后才能关闭）</span>
          </el-form-item>
          <el-form-item label="启用广告">
            <el-switch v-model="form.adVideoEnabled" :active-value="1" :inactive-value="0" />
            <span class="form-tip">启用后将在商品详情页显示广告视频</span>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct" :loading="saving">保存</el-button>
        </template>
      </el-dialog>

      <!-- 拒绝原因弹窗 -->
      <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="400px">
        <el-input v-model="rejectRemark" type="textarea" :rows="3" placeholder="请输入拒绝原因（可选）" />
        <template #footer>
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject" :loading="auditing">确认拒绝</el-button>
        </template>
      </el-dialog>

      <!-- 视频预览弹窗 -->
      <el-dialog v-model="videoPreviewVisible" title="广告视频预览" width="700px" destroy-on-close>
        <div class="video-preview-container">
          <div class="video-info" v-if="previewProduct">
            <span class="product-name">{{ previewProduct.name }}</span>
            <span class="seller-name">卖家: {{ previewProduct.sellerName || '平台' }}</span>
          </div>
          <video 
            v-if="previewVideoUrl" 
            :src="previewVideoUrl" 
            controls 
            autoplay 
            class="preview-player"
          ></video>
        </div>
        <template #footer>
          <el-button @click="videoPreviewVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 审核通过弹窗（有广告视频时） -->
      <el-dialog v-model="approveDialogVisible" title="审核通过" width="500px">
        <div class="approve-content">
          <p class="approve-tip">确定要通过商品「{{ approveProduct?.name }}」的审核吗？</p>
          
          <div v-if="approveProduct?.adVideo" class="ad-settings">
            <el-divider content-position="left">广告视频设置</el-divider>
            <div class="ad-preview-small">
              <video :src="getVideoUrl(approveProduct.adVideo)" class="ad-thumb" muted></video>
              <span class="ad-label">该商品包含广告视频</span>
            </div>
            <el-form label-width="100px">
              <el-form-item label="启用广告">
                <el-switch v-model="approveAdEnabled" :active-value="1" :inactive-value="0" />
                <span class="form-tip">启用后将在商品详情页显示广告</span>
              </el-form-item>
              <el-form-item v-if="approveAdEnabled === 1" label="广告时长">
                <el-input-number v-model="approveAdDuration" :min="3" :max="30" :step="1" />
                <span class="form-tip">秒（用户需观看此时长后才能关闭）</span>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <template #footer>
          <el-button @click="approveDialogVisible = false">取消</el-button>
          <el-button type="success" @click="confirmApprove" :loading="auditing">确认通过</el-button>
        </template>
      </el-dialog>

      <!-- 待审核商品对比查看弹窗 -->
      <el-dialog v-model="compareDialogVisible" title="商品审核详情" width="900px" class="compare-dialog">
        <div class="compare-container" v-if="compareProduct">
          <div class="compare-header">
            <div class="product-basic">
              <el-image :src="getImageUrl(compareProduct.mainImage)" class="product-thumb" fit="cover">
                <template #error><div class="img-placeholder">暂无图片</div></template>
              </el-image>
              <div class="product-meta">
                <h3>{{ compareProduct.name }}</h3>
                <p class="seller-info">卖家: {{ compareProduct.sellerName || '平台' }}</p>
                <p class="category-info">分类: {{ compareProduct.categoryName || '-' }}</p>
              </div>
            </div>
          </div>
          
          <div class="compare-content">
            <!-- 当前信息 -->
            <div class="compare-card current">
              <div class="card-header">
                <span class="card-title">当前信息</span>
                <el-tag type="info" size="small">线上版本</el-tag>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="label">商品价格</span>
                  <span class="value price">¥{{ compareProduct.price }}</span>
                </div>
                <div class="info-row">
                  <span class="label">原价</span>
                  <span class="value">{{ compareProduct.originalPrice ? '¥' + compareProduct.originalPrice : '-' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">库存</span>
                  <span class="value">{{ compareProduct.stock }} 件</span>
                </div>
                <div class="info-row">
                  <span class="label">销量</span>
                  <span class="value">{{ compareProduct.sales }} 件</span>
                </div>
              </div>
            </div>

            <!-- 箭头 -->
            <div class="compare-arrow">
              <el-icon size="32"><Right /></el-icon>
            </div>

            <!-- 待审核信息 -->
            <div class="compare-card pending">
              <div class="card-header">
                <span class="card-title">待审核信息</span>
                <el-tag type="warning" size="small">待审核</el-tag>
              </div>
              <div class="card-body">
                <div class="info-row" :class="{ changed: compareProduct.pendingPrice && compareProduct.pendingPrice !== compareProduct.price }">
                  <span class="label">商品价格</span>
                  <span class="value price new-price">
                    ¥{{ compareProduct.pendingPrice || compareProduct.price }}
                    <span v-if="compareProduct.pendingPrice && compareProduct.pendingPrice !== compareProduct.price" class="change-badge">
                      {{ compareProduct.pendingPrice < compareProduct.price ? '降价' : '涨价' }}
                    </span>
                  </span>
                </div>
                <div class="info-row" :class="{ changed: compareProduct.pendingOriginalPrice && compareProduct.pendingOriginalPrice !== compareProduct.originalPrice }">
                  <span class="label">原价</span>
                  <span class="value">{{ compareProduct.pendingOriginalPrice ? '¥' + compareProduct.pendingOriginalPrice : (compareProduct.originalPrice ? '¥' + compareProduct.originalPrice : '-') }}</span>
                </div>
                <div class="info-row">
                  <span class="label">库存</span>
                  <span class="value">{{ compareProduct.stock }} 件</span>
                </div>
                <div class="info-row">
                  <span class="label">销量</span>
                  <span class="value">{{ compareProduct.sales }} 件</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 广告视频信息 -->
          <div v-if="compareProduct.adVideo" class="ad-video-section">
            <el-divider content-position="left">广告视频</el-divider>
            <div class="ad-video-preview" @click="openVideoPreview(compareProduct)">
              <video :src="getVideoUrl(compareProduct.adVideo)" class="ad-video-thumb" muted></video>
              <div class="play-overlay">
                <el-icon size="24"><VideoPlay /></el-icon>
                <span>点击预览</span>
              </div>
            </div>
          </div>

          <!-- 商品描述 -->
          <div class="description-section">
            <el-divider content-position="left">商品描述</el-divider>
            <p class="description-text">{{ compareProduct.description || '暂无描述' }}</p>
          </div>
        </div>
        <template #footer>
          <el-button @click="compareDialogVisible = false">关闭</el-button>
          <el-button type="danger" @click="compareDialogVisible = false; handleAudit(compareProduct, 2)">拒绝</el-button>
          <el-button type="success" @click="compareDialogVisible = false; handleAudit(compareProduct, 1)">通过</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, Bottom, Right } from '@element-plus/icons-vue'
import AdminLayout from '@/components/AdminLayout.vue'
import adminApi from '@/api/adminApi'
import fileApi from '@/api/fileApi'
import axios from '@/utils/axios'
import { useAdminStore } from '@/stores/adminStore'

// 使用 admin store 来刷新侧边栏数量
const adminStore = useAdminStore()

const products = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const auditing = ref(false)
const dialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const activeTab = ref('all')
const pendingCount = ref(0)
const rejectRemark = ref('')
const rejectProductId = ref<number | null>(null)

// 视频预览相关
const videoPreviewVisible = ref(false)
const previewVideoUrl = ref('')
const previewProduct = ref<any>(null)

// 审核通过弹窗相关
const approveDialogVisible = ref(false)
const approveProduct = ref<any>(null)
const approveAdEnabled = ref(0)
const approveAdDuration = ref(5)

// 对比查看弹窗相关
const compareDialogVisible = ref(false)
const compareProduct = ref<any>(null)

const searchKeyword = ref('')
const filterStatus = ref<string>('')
const lowStockThreshold = ref(10)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedProducts = ref<any[]>([])

const form = reactive({
  name: '',
  categoryId: null as number | null,
  price: 0,
  originalPrice: 0,
  stock: 0,
  mainImage: '',
  description: '',
  status: 1,
  adVideo: '',
  adVideoDuration: 5,
  adVideoEnabled: 0
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
  form.adVideo = ''
  form.adVideoDuration = 5
  form.adVideoEnabled = 0
}

const getAuditTagType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

const getAuditText = (status: number) => {
  const map: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
  return map[status] || '未知'
}

const openDialog = (product?: any) => {
  if (product) {
    isEdit.value = true
    editId.value = product.id
    // 正确提取分类ID（可能在category对象中）
    form.name = product.name || ''
    form.categoryId = product.categoryId || product.category?.id || null
    form.price = product.price || 0
    form.originalPrice = product.originalPrice || 0
    form.stock = product.stock || 0
    form.mainImage = product.mainImage || ''
    form.description = product.description || ''
    form.status = product.status ?? 1
    // 广告视频字段
    form.adVideo = product.adVideo || ''
    form.adVideoDuration = product.adVideoDuration || 5
    form.adVideoEnabled = product.adVideoEnabled ?? 0
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const getCategoryName = (id: number) => categories.value.find(c => c.id === id)?.name || '-'

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const getVideoUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `http://localhost:8080/api${normalizedPath}`
}

const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
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
    // 编辑时传入商品ID，管理员上传直接更新商品图片
    const productId = isEdit.value && editId.value ? editId.value : undefined
    const res: any = await fileApi.uploadProductImage(options.file, categoryName, productId)
    if (res?.code === 200 && res.data) {
      form.mainImage = res.data
      ElMessage.success('图片上传成功')
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
    ElMessage.error('视频大小不能超过 50MB')
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

const previewVideo = () => {
  if (form.adVideo) {
    previewProduct.value = null // 编辑弹窗中的预览不需要显示商品信息
    previewVideoUrl.value = getVideoUrl(form.adVideo)
    videoPreviewVisible.value = true
  }
}

// 打开视频预览弹窗（用于待审核列表）
const openVideoPreview = (product: any) => {
  if (product.adVideo) {
    previewProduct.value = product
    previewVideoUrl.value = getVideoUrl(product.adVideo)
    videoPreviewVisible.value = true
  }
}

// 打开对比查看弹窗
const openCompareDialog = (product: any) => {
  compareProduct.value = product
  compareDialogVisible.value = true
}

const fetchCategories = async () => {
  try {
    const res: any = await adminApi.getCategories()
    if (res?.code === 200) categories.value = res.data || []
  } catch (e) { console.error(e) }
}

const fetchPendingCount = async () => {
  try {
    const res: any = await axios.get('/products/pending/count')
    if (res?.code === 200) pendingCount.value = res.data || 0
  } catch (e) { console.error(e) }
}

const handleTabChange = () => {
  currentPage.value = 1
  fetchProducts()
}

const fetchProducts = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'pending') {
      const res: any = await axios.get('/products/pending')
      if (res?.code === 200) {
        products.value = res.data || []
        total.value = products.value.length
      }
    } else {
      const params: any = { page: currentPage.value - 1, size: pageSize.value }
      if (searchKeyword.value) params.keyword = searchKeyword.value
      
      // 处理筛选条件
      if (filterStatus.value === 'on') {
        params.status = 1
      } else if (filterStatus.value === 'off') {
        params.status = 0
      } else if (filterStatus.value === 'lowStock') {
        params.lowStock = lowStockThreshold.value
      }
      
      const res: any = await adminApi.getProducts(params)
      if (res?.code === 200) {
        products.value = res.data?.content || []
        total.value = res.data?.totalElements || 0
      }
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
    // 显式构建数据对象，确保所有字段正确传递
    const productData = {
      name: form.name,
      categoryId: form.categoryId,
      price: form.price,
      originalPrice: form.originalPrice,
      stock: form.stock,
      mainImage: form.mainImage,
      description: form.description,
      status: form.status,
      adVideo: form.adVideo,
      adVideoDuration: form.adVideoDuration,
      adVideoEnabled: form.adVideoEnabled
    }
    
    if (isEdit.value && editId.value) {
      await adminApi.updateProduct(editId.value, productData)
      ElMessage.success('商品更新成功')
    } else {
      await adminApi.createProduct(productData)
      ElMessage.success('商品添加成功')
    }
    dialogVisible.value = false
    fetchProducts()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally { saving.value = false }
}

const handleSelectionChange = (selection: any[]) => {
  selectedProducts.value = selection
}

const batchUpdateStatus = async (status: number) => {
  if (selectedProducts.value.length === 0) return
  
  const action = status === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(
      `确定要${action}选中的 ${selectedProducts.value.length} 个商品吗？`, 
      '批量操作', 
      { type: 'warning' }
    )
    
    let successCount = 0
    for (const product of selectedProducts.value) {
      try {
        await adminApi.updateProduct(product.id, { status })
        product.status = status
        successCount++
      } catch {}
    }
    
    ElMessage.success(`成功${action} ${successCount} 个商品`)
    selectedProducts.value = []
  } catch {}
}

const batchUpdateAllStatus = async (status: number) => {
  const action = status === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(
      `确定要${action}所有商品吗？此操作将影响全部商品。`, 
      '全部' + action, 
      { type: 'warning' }
    )
    
    await axios.put('/products/batch-status', { status })
    ElMessage.success(`全部商品已${action}`)
    fetchProducts()
  } catch {}
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

// 从localStorage读取上次的广告设置
const getLastAdSettings = () => {
  try {
    const saved = localStorage.getItem('admin_ad_settings')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return { enabled: 1, duration: 5 }
}

// 保存广告设置到localStorage
const saveAdSettings = (enabled: number, duration: number) => {
  try {
    localStorage.setItem('admin_ad_settings', JSON.stringify({ enabled, duration }))
  } catch {}
}

const handleAudit = async (product: any, auditStatus: number) => {
  if (auditStatus === 1) {
    // 通过 - 如果有广告视频，打开设置弹窗
    if (product.adVideo) {
      approveProduct.value = product
      // 使用上次保存的设置
      const lastSettings = getLastAdSettings()
      approveAdEnabled.value = lastSettings.enabled
      approveAdDuration.value = lastSettings.duration
      approveDialogVisible.value = true
    } else {
      // 没有广告视频，直接确认
      try {
        await ElMessageBox.confirm(`确定要通过商品"${product.name}"的审核吗？`, '提示', { type: 'success' })
        auditing.value = true
        await axios.post(`/products/${product.id}/audit`, { auditStatus: 1 })
        ElMessage.success('审核通过')
        fetchProducts()
        fetchPendingCount()
        adminStore.fetchPendingProductCount()
      } catch {} finally { auditing.value = false }
    }
  } else {
    // 拒绝 - 打开弹窗
    rejectProductId.value = product.id
    rejectRemark.value = ''
    rejectDialogVisible.value = true
  }
}

const confirmApprove = async () => {
  if (!approveProduct.value) return
  auditing.value = true
  try {
    const data: any = { auditStatus: 1 }
    // 如果有广告视频，传递广告设置并保存到localStorage
    if (approveProduct.value.adVideo) {
      data.adVideoEnabled = approveAdEnabled.value
      if (approveAdEnabled.value === 1) {
        data.adVideoDuration = approveAdDuration.value
      }
      // 保存本次设置供下次使用
      saveAdSettings(approveAdEnabled.value, approveAdDuration.value)
    }
    await axios.post(`/products/${approveProduct.value.id}/audit`, data)
    ElMessage.success(approveAdEnabled.value === 1 ? '审核通过，广告已启用' : '审核通过')
    approveDialogVisible.value = false
    fetchProducts()
    fetchPendingCount()
    adminStore.fetchPendingProductCount()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally { auditing.value = false }
}

const confirmReject = async () => {
  if (!rejectProductId.value) return
  auditing.value = true
  try {
    await axios.post(`/products/${rejectProductId.value}/audit`, { 
      auditStatus: 2, 
      remark: rejectRemark.value 
    })
    ElMessage.success('已拒绝该商品')
    rejectDialogVisible.value = false
    fetchProducts()
    fetchPendingCount()
    adminStore.fetchPendingProductCount()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally { auditing.value = false }
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
  // 检查 URL 参数，支持从通知跳转时自动切换到待审核 tab
  const urlParams = new URLSearchParams(window.location.search)
  const tab = urlParams.get('tab')
  if (tab === 'pending') {
    activeTab.value = 'pending'
  }
  
  fetchCategories()
  fetchProducts()
  fetchPendingCount()
})
</script>

<style scoped>
.products-manage { 
  width: 100%;
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
  overflow-x: hidden;
}

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
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-actions {
  margin-right: 4px;
}

.threshold-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 8px;
}

.threshold-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.threshold-unit {
  color: #909399;
  font-size: 14px;
}

.threshold-input :deep(.el-input-number) {
  width: 120px;
}

.threshold-input :deep(.el-input-number .el-input__inner) {
  text-align: center;
  font-weight: 500;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.table-card :deep(.el-table) {
  width: 100% !important;
  max-width: 100%;
}

.table-card :deep(.el-table__body-wrapper) {
  overflow-x: hidden;
}

.img-placeholder {
  width: 45px;
  height: 45px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #999;
  border-radius: 4px;
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

.tab-badge {
  margin-left: 6px;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }

.image-upload-area { width: 100%; }

.image-uploader {
  width: 150px;
  height: 150px;
}

:deep(.el-upload) {
  width: 150px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

:deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview img, .image-preview .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
}

.image-actions {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-actions {
  opacity: 1;
}

.image-actions span {
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 8px;
}

.upload-placeholder .el-icon {
  font-size: 28px;
}

.upload-placeholder span {
  font-size: 12px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

/* 视频上传样式 */
.video-upload-area {
  width: 100%;
}

.video-uploader {
  width: 200px;
  height: 120px;
}

.video-uploader :deep(.el-upload) {
  width: 200px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.video-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}

.video-preview {
  width: 100%;
  height: 100%;
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
  gap: 16px;
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

.video-actions span:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 表格中的视频缩略图 */
.video-cell {
  position: relative;
  width: 50px;
  height: 35px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 18px;
  transition: background 0.2s;
}

.video-cell:hover .video-play-icon {
  background: rgba(90, 143, 212, 0.6);
}

.no-video {
  color: #999;
  font-size: 12px;
}

/* 视频预览弹窗 */
.video-preview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.product-name {
  font-weight: 500;
  color: #333;
}

.seller-name {
  font-size: 13px;
  color: #666;
}

.preview-player {
  width: 100%;
  max-height: 400px;
  background: #000;
  border-radius: 8px;
}

/* 审核通过弹窗 */
.approve-content {
  padding: 0 10px;
}

.approve-tip {
  font-size: 15px;
  color: #333;
  margin-bottom: 16px;
}

.ad-settings {
  margin-top: 10px;
}

.ad-preview-small {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.ad-thumb {
  width: 80px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  background: #000;
}

.ad-label {
  font-size: 13px;
  color: #666;
}

.pending-price-tag {
  font-size: 11px;
  color: #faad14;
  background: #fffbe6;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

.price-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.current-price {
  font-weight: 500;
  color: #333;
}

.pending-price-info {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-radius: 12px;
  border: 1px solid #91d5ff;
}

.pending-price-info .arrow-icon {
  font-size: 12px;
  color: #1890ff;
}

.pending-price-info .new-price {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
}

/* 对比查看弹窗 */
.compare-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.compare-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.compare-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.product-basic {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-thumb {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-meta h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.product-meta .seller-info,
.product-meta .category-info {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}

.compare-content {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.compare-card {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
}

.compare-card.current {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.compare-card.pending {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border: 1px solid #91d5ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.card-body {
  padding: 16px;
}

.card-body .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
}

.card-body .info-row:last-child {
  border-bottom: none;
}

.card-body .info-row .label {
  font-size: 13px;
  color: #666;
}

.card-body .info-row .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.card-body .info-row .value.price {
  font-size: 18px;
  color: #5A8FD4;
  font-weight: 600;
}

.card-body .info-row.changed {
  background: rgba(250, 173, 20, 0.1);
  margin: 0 -16px;
  padding: 10px 16px;
  border-radius: 6px;
}

.card-body .info-row .new-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #52c41a;
  color: #fff;
}

.compare-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5A8FD4;
  flex-shrink: 0;
}

.ad-video-section {
  margin-top: 8px;
}

.ad-video-preview {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.ad-video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  transition: background 0.3s;
}

.ad-video-preview:hover .play-overlay {
  background: rgba(0, 0, 0, 0.6);
}

.description-section {
  margin-top: 8px;
}

.description-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}
</style>
