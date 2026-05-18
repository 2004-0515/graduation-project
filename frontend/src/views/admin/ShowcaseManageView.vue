<template>
  <AdminLayout>
    <div class="showcase-manage">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="placementFilter" placeholder="全部位置" style="width: 180px" @change="fetchBanners">
            <el-option label="全部位置" value="" />
            <el-option v-for="option in placementOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <span class="toolbar-tip">首页、活动页和类目专题位统一在这里编排</span>
        </div>
        <el-button type="primary" @click="openDialog()">
          <el-icon><Plus /></el-icon>
          新增内容
        </el-button>
      </div>

      <div class="table-panel">
        <el-table :data="banners" v-loading="loading" row-key="id">
          <el-table-column label="图片" width="140">
            <template #default="{ row }">
              <div class="image-cell">
                <img :src="getImageUrl(row.imagePath)" :alt="row.title" class="banner-thumb" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="位置" width="160">
            <template #default="{ row }">
              <el-tag size="small">{{ placementLabelMap[row.placement] || row.placement }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内容">
            <template #default="{ row }">
              <div class="content-cell">
                <strong>{{ row.title }}</strong>
                <span v-if="row.subtitle" class="subtitle">{{ row.subtitle }}</span>
                <p>{{ row.description || '未填写描述' }}</p>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="链接" min-width="200">
            <template #default="{ row }">
              <div class="link-cell">
                <span>{{ row.linkType || 'NONE' }}</span>
                <code v-if="row.linkTarget">{{ row.linkTarget }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="排序" width="90" prop="sortOrder" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间窗口" width="220">
            <template #default="{ row }">
              <div class="window-cell">
                <span>{{ formatDateTime(row.startTime) || '立即生效' }}</span>
                <span>{{ formatDateTime(row.endTime) || '长期展示' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑展示内容' : '新增展示内容'" width="780px">
        <el-form :model="form" label-width="100px" class="showcase-form">
          <el-form-item label="展示位置" required>
            <el-select v-model="form.placement" style="width: 100%">
              <el-option v-for="option in placementOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="主标题" required>
            <el-input v-model="form.title" maxlength="120" show-word-limit />
          </el-form-item>
          <el-form-item label="副标题">
            <el-input v-model="form.subtitle" maxlength="120" show-word-limit />
          </el-form-item>
          <el-form-item label="描述文案">
            <el-input v-model="form.description" type="textarea" :rows="3" maxlength="300" show-word-limit />
          </el-form-item>
          <el-form-item label="角标">
            <el-input v-model="form.badgeText" maxlength="40" />
          </el-form-item>

          <div class="image-grid">
            <el-form-item label="主图" required>
              <el-upload :show-file-list="false" :http-request="handlePrimaryUpload" :before-upload="beforeBannerUpload" accept="image/*">
                <div class="upload-card">
                  <img v-if="form.imagePath" :src="getImageUrl(form.imagePath)" alt="展示主图" class="upload-preview" />
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传主图</span>
                  </div>
                </div>
              </el-upload>
            </el-form-item>
            <el-form-item label="移动端图">
              <el-upload :show-file-list="false" :http-request="handleMobileUpload" :before-upload="beforeBannerUpload" accept="image/*">
                <div class="upload-card">
                  <img v-if="form.mobileImagePath" :src="getImageUrl(form.mobileImagePath)" alt="移动端展示图" class="upload-preview" />
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传移动图</span>
                  </div>
                </div>
              </el-upload>
            </el-form-item>
          </div>

          <el-form-item label="按钮文案">
            <el-input v-model="form.buttonText" maxlength="40" />
          </el-form-item>
          <el-form-item label="链接类型">
            <el-select v-model="form.linkType" style="width: 100%">
              <el-option v-for="option in linkTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="链接目标" :required="form.linkType !== 'NONE'">
            <el-input v-model="form.linkTarget" placeholder="/promotions、/category?id=1、https://..." />
          </el-form-item>
          <div class="meta-grid">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
            </el-form-item>
            <el-form-item label="状态">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </div>
          <div class="meta-grid">
            <el-form-item label="开始时间">
              <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
            </el-form-item>
          </div>
        </el-form>
        <template #footer>
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import AdminLayout from '@/components/AdminLayout.vue'
import showcaseApi, { type ShowcaseBanner } from '@/api/showcaseApi'
import fileApi from '@/api/fileApi'
import { debugError } from '@/utils/debug'

const placementOptions = [
  { label: '首页主视觉', value: 'HOME_HERO' },
  { label: '活动主视觉', value: 'PROMOTION_HERO' },
  { label: '类目专题位', value: 'CATEGORY_SPOTLIGHT' }
] as const

const placementLabelMap: Record<string, string> = {
  HOME_HERO: '首页主视觉',
  PROMOTION_HERO: '活动主视觉',
  CATEGORY_SPOTLIGHT: '类目专题位'
}

const linkTypeOptions = [
  { label: '无跳转', value: 'NONE' },
  { label: '站内路由', value: 'ROUTE' },
  { label: '活动专题', value: 'PROMOTION' },
  { label: '商品详情', value: 'PRODUCT' },
  { label: '分类页', value: 'CATEGORY' },
  { label: '外部链接', value: 'URL' }
]

const banners = ref<ShowcaseBanner[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const placementFilter = ref('')

const form = reactive<ShowcaseBanner>({
  placement: 'HOME_HERO',
  title: '',
  subtitle: '',
  description: '',
  badgeText: '',
  imagePath: '',
  mobileImagePath: '',
  buttonText: '',
  linkType: 'NONE',
  linkTarget: '',
  sortOrder: 0,
  status: 1,
  startTime: '',
  endTime: ''
})

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const isPromotionPlacement = computed(() => form.placement === 'PROMOTION_HERO')

const isPlacementImageCompatible = (path: string, placement: ShowcaseBanner['placement']) => {
  if (!path) return true
  if (placement === 'PROMOTION_HERO') {
    return path.startsWith('/uploads/promotions/')
  }
  return path.startsWith('/uploads/banners/')
}

const resetForm = () => {
  form.placement = 'HOME_HERO'
  form.title = ''
  form.subtitle = ''
  form.description = ''
  form.badgeText = ''
  form.imagePath = ''
  form.mobileImagePath = ''
  form.buttonText = ''
  form.linkType = 'NONE'
  form.linkTarget = ''
  form.sortOrder = 0
  form.status = 1
  form.startTime = ''
  form.endTime = ''
}

const normalizePayload = (): ShowcaseBanner => ({
  placement: form.placement,
  title: form.title.trim(),
  subtitle: form.subtitle?.trim() || null,
  description: form.description?.trim() || null,
  badgeText: form.badgeText?.trim() || null,
  imagePath: form.imagePath,
  mobileImagePath: form.mobileImagePath?.trim() || null,
  buttonText: form.buttonText?.trim() || null,
  linkType: form.linkType || 'NONE',
  linkTarget: form.linkTarget?.trim() || null,
  sortOrder: Number(form.sortOrder || 0),
  status: Number(form.status ?? 1),
  startTime: form.startTime || null,
  endTime: form.endTime || null
})

const fetchBanners = async () => {
  loading.value = true
  try {
    const res: any = await showcaseApi.getAdminBanners((placementFilter.value || undefined) as ShowcaseBanner['placement'] | undefined)
    if (res?.code === 200) {
      banners.value = res.data || []
    } else {
      debugError('获取展示内容失败', res?.message || '业务返回异常')
      ElMessage.error(res?.message || '获取展示内容失败')
    }
  } catch (error) {
    debugError('获取展示内容失败', error)
    ElMessage.error('获取展示内容失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (item?: ShowcaseBanner) => {
  resetForm()
  if (item?.id) {
    isEdit.value = true
    currentId.value = item.id
    Object.assign(form, {
      ...item,
      subtitle: item.subtitle || '',
      description: item.description || '',
      badgeText: item.badgeText || '',
      mobileImagePath: item.mobileImagePath || '',
      buttonText: item.buttonText || '',
      linkType: item.linkType || 'NONE',
      linkTarget: item.linkTarget || '',
      startTime: item.startTime || '',
      endTime: item.endTime || ''
    })
  } else {
    isEdit.value = false
    currentId.value = null
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  isEdit.value = false
  currentId.value = null
  resetForm()
}

const beforeBannerUpload = (file: File) => {
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

const uploadShowcaseImage = async (file: File) => (
  isPromotionPlacement.value
    ? fileApi.uploadPromotionImage(file)
    : fileApi.uploadBannerImage(file)
)

const handlePrimaryUpload = async (options: any) => {
  try {
    const res: any = await uploadShowcaseImage(options.file)
    if (res?.code === 200 && res.data) {
      form.imagePath = res.data
      ElMessage.success(res?.message || '主图上传成功')
      return
    }
    ElMessage.error(res?.message || '主图上传失败')
  } catch (error) {
    debugError('上传展示主图失败', error)
    ElMessage.error('主图上传失败')
  }
}

const handleMobileUpload = async (options: any) => {
  try {
    const res: any = await uploadShowcaseImage(options.file)
    if (res?.code === 200 && res.data) {
      form.mobileImagePath = res.data
      ElMessage.success(res?.message || '移动端图片上传成功')
      return
    }
    ElMessage.error(res?.message || '移动端图片上传失败')
  } catch (error) {
    debugError('上传移动端展示图失败', error)
    ElMessage.error('移动端图片上传失败')
  }
}

const submitForm = async () => {
  if (!form.title.trim() || !form.imagePath) {
    ElMessage.warning('请填写标题并上传主图')
    return
  }
  if (form.linkType !== 'NONE' && !form.linkTarget?.trim()) {
    ElMessage.warning('当前链接类型需要填写链接目标')
    return
  }

  saving.value = true
  try {
    const payload = normalizePayload()
    const res: any = isEdit.value && currentId.value
      ? await showcaseApi.updateBanner(currentId.value, payload)
      : await showcaseApi.createBanner(payload)
    if (res?.code === 200) {
      ElMessage.success(res?.message || '保存成功')
      closeDialog()
      await fetchBanners()
      return
    }
    ElMessage.error(res?.message || '保存失败')
  } catch (error) {
    debugError('保存展示内容失败', error)
    ElMessage.error('保存展示内容失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (item: ShowcaseBanner) => {
  if (!item.id) return
  try {
    await ElMessageBox.confirm(`确定删除「${item.title}」吗？`, '提示', { type: 'warning' })
    const res: any = await showcaseApi.deleteBanner(item.id)
    if (res?.code === 200) {
      ElMessage.success('删除成功')
      await fetchBanners()
      return
    }
    ElMessage.error(res?.message || '删除失败')
  } catch (error: any) {
    if (error === 'cancel') return
    debugError('删除展示内容失败', error)
    ElMessage.error('删除展示内容失败')
  }
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

watch(
  () => form.placement,
  (placement) => {
    if (!isPlacementImageCompatible(form.imagePath, placement)) {
      form.imagePath = ''
    }
    if (!isPlacementImageCompatible(form.mobileImagePath || '', placement)) {
      form.mobileImagePath = ''
    }
  }
)

onMounted(() => {
  fetchBanners()
})
</script>

<style scoped>
.showcase-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-tip {
  color: #667085;
  font-size: 13px;
}

.table-panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.image-cell {
  display: flex;
  align-items: center;
}

.banner-thumb {
  width: 104px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  background: #f4f4f5;
}

.content-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-cell strong {
  color: #111827;
}

.content-cell .subtitle,
.content-cell p,
.link-cell,
.window-cell {
  color: #667085;
  font-size: 13px;
}

.content-cell p {
  margin: 0;
  line-height: 1.5;
}

.link-cell,
.window-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.link-cell code {
  white-space: normal;
  word-break: break-all;
}

.showcase-form {
  display: flex;
  flex-direction: column;
}

.image-grid,
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.upload-card {
  width: 100%;
  height: 148px;
  border: 1px dashed #d0d5dd;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #667085;
}

@media (max-width: 960px) {
  .toolbar,
  .toolbar-left,
  .image-grid,
  .meta-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .toolbar-left {
    gap: 8px;
  }
}
</style>
