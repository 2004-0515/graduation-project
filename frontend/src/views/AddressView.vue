<template>
  <div class="address-container">
    <div class="address-header">
      <h1>收货地址</h1>
      <p class="address-subtitle">管理您的收货地址，方便快捷购物</p>
    </div>
    
    <div class="address-content">
      <!-- 添加新地址按钮 -->
      <el-card class="add-address-card">
        <div class="add-address-btn-container">
          <el-button type="primary" size="large" @click="showAddAddressDialog">
            <el-icon><Plus /></el-icon>
            新增收货地址
          </el-button>
        </div>
      </el-card>
      
      <!-- 地址列表 -->
      <div class="address-list">
        <el-card v-if="addresses.length === 0" class="empty-addresses-card">
          <el-empty description="暂无收货地址">
            <el-button type="primary" @click="showAddAddressDialog">添加地址</el-button>
          </el-empty>
        </el-card>
        
        <el-card 
          v-for="address in addresses" 
          :key="address.id" 
          class="address-item-card"
          :class="{ 'default-address': address.isDefault }"
        >
          <div class="address-header-info">
            <div class="address-basic-info">
              <div class="address-name">{{ address.name }}</div>
              <div class="address-phone">{{ address.phone }}</div>
              <el-tag v-if="address.isDefault" type="success" size="small" class="default-tag">默认</el-tag>
            </div>
            <div class="address-actions">
              <el-button type="text" size="small" @click="editAddress(address)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="text" size="small" @click="deleteAddress(address.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
              <el-button 
                v-if="!address.isDefault" 
                type="text" 
                size="small" 
                @click="setDefaultAddress(address.id)"
              >
                <el-icon><Star /></el-icon>
                设为默认
              </el-button>
            </div>
          </div>
          
          <div class="address-detail">
            <div class="province-city-area">
              {{ address.province }} {{ address.city }} {{ address.area }}
            </div>
            <div class="street-detail">
              {{ address.detail }}
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 地址编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form
        ref="addressFormRef"
        :model="formData"
        :rules="addressRules"
        label-width="80px"
      >
        <el-form-item label="收件人" prop="name">
          <el-input v-model="formData.name" placeholder="请输入收件人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="formData.province" placeholder="请输入省份" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="formData.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="区县" prop="area">
          <el-input v-model="formData.area" placeholder="请输入区县" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input 
            v-model="formData.detail" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入详细地址"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="formData.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddress">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Delete, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import addressApi from '../api/addressApi'

// 地址数据
const addresses = ref([])

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增收货地址')
const addressFormRef = ref(null)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  phone: '',
  province: '',
  city: '',
  area: '',
  detail: '',
  isDefault: false
})

// 表单验证规则
const addressRules = {
  name: [
    { required: true, message: '请输入收件人姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请输入省份', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'blur' }
  ],
  area: [
    { required: true, message: '请输入区县', trigger: 'blur' }
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '详细地址长度在 5 到 100 个字符', trigger: 'blur' }
  ]
}

// 显示新增地址对话框
const showAddAddressDialog = () => {
  dialogTitle.value = '新增收货地址'
  resetForm()
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    phone: '',
    province: '',
    city: '',
    area: '',
    detail: '',
    isDefault: false
  }
  if (addressFormRef.value) {
    addressFormRef.value.resetFields()
  }
}

// 编辑地址
const editAddress = (address) => {
  dialogTitle.value = '编辑收货地址'
  formData.value = { ...address }
  dialogVisible.value = true
}

// 保存地址
const saveAddress = async () => {
  if (!addressFormRef.value) return
  
  try {
    await addressFormRef.value.validate()
    
    // 转换字段名：前端area -> 后端district
    const addressData = {
      ...formData.value,
      district: formData.value.area, // 字段名映射
      area: undefined, // 删除不需要的字段
      status: 1 // 添加默认状态
    }
    
    if (formData.value.id) {
      // 更新地址
      const response = await addressApi.updateAddress(addressData.id, addressData)
      if (response.success) {
        await fetchAddresses() // 重新获取地址列表
        ElMessage.success('地址更新成功')
      } else {
        ElMessage.error(response.message || '地址更新失败')
      }
    } else {
      // 新增地址
      console.log('提交的地址数据:', addressData)
      const response = await addressApi.addAddress(addressData)
      console.log('API响应:', response)
      if (response.success) {
        await fetchAddresses() // 重新获取地址列表
        ElMessage.success('地址添加成功')
      } else {
        ElMessage.error(response.message || '地址添加失败')
      }
    }
    dialogVisible.value = false
  } catch (error) {
    // 显示完整的错误信息，帮助调试
    console.error('保存地址失败:', JSON.stringify(error, null, 2))
    
    // 处理详细的错误信息
    let errorMessage = '保存地址失败，请稍后重试'
    
    // 检查错误对象结构
    if (error.success === false) {
      // 后端返回的标准错误格式
      errorMessage = error.message || errorMessage
      // 如果有详细错误信息，添加到提示中
      if (error.data && error.data.errors) {
        const detailedErrors = Object.values(error.data.errors).join('; ')
        errorMessage += `: ${detailedErrors}`
      }
    } else if (error.response) {
      // axios响应错误
      console.error('错误响应:', JSON.stringify(error.response, null, 2))
      if (error.response.data) {
        // 服务器返回了具体错误
        if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
      } else {
        // 服务器没有返回具体错误
        errorMessage = `请求失败: ${error.response.status} ${error.response.statusText}`
      }
    } else if (error.message) {
      // 其他类型的错误
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
  }
}

// 删除地址
const deleteAddress = (id) => {
  ElMessageBox.confirm('确定要删除这个地址吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await addressApi.deleteAddress(id)
      if (response.success) {
        await fetchAddresses() // 重新获取地址列表
        ElMessage.success('地址删除成功')
      } else {
        ElMessage.error(response.message || '地址删除失败')
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      ElMessage.error('删除地址失败，请稍后重试')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 设置默认地址
const setDefaultAddress = async (id) => {
  try {
    const response = await addressApi.setDefaultAddress(id)
    if (response.success) {
      await fetchAddresses() // 重新获取地址列表
      ElMessage.success('默认地址设置成功')
    } else {
      ElMessage.error(response.message || '默认地址设置失败')
    }
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败，请稍后重试')
  }
}

// 获取地址列表
const fetchAddresses = async () => {
  try {
    const response = await addressApi.getUserAddresses()
    if (response.success && Array.isArray(response.data)) {
      // 转换字段名：后端district -> 前端area
      addresses.value = response.data.map(address => ({
        ...address,
        area: address.district, // 字段名映射
        district: undefined // 删除不需要的字段
      }))
    } else {
      addresses.value = []
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败，请稍后重试')
    addresses.value = []
  }
}

// 组件挂载时初始化地址数据
onMounted(() => {
  fetchAddresses()
})
</script>

<style scoped>
.address-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.address-header {
  margin-bottom: 30px;
  text-align: center;
}

.address-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.address-subtitle {
  color: #666;
  font-size: 16px;
}

.address-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.add-address-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background-color: #fafafa;
}

.add-address-btn-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.empty-addresses-card {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.address-item-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.address-item-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.address-item-card.default-address {
  border: 2px solid #67c23a;
}

.address-item-card.default-address::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: #67c23a;
}

.address-header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.address-basic-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.address-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.address-phone {
  font-size: 14px;
  color: #666;
}

.default-tag {
  margin-left: 8px;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.address-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.province-city-area {
  font-weight: 500;
}

.street-detail {
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .address-list {
    grid-template-columns: 1fr;
  }
  
  .address-header-info {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .address-actions {
    justify-content: flex-end;
  }
}
</style>