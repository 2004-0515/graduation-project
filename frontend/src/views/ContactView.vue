<template>
  <div class="contact-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>联系客服</h1>
          <p>我们随时为您提供帮助</p>
        </div>

        <div class="contact-layout">
          <div class="contact-info">
            <div class="info-card glass-card">
              <div class="info-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <h3>客服热线</h3>
              <p class="info-value">400-888-8888</p>
              <p class="info-desc">工作时间：9:00 - 21:00</p>
            </div>

            <div class="info-card glass-card">
              <div class="info-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3>客服邮箱</h3>
              <p class="info-value">support@yaji.com</p>
              <p class="info-desc">24小时内回复</p>
            </div>

            <div class="info-card glass-card">
              <div class="info-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <h3>在线客服</h3>
              <p class="info-value">即时响应</p>
              <p class="info-desc">点击右下角图标开始对话</p>
            </div>
          </div>

          <div class="contact-form glass-card">
            <h2>留言反馈</h2>
            <p class="form-desc">如有任何问题或建议，请填写以下表单，我们会尽快回复您</p>
            
            <el-form :model="form" label-position="top">
              <el-form-item label="您的姓名">
                <el-input v-model="form.name" placeholder="请输入姓名" />
              </el-form-item>
              <el-form-item label="联系方式">
                <el-input v-model="form.contact" placeholder="手机号或邮箱" />
              </el-form-item>
              <el-form-item label="问题类型">
                <el-select v-model="form.type" placeholder="请选择">
                  <el-option label="商品咨询" value="product" />
                  <el-option label="订单问题" value="order" />
                  <el-option label="支付问题" value="payment" />
                  <el-option label="退换货" value="return" />
                  <el-option label="投诉建议" value="feedback" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="问题描述">
                <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请详细描述您的问题" />
              </el-form-item>
              <el-form-item>
                <button type="button" class="submit-btn" @click="submitForm">提交留言</button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const form = reactive({
  name: '',
  contact: '',
  type: '',
  content: ''
})

const submitForm = () => {
  if (!form.name || !form.contact || !form.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  ElMessage.success('留言提交成功，我们会尽快回复您')
  form.name = ''
  form.contact = ''
  form.type = ''
  form.content = ''
}
</script>

<style scoped>
.contact-page { min-height: 100vh; background: var(--white); position: relative; }
.contact-page::before { content: ''; position: fixed; top: 5%; right: -10%; width: 600px; height: 600px; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }
.contact-page::after { content: ''; position: fixed; bottom: 5%; left: -10%; width: 500px; height: 500px; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }
.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header { margin-bottom: 32px; text-align: center; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 8px; }
.page-header p { font-size: 15px; color: var(--text-muted); margin: 0; }
.contact-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.contact-info { display: flex; flex-direction: column; gap: 20px; }
.info-card { padding: 32px; text-align: center; }
.info-icon { width: 64px; height: 64px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: rgba(90, 143, 212, 0.1); border-radius: 50%; color: #5A8FD4; }
.info-card h3 { margin: 0 0 12px; font-size: 18px; font-weight: 600; color: var(--text-title); }
.info-value { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #5A8FD4; }
.info-desc { margin: 0; font-size: 14px; color: var(--text-muted); }
.contact-form { padding: 36px; }
.contact-form h2 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 600; color: var(--text-title); }
.form-desc { margin: 0 0 28px; font-size: 15px; color: var(--text-muted); }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper), :deep(.el-textarea__inner), :deep(.el-select__wrapper) { border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(200, 220, 255, 0.4); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) { border-color: var(--sakura); }
.submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; border: none; border-radius: var(--radius-xl); font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.submit-btn:hover { box-shadow: 0 6px 24px rgba(90, 143, 212, 0.5); transform: translateY(-2px); }
@media (max-width: 768px) { .contact-layout { grid-template-columns: 1fr; } }
</style>
