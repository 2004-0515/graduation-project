<template>
  <AdminLayout>
    <div class="coupons-manage">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="total-count">共 {{ coupons.length }} 张优惠券</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="openDialog()">添加优惠券</el-button>
        </div>
      </div>

      <div class="table-card">
        <el-table :data="coupons" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" min-width="120" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">{{ getTypeName(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优惠" width="100">
            <template #default="{ row }">
              <span v-if="row.type === 2">{{ (row.discountRate * 10).toFixed(0) }}折</span>
              <span v-else>¥{{ row.discountAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="门槛" width="100">
            <template #default="{ row }">
              <span v-if="row.minAmount > 0">满{{ row.minAmount }}</span>
              <span v-else>无门槛</span>
            </template>
          </el-table-column>
          <el-table-column label="领取/总量" width="100">
            <template #default="{ row }">
              {{ row.claimedCount }} / {{ row.totalCount }}
            </template>
          </el-table-column>
          <el-table-column label="有效期" min-width="180">
            <template #default="{ row }">
              {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="toggleStatus(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 编辑弹窗 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑优惠券' : '添加优惠券'" width="550px">
        <el-form :model="form" label-width="100px">
          <el-form-item label="优惠券名称" required>
            <el-input v-model="form.name" placeholder="请输入优惠券名称" />
          </el-form-item>
          <el-form-item label="优惠券类型" required>
            <el-radio-group v-model="form.type">
              <el-radio :value="1">满减券</el-radio>
              <el-radio :value="2">折扣券</el-radio>
              <el-radio :value="3">无门槛券</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="优惠金额" required v-if="form.type !== 2">
            <el-input-number v-model="form.discountAmount" :min="1" :max="9999" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="折扣比例" required v-if="form.type === 2">
            <el-input-number v-model="form.discountRate" :min="0.1" :max="0.99" :step="0.1" :precision="2" style="width: 100%" />
            <span class="form-tip">如0.8表示8折</span>
          </el-form-item>
          <el-form-item label="最低消费" v-if="form.type !== 3">
            <el-input-number v-model="form.minAmount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="最大优惠" v-if="form.type === 2">
            <el-input-number v-model="form.maxDiscount" :min="0" :precision="2" style="width: 100%" />
            <span class="form-tip">折扣券最大优惠金额，0表示不限</span>
          </el-form-item>
          <el-form-item label="发放总量" required>
            <el-input-number v-model="form.totalCount" :min="1" :max="99999" style="width: 100%" />
          </el-form-item>
          <el-form-item label="每人限领">
            <el-input-number v-model="form.limitPerUser" :min="1" :max="99" style="width: 100%" />
          </el-form-item>
          <el-form-item label="有效期" required>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入优惠券描述" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCoupon" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import couponApi from '@/api/couponApi'

const coupons = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const dateRange = ref<[Date, Date] | null>(null)

const form = reactive({
  name: '',
  type: 1,
  discountAmount: 10,
  discountRate: 0.8,
  minAmount: 100,
  maxDiscount: 0,
  totalCount: 100,
  limitPerUser: 1,
  description: '',
  status: 1
})

const resetForm = () => {
  form.name = ''
  form.type = 1
  form.discountAmount = 10
  form.discountRate = 0.8
  form.minAmount = 100
  form.maxDiscount = 0
  form.totalCount = 100
  form.limitPerUser = 1
  form.description = ''
  form.status = 1
  dateRange.value = null
}

const getTypeName = (type: number) => {
  const names: Record<number, string> = { 1: '满减券', 2: '折扣券', 3: '无门槛' }
  return names[type] || '未知'
}

const getTypeTagType = (type: number) => {
  const types: Record<number, string> = { 1: 'primary', 2: 'warning', 3: 'success' }
  return types[type] || 'info'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const openDialog = (coupon?: any) => {
  if (coupon) {
    isEdit.value = true
    editId.value = coupon.id
    form.name = coupon.name
    form.type = coupon.type
    form.discountAmount = coupon.discountAmount || 10
    form.discountRate = coupon.discountRate || 0.8
    form.minAmount = coupon.minAmount || 0
    form.maxDiscount = coupon.maxDiscount || 0
    form.totalCount = coupon.totalCount
    form.limitPerUser = coupon.limitPerUser || 1
    form.description = coupon.description || ''
    form.status = coupon.status
    dateRange.value = [new Date(coupon.startTime), new Date(coupon.endTime)]
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
    // 默认有效期：今天到年底
    const now = new Date()
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    dateRange.value = [now, endOfYear]
  }
  dialogVisible.value = true
}

const fetchCoupons = async () => {
  loading.value = true
  try {
    const res: any = await couponApi.getAllCoupons()
    if (res?.code === 200) {
      coupons.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const saveCoupon = async () => {
  if (!form.name) {
    ElMessage.warning('请输入优惠券名称')
    return
  }
  if (!dateRange.value) {
    ElMessage.warning('请选择有效期')
    return
  }
  
  saving.value = true
  try {
    const data: any = {
      name: form.name,
      type: form.type,
      totalCount: form.totalCount,
      limitPerUser: form.limitPerUser,
      description: form.description,
      status: form.status,
      startTime: dateRange.value[0].toISOString(),
      endTime: dateRange.value[1].toISOString()
    }
    
    if (form.type === 2) {
      data.discountRate = form.discountRate
      data.minAmount = form.minAmount
      data.maxDiscount = form.maxDiscount > 0 ? form.maxDiscount : null
    } else if (form.type === 1) {
      data.discountAmount = form.discountAmount
      data.minAmount = form.minAmount
    } else {
      data.discountAmount = form.discountAmount
      data.minAmount = 0
    }
    
    if (isEdit.value && editId.value) {
      await couponApi.updateCoupon(editId.value, data)
      ElMessage.success('优惠券更新成功')
    } else {
      await couponApi.createCoupon(data)
      ElMessage.success('优惠券添加成功')
    }
    dialogVisible.value = false
    fetchCoupons()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (coupon: any) => {
  try {
    await couponApi.updateCoupon(coupon.id, { status: coupon.status })
    ElMessage.success(coupon.status === 1 ? '已启用' : '已禁用')
  } catch (e) {
    coupon.status = coupon.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (coupon: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除优惠券"${coupon.name}"吗？`, '提示', { type: 'warning' })
    await couponApi.deleteCoupon(coupon.id)
    ElMessage.success('删除成功')
    fetchCoupons()
  } catch {}
}

onMounted(() => fetchCoupons())
</script>

<style scoped>
.coupons-manage { 
  width: 100%;
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
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #999;
}

:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-dialog__header) { border-bottom: 1px solid #f0f0f0; padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
</style>
