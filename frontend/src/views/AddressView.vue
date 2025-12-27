<template>
  <div class="address-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>收货地址</h1>
          <button class="add-btn" @click="openDialog()">添加地址</button>
        </div>

        <div class="address-list" v-if="addresses.length > 0">
          <div v-for="addr in addresses" :key="addr.id" class="address-card">
            <div class="card-main">
              <div class="addr-header">
                <span class="name">{{ addr.receiverName }}</span>
                <span class="phone">{{ addr.receiverPhone }}</span>
                <span class="default-tag" v-if="addr.isDefault">默认</span>
              </div>
              <p class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detailAddress }}</p>
            </div>
            <div class="card-actions">
              <button v-if="!addr.isDefault" @click="setDefault(addr)">设为默认</button>
              <button @click="openDialog(addr)">编辑</button>
              <button class="delete" @click="deleteAddress(addr)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p>暂无收货地址</p>
        </div>
      </div>
    </main>

    <!-- 地址弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑地址' : '添加地址'" width="480px">
      <el-form :model="addressForm" label-position="top">
        <el-form-item label="收货人">
          <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所在地区">
          <div class="region-row">
            <el-input v-model="addressForm.province" placeholder="省" />
            <el-input v-model="addressForm.city" placeholder="市" />
            <el-input v-model="addressForm.district" placeholder="区" />
          </div>
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detailAddress" type="textarea" :rows="2" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-cancel" @click="dialogVisible = false">取消</button>
        <button class="btn-confirm" @click="saveAddress">保存</button>
      </template>
    </el-dialog>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import addressApi from '../api/addressApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const userStore = useUserStore()
const addresses = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const addressForm = reactive({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false
})

const resetForm = () => {
  addressForm.receiverName = ''
  addressForm.receiverPhone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detailAddress = ''
  addressForm.isDefault = false
}

const openDialog = (addr?: any) => {
  if (addr) {
    isEdit.value = true
    editId.value = addr.id
    Object.assign(addressForm, addr)
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const fetchAddresses = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const res: any = await addressApi.getUserAddresses(userStore.userInfo.id)
    if (res?.code === 200) {
      addresses.value = res.data || []
    }
  } catch (error) {
    console.error('获取地址失败:', error)
  }
}

const saveAddress = async () => {
  try {
    const data = { ...addressForm, userId: userStore.userInfo?.id }
    if (isEdit.value && editId.value) {
      await addressApi.updateAddress(editId.value, data)
      ElMessage.success('修改成功')
    } else {
      await addressApi.addAddress(data)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchAddresses()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const setDefault = async (addr: any) => {
  try {
    await addressApi.setDefaultAddress(addr.id)
    ElMessage.success('设置成功')
    fetchAddresses()
  } catch (error) {
    ElMessage.error('设置失败')
  }
}

const deleteAddress = async (addr: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '提示', { type: 'warning' })
    await addressApi.deleteAddress(addr.id)
    ElMessage.success('删除成功')
    fetchAddresses()
  } catch {}
}

onMounted(() => {
  fetchAddresses()
})
</script>

<style scoped>
.address-page { min-height: 100vh; background: var(--white); position: relative; }

.address-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite;
}

.address-page::after {
  content: '';
  position: fixed;
  bottom: 5%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite reverse;
}

@keyframes floatAnim {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0; }
.add-btn { padding: 12px 28px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; border: none; border-radius: var(--radius-xl); font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.add-btn:hover { box-shadow: 0 6px 20px rgba(90, 143, 212, 0.4); transform: translateY(-2px); }

.address-card { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.4s;
}
.address-card:hover { box-shadow: 0 12px 40px rgba(90, 143, 212, 0.15); border-color: rgba(143, 180, 230, 0.6); }
.addr-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.name { font-weight: 600; font-size: 16px; color: var(--text-title); }
.phone { color: var(--text-body); font-size: 15px; }
.default-tag { padding: 4px 12px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; font-size: 12px; border-radius: 12px; }
.addr-detail { margin: 0; font-size: 15px; color: var(--text-body); }
.card-actions { display: flex; gap: 12px; }
.card-actions button { padding: 8px 18px; background: transparent; border: 1px solid rgba(90, 143, 212, 0.4); border-radius: var(--radius-md); font-size: 14px; color: var(--text-body); cursor: pointer; transition: all 0.3s; }
.card-actions button:hover { border-color: var(--sakura); color: var(--sakura); }
.card-actions button.delete:hover { border-color: #e74c3c; color: #e74c3c; }

.empty-state { 
  text-align: center;
  padding: 80px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}
.empty-state svg { opacity: 0.4; margin-bottom: 16px; color: var(--sakura); }
.empty-state p { font-size: 16px; }

.region-row { display: flex; gap: 12px; }
.region-row .el-input { flex: 1; }

:deep(.el-dialog) { border-radius: var(--radius-lg); }
:deep(.el-dialog__header) { border-bottom: 1px solid rgba(200, 220, 255, 0.3); padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
:deep(.el-dialog__footer) { border-top: 1px solid rgba(200, 220, 255, 0.3); padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper) { border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(200, 220, 255, 0.4); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--sakura); }

.btn-cancel, .btn-confirm { padding: 12px 28px; border-radius: var(--radius-xl); font-size: 15px; cursor: pointer; }
.btn-cancel { background: transparent; border: 1px solid rgba(200, 200, 220, 0.4); color: var(--text-body); }
.btn-confirm { background: linear-gradient(135deg, var(--sakura), #5A8FD4); border: none; color: #fff; }

@media (max-width: 768px) {
  .address-card { flex-direction: column; align-items: stretch; gap: 16px; }
  .card-actions { justify-content: flex-end; }
}
</style>
