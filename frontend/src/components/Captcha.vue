<template>
  <div class="captcha-container">
    <el-form-item :label="label" :prop="prop">
      <div class="captcha-input-group">
        <el-input
          v-model="localCode"
          :placeholder="placeholder"
          :prefix-icon="prefixIcon"
          @input="handleInput"
        ></el-input>
        <div class="captcha-image-wrapper">
          <img
            :src="captchaUrl"
            alt="验证码"
            class="captcha-image"
            @click="refreshCaptcha"
            title="点击刷新验证码"
          />
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { generateRandomCode } from '../utils/captcha'

// 组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: '验证码'
  },
  prop: {
    type: String,
    default: 'captcha'
  },
  placeholder: {
    type: String,
    default: '请输入验证码'
  },
  prefixIcon: {
    type: String,
    default: 'View'
  }
})

// 组件事件
const emit = defineEmits(['update:modelValue'])

// 本地验证码输入
const localCode = ref(props.modelValue)

// 生成随机验证码
const generateCaptcha = () => {
  const code = generateRandomCode(6)
  // 这里应该调用后端接口获取验证码，暂时使用前端生成的验证码
  // 生成一个简单的验证码图片URL（使用data URL）
  const canvas = document.createElement('canvas')
  canvas.width = 120
  canvas.height = 40
  const ctx = canvas.getContext('2d')
  
  // 绘制背景
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制干扰线
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.stroke()
  }
  
  // 绘制验证码文本
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 为每个字符使用不同的颜色和位置
  for (let i = 0; i < code.length; i++) {
    ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`
    ctx.fillText(
      code[i],
      20 + i * 16,
      20 + (Math.random() - 0.5) * 10,
      16
    )
  }
  
  return {
    code,
    url: canvas.toDataURL('image/png')
  }
}

// 验证码数据
const captchaData = ref(generateCaptcha())
const captchaUrl = computed(() => captchaData.value.url)

// 刷新验证码
const refreshCaptcha = () => {
  captchaData.value = generateCaptcha()
}

// 监听输入变化
const handleInput = (value) => {
  localCode.value = value
  emit('update:modelValue', value)
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    localCode.value = newValue
  }
)

// 暴露验证方法给父组件
defineExpose({
  validate: () => {
    return localCode.value.toLowerCase() === captchaData.value.code.toLowerCase()
  },
  refresh: refreshCaptcha
})
</script>

<style scoped>
.captcha-container {
  margin-bottom: 20px;
}

.captcha-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.captcha-input-group .el-input {
  flex: 1;
}

.captcha-image-wrapper {
  flex: 0 0 auto;
}

.captcha-image {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
}

.captcha-image:hover {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
</style>