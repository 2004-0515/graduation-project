<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="login-header">
          <h2>用户登录</h2>
        </div>
      </template>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top" autocomplete="off" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-input-group">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              prefix-icon="View"
              style="width: calc(100% - 130px);"
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
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" block>
            登录
          </el-button>
        </el-form-item>
        <div class="register-link">
          <span>还没有账号？</span>
          <a @click="$router.push('/register')">立即注册</a>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import { generateRandomCode } from '../utils/captcha'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

// 组件挂载后清空表单值，防止浏览器自动填充
onMounted(() => {
  // 使用setTimeout确保DOM渲染完成后再清空
  setTimeout(() => {
    loginForm.username = ''
    loginForm.password = ''
  }, 0)
})

// 生成随机验证码
const generateCaptcha = () => {
  const code = generateRandomCode(6)
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
  loginForm.captcha = ''
}

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度必须在 3 到 20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度必须在 6 到 20 个字符之间', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入验证码'))
        } else if (value.toLowerCase() !== captchaData.value.code.toLowerCase()) {
          callback(new Error('验证码输入错误，请重新输入'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  // 使用Element Plus表单验证的回调方式，更可靠地区分表单验证和API调用
  loginFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      // 表单验证通过，调用登录API
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        // 登录成功后跳转到首页
        router.push('/')
      } catch (error) {
        console.error('登录失败:', error)
        // 只有API调用失败时，才显示全局错误消息
        ElMessage.error(userStore.error || '登录失败，请检查用户名和密码是否正确')
      }
    } else {
      // 表单验证失败，不显示全局错误消息
      // Element Plus会在字段下方显示具体的错误信息
      console.log('表单验证失败:', fields)
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.login-header {
  text-align: center;
  padding: 24px 0;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
}

.login-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: bold;
}

/* 优化按钮样式 */
:deep(.el-button--primary) {
  background-color: #409eff;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  opacity: 1;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}

:deep(.el-button--primary:active) {
  background-color: #3a8ee6;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.6);
  transform: translateY(0);
}

:deep(.el-button--primary.is-loading) {
  opacity: 0.8;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s ease;
}

.register-link a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 20px;
  text-align: center;
}

:deep(.el-form-item__label) {
  color: #333;
  font-weight: 500;
  text-align: left;
  display: block;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  border-color: #c6e2ff;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.4);
  border-color: #409eff;
}

:deep(.el-input__inner) {
  font-size: 14px;
}

/* 表单内容区域 */
:deep(.el-form) {
  padding: 20px;
  width: 100%;
}

/* 确保按钮居中显示 */
:deep(.el-button--primary) {
  display: block;
  margin: 0 auto;
  width: 100%;
  max-width: 200px;
}

/* 验证码样式 */
.captcha-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
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