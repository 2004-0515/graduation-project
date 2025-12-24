<template>
  <div class="checkout-container">
    <h1 class="page-title">结算页面</h1>
    
    <el-card class="checkout-card">
      <template #header>
        <div class="card-header">
          <span>订单信息</span>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>
      
      <div v-else-if="error" class="error-container">
        <el-alert
          title="加载失败"
          :description="error"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button type="primary" @click="fetchData">重新加载</el-button>
      </div>
      
      <div v-else class="checkout-content">
        <!-- 收货地址 -->
        <div class="section">
          <h3 class="section-title">收货地址</h3>
          <div v-if="addresses.length > 0" class="address-list">
            <el-radio-group v-model="selectedAddressId">
              <div
                v-for="address in addresses"
                :key="address.id"
                class="address-item"
                :class="{ active: address.id === selectedAddressId }"
              >
                <el-radio :label="address.id"></el-radio>
                <div class="address-info">
                  <div class="address-name">{{ address.name }} {{ address.phone }}</div>
                  <div class="address-detail">{{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}</div>
                </div>
              </div>
            </el-radio-group>
          </div>
          <div v-else class="no-address">
            <el-empty description="暂无收货地址"></el-empty>
            <el-button type="primary" @click="navigateToAddress">添加收货地址</el-button>
          </div>
        </div>
        
        <!-- 商品信息 -->
        <div class="section">
          <h3 class="section-title">商品信息</h3>
          <div class="product-list">
            <div
              v-for="item in checkoutItems"
              :key="item.productId"
              class="product-item"
            >
              <div class="product-image">
                <el-image :src="item.productImage" fit="cover"></el-image>
              </div>
              <div class="product-info">
                <div class="product-name">{{ item.productName }}</div>
                <div class="product-price">¥{{ item.price.toFixed(2) }}</div>
              </div>
              <div class="product-quantity">
                <span>数量：{{ item.quantity }}</span>
              </div>
              <div class="product-subtotal">
                ¥{{ (item.price * item.quantity).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 订单金额 -->
        <div class="section">
          <h3 class="section-title">订单金额</h3>
          <div class="order-amount">
            <div class="amount-item">
              <span>商品总价：</span>
              <span>¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="amount-item">
              <span>运费：</span>
              <span>{{ shippingFee === 0 ? '免运费' : `¥${shippingFee.toFixed(2)}` }}</span>
            </div>
            <div class="amount-item total">
              <span>实付金额：</span>
              <span class="total-price">¥{{ (totalPrice + shippingFee).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 支付方式 -->
        <div class="section">
          <h3 class="section-title">支付方式</h3>
          <div class="payment-methods">
            <el-radio-group v-model="selectedPaymentMethod">
              <div class="payment-method">
                <el-radio label="alipay"></el-radio>
                <span>支付宝</span>
              </div>
              <div class="payment-method">
                <el-radio label="wechat"></el-radio>
                <span>微信支付</span>
              </div>
            </el-radio-group>
          </div>
        </div>
        
        <!-- 提交订单按钮 -->
        <div class="submit-section">
          <el-button type="primary" size="large" @click="submitOrder" :disabled="!canSubmit">
            提交订单
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 状态管理
const loading = ref(false)
const error = ref('')
const addresses = ref([])
const selectedAddressId = ref('')
const selectedPaymentMethod = ref('alipay')
const shippingFee = ref(0)
const checkoutItems = ref([])

// 计算属性
const totalPrice = computed(() => {
  return checkoutItems.value.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)
})

const canSubmit = computed(() => {
  return addresses.value.length > 0 && selectedAddressId.value && checkoutItems.value.length > 0
})

// 初始化数据
onMounted(() => {
  fetchData()
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 获取收货地址
    await fetchAddresses()
    
    // 处理结算商品
    await processCheckoutItems()
    
    // 计算运费
    calculateShippingFee()
  } catch (err) {
    error.value = err.message || '加载失败，请稍后重试'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 获取收货地址
const fetchAddresses = async () => {
  try {
    const response = await userStore.fetchAddresses()
    if (response.success && Array.isArray(response.data)) {
      // 转换字段名：后端district -> 前端area
      addresses.value = response.data.map(address => ({
        ...address,
        area: address.district, // 字段名映射
        district: undefined // 删除不需要的字段
      }))
      if (addresses.value.length > 0) {
        // 默认选择第一个地址
        selectedAddressId.value = addresses.value[0].id
      }
    } else {
      // 接口返回成功但数据格式不符合预期，使用空数组
      addresses.value = []
    }
  } catch (err) {
    // 捕获错误，使用空数组，允许用户继续操作
    console.warn('获取收货地址失败，使用空地址列表:', err)
    addresses.value = []
    // 不抛出错误，允许页面继续渲染
  }
}

// 处理结算商品
const processCheckoutItems = async () => {
  // 从路由参数获取商品信息
  const productId = route.query.productId
  const quantity = parseInt(route.query.quantity || '1')
  
  if (productId) {
    // 立即购买模式：单个商品
    try {
      const response = await cartStore.fetchProductById(productId)
      if (response.success && response.data) {
        const product = response.data
        checkoutItems.value = [{
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          quantity: quantity
        }]
      }
    } catch (err) {
      throw new Error('获取商品信息失败')
    }
  } else {
    // 购物车结算模式：多个商品
    const selectedItems = cartStore.cartItems.filter(item => item.selected)
    if (selectedItems.length === 0) {
      throw new Error('请选择要结算的商品')
    }
    
    checkoutItems.value = selectedItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: item.price,
      quantity: item.quantity
    }))
  }
}

// 计算运费
const calculateShippingFee = () => {
  // 简单的运费计算逻辑：订单金额满99免运费，否则10元运费
  shippingFee.value = totalPrice.value >= 99 ? 0 : 10
}

// 导航到地址管理页
const navigateToAddress = () => {
  router.push('/address')
}

// 提交订单
const submitOrder = async () => {
  if (!canSubmit.value) return
  
  loading.value = true
  
  try {
    const orderData = {
      addressId: selectedAddressId.value,
      paymentMethod: selectedPaymentMethod.value,
      shippingFee: shippingFee.value,
      totalAmount: totalPrice.value + shippingFee.value,
      items: checkoutItems.value.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    }
    
    const response = await cartStore.createOrder(orderData)
    if (response.success) {
      ElMessage.success('订单创建成功')
      // 跳转到订单详情页或支付页
      router.push(`/orders`)
    } else {
      throw new Error(response.message || '订单创建失败')
    }
  } catch (err) {
    ElMessage.error(err.message || '订单创建失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.checkout-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  padding: 20px;
}

.error-container {
  padding: 20px;
  text-align: center;
}

.checkout-content {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.section-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.address-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.address-item.active {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.address-info {
  flex: 1;
  margin-left: 15px;
}

.address-name {
  font-weight: 600;
  margin-bottom: 5px;
}

.address-detail {
  color: #666;
  font-size: 14px;
}

.no-address {
  text-align: center;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  gap: 20px;
}

.product-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 600;
  margin-bottom: 5px;
}

.product-price {
  color: #f56c6c;
  font-weight: 600;
}

.product-quantity {
  font-size: 14px;
  color: #666;
}

.product-subtotal {
  font-weight: 600;
  color: #333;
}

.order-amount {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-item.total {
  font-weight: 600;
  font-size: 18px;
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
  margin-top: 10px;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
}

.payment-methods {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  gap: 30px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.submit-section {
  text-align: center;
  margin-top: 30px;
}

.submit-section button {
  padding: 12px 40px;
  font-size: 16px;
}
</style>