<template>
  <div class="login-page">
    <div class="deco-layer">
      <div class="deco-bg"></div>
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>

    <div class="login-card glass-card">
      <div class="card-header">
        <span class="logo text-title">雅集商城</span>
        <h2>欢迎回来</h2>
        <p>登录账号，继续购物</p>
      </div>

      <div class="card-body">
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top" @keyup.enter="handleLogin">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
          </el-form-item>

          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="loginForm.captcha" placeholder="请输入验证码" />
              <div class="captcha-box" @click="refreshCaptcha">
                <img :src="captchaUrl" alt="验证码" />
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <button type="button" class="btn btn-primary btn-full" @click="handleLogin" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span>还没有账号？</span>
          <router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import { generateRandomCode } from '../utils/captcha'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({ username: '', password: '', captcha: '' })

onMounted(() => { setTimeout(() => { loginForm.username = ''; loginForm.password = '' }, 0) })

const generateCaptcha = () => {
  const code = generateRandomCode(6)
  const canvas = document.createElement('canvas')
  canvas.width = 120; canvas.height = 40
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f8f8fc'; ctx.fillRect(0, 0, 120, 40)
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(180, 180, 200, ${Math.random() * 0.3 + 0.1})`
    ctx.beginPath(); ctx.moveTo(Math.random() * 120, Math.random() * 40)
    ctx.lineTo(Math.random() * 120, Math.random() * 40); ctx.stroke()
  }
  ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  for (let i = 0; i < code.length; i++) {
    ctx.fillStyle = `rgb(${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${120 + Math.random() * 50})`
    ctx.fillText(code[i], 20 + i * 16, 20 + (Math.random() - 0.5) * 8)
  }
  return { code, url: canvas.toDataURL('image/png') }
}

const captchaData = ref(generateCaptcha())
const captchaUrl = computed(() => captchaData.value.url)
const refreshCaptcha = () => { captchaData.value = generateCaptcha(); loginForm.captcha = '' }

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, max: 20, message: '密码长度 6-20 个字符', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }, {
    validator: (_rule: any, value: string, callback: Function) => {
      if (!value) callback(new Error('请输入验证码'))
      else if (value.toLowerCase() !== captchaData.value.code.toLowerCase()) callback(new Error('验证码错误'))
      else callback()
    }, trigger: 'blur'
  }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login({ username: loginForm.username, password: loginForm.password })
        ElMessage.success('登录成功')
        const redirect = router.currentRoute.value.query.redirect as string
        router.push(redirect || '/')
      } catch (error) {
        ElMessage.error(userStore.error || '登录失败')
        refreshCaptcha()
      } finally { loading.value = false }
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--white);
  position: relative;
}

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: -20%; right: -10%; width: 60%; height: 70%; background: url('https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800') center/cover; opacity: 0.1; filter: blur(50px) saturate(1.2); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 5%; left: -5%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; right: -5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.login-card {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  padding: 0;
  overflow: hidden;
}

.card-header {
  padding: 40px 32px 24px;
  text-align: center;
}

.logo {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 4px;
  display: block;
  margin-bottom: 20px;
}

.card-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-title);
  margin: 0 0 8px;
}

.card-header p {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0;
}

.card-body { padding: 0 32px 40px; }

:deep(.el-form-item__label) { font-size: 15px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper) { background: rgba(255,255,255,0.6); border-radius: var(--radius-md); box-shadow: none !important; border: 1px solid rgba(200,200,220,0.3); }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--sakura); }

.captcha-row { display: flex; gap: 12px; }
.captcha-row .el-input { flex: 1; }
.captcha-box { width: 110px; height: 40px; border-radius: var(--radius-md); overflow: hidden; cursor: pointer; border: 1px solid rgba(200,200,220,0.3); }
.captcha-box img { width: 100%; height: 100%; }

.btn-full { width: 100%; }

.form-footer { text-align: center; margin-top: 20px; font-size: 15px; color: var(--text-muted); }
.form-footer a { color: var(--sakura); text-decoration: none; margin-left: 4px; }
.form-footer a:hover { text-decoration: underline; }
</style>
