<template>
  <div class="register-page">
    <div class="deco-layer">
      <div class="deco-bg"></div>
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>

    <div class="register-card glass-card">
      <div class="card-header">
        <span class="logo text-title">雅集商城</span>
        <h2>创建账号</h2>
        <p>加入我们，开启品质生�?/p>
      </div>

      <div class="card-body">
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-position="top">
          <el-form-item label="用户�? prop="username">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" prefix-icon="User" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="registerForm.email" placeholder="请输入邮�? prefix-icon="Message" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密�? prefix-icon="Lock" show-password />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密�? prefix-icon="Lock" show-password />
          </el-form-item>

          <el-form-item>
            <button type="button" class="btn btn-primary btn-full" @click="handleRegister" :disabled="loading">
              {{ loading ? '注册�?..' : '注册' }}
            </button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span>已有账号�?/span>
          <router-link to="/login">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({ username: '', email: '', password: '', confirmPassword: '' })

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, max: 20, message: '用户名长�?3-20 个字�?, trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮�?, trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密�?, trigger: 'blur' }, { min: 6, max: 20, message: '密码长度 6-20 个字�?, trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请再次输入密�?, trigger: 'blur' }, {
    validator: (_rule: any, value: string, callback: Function) => {
      if (value !== registerForm.password) callback(new Error('两次输入的密码不一�?))
      else callback()
    }, trigger: 'blur'
  }]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.register({ username: registerForm.username, email: registerForm.email, password: registerForm.password })
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error) {
        ElMessage.error(userStore.error || '注册失败')
      } finally { loading.value = false }
    }
  })
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--white);
  position: relative;
}

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; bottom: -20%; left: -10%; width: 60%; height: 70%; background: url('https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800') center/cover; opacity: 0.1; filter: blur(50px) saturate(1.2); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 5%; right: -5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -5%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.register-card { width: 100%; max-width: 420px; position: relative; z-index: 1; }

.card-header { padding: 40px 32px 20px; text-align: center; }
.logo { font-size: 28px; font-weight: 600; letter-spacing: 4px; display: block; margin-bottom: 20px; }
.card-header h2 { font-size: 24px; font-weight: 600; color: var(--text-title); margin: 0 0 8px; }
.card-header p { font-size: 16px; color: var(--text-muted); margin: 0; }

.card-body { padding: 0 32px 40px; }

:deep(.el-form-item) { margin-bottom: 18px; }
:deep(.el-form-item__label) { font-size: 15px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper) { background: rgba(255,255,255,0.6); border-radius: var(--radius-md); box-shadow: none !important; border: 1px solid rgba(200,200,220,0.3); }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--sakura); }

.btn-full { width: 100%; }

.form-footer { text-align: center; margin-top: 20px; font-size: 15px; color: var(--text-muted); }
.form-footer a { color: var(--sakura); text-decoration: none; margin-left: 4px; }
</style>
