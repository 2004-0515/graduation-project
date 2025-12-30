<template>
  <div class="ai-recommend-page">
    <Navbar />
    
    <main class="main-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/>
              <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div class="header-text">
            <h1>AI 智能助手</h1>
            <p>让购物更简单，为您提供个性化推荐</p>
          </div>
        </div>

        <div class="ai-layout">
          <!-- 左侧：AI聊天 -->
          <div class="chat-panel">
            <div class="chat-header">
              <div class="ai-avatar pulse">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="header-info">
                <h3>AI购物助手 · 小雅</h3>
                <div class="status-wrapper">
                  <span class="status-dot"></span>
                  <span class="status">在线 · 随时为您服务</span>
                </div>
              </div>
              <button class="settings-btn" @click="openApiKeyModal" title="设置API密钥">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>

            <div class="chat-messages" ref="messagesRef">
              <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role, 'fade-in']">
                <div class="message-avatar">
                  <template v-if="msg.role === 'ai'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    </svg>
                  </template>
                  <template v-else>
                    <span>{{ userInitial }}</span>
                  </template>
                </div>
                <div class="message-content">
                  <div class="message-text" v-html="formatMessage(msg.content)"></div>
                  <span class="message-time">{{ msg.time }}</span>
                </div>
              </div>
              
              <!-- 打字中动画 -->
              <div v-if="isTyping" class="message ai fade-in">
                <div class="message-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  </svg>
                </div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                    <span class="typing-text">正在思考...</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 快捷问题 -->
            <div class="quick-questions">
              <div class="quick-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span>快捷提问</span>
              </div>
              <div class="quick-list">
                <button v-for="q in quickQuestions" :key="q" @click="sendQuickQuestion(q)" class="quick-btn">
                  {{ q }}
                </button>
              </div>
            </div>

            <div class="chat-input">
              <div class="input-wrapper">
                <input 
                  v-model="inputText" 
                  @keyup.enter="sendMessage" 
                  placeholder="输入您想咨询的问题..."
                  :disabled="isTyping"
                />
                <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim() || isTyping">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <div class="input-hint">按 Enter 发送消息</div>
            </div>
          </div>

          <!-- 右侧：推荐商品 -->
          <div class="recommend-panel">
            <div class="panel-header">
              <div class="panel-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h2>猜你喜欢</h2>
              </div>
              <button class="refresh-btn" @click="refreshProducts" title="换一批">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
            
            <div class="products-grid">
              <div v-for="product in recommendProducts" :key="product.id" class="product-card" @click="goToProduct(product.id)">
                <div class="product-image">
                  <img :src="getImageUrl(product.mainImage)" :alt="product.name" />
                  <div class="product-badge" v-if="product.sales > 100">热销</div>
                </div>
                <div class="product-info">
                  <h4>{{ product.name }}</h4>
                  <div class="product-bottom">
                    <span class="price">
                      <small>¥</small>{{ product.price }}
                    </span>
                    <span class="sales">{{ product.sales }}人购买</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel-footer">
              <router-link to="/category" class="view-more-btn">
                <span>发现更多好物</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />

    <!-- API Key 设置弹窗 -->
    <Transition name="modal">
      <div v-if="showApiKeyModal" class="modal-overlay" @click.self="showApiKeyModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <h3>配置AI服务</h3>
          </div>
          <p class="modal-desc">
            使用硅基流动(SiliconFlow)提供的AI服务，新用户注册可获得免费额度
          </p>
          <div class="modal-steps">
            <div class="step">
              <span class="step-num">1</span>
              <span>访问 <a href="https://cloud.siliconflow.cn" target="_blank">cloud.siliconflow.cn</a></span>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <span>创建API密钥</span>
            </div>
            <div class="step">
              <span class="step-num">3</span>
              <span>粘贴到下方</span>
            </div>
          </div>
          <input 
            v-model="apiKeyInput" 
            type="password" 
            placeholder="请输入API密钥 (sk-...)"
            class="api-key-input"
          />
          <div class="modal-actions">
            <button class="btn-cancel" @click="showApiKeyModal = false">取消</button>
            <button class="btn-save" @click="saveApiKey">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              保存配置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { getAiResponse, quickQuestions, setApiKey, getStoredApiKey, setExtraData } from '@/utils/aiChat'
import productApi from '@/api/productApi'
import fileApi from '@/api/fileApi'
import adminApi from '@/api/adminApi'
import couponApi from '@/api/couponApi'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

interface Message {
  role: 'user' | 'ai'
  content: string
  time: string
}

const router = useRouter()
const userStore = useUserStore()
const messagesRef = ref<HTMLElement>()
const inputText = ref('')
const isTyping = ref(false)
const messages = ref<Message[]>([])
const allProducts = ref<any[]>([])
const showApiKeyModal = ref(false)
const apiKeyInput = ref('')
const refreshKey = ref(0)

const userInitial = computed(() => 
  userStore.userInfo?.nickname?.charAt(0) || 
  userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U'
)

const recommendProducts = computed(() => {
  // refreshKey用于触发重新计算
  const _ = refreshKey.value
  return [...allProducts.value]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
})

const refreshProducts = () => {
  refreshKey.value++
}

const getImageUrl = (url: string) => fileApi.getImageUrl(url)
const goToProduct = (id: number) => router.push(`/product/${id}`)

const getCurrentTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const formatMessage = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  messages.value.push({
    role: 'user',
    content: text,
    time: getCurrentTime()
  })
  inputText.value = ''
  scrollToBottom()

  isTyping.value = true
  scrollToBottom()

  try {
    const response = await getAiResponse(text, allProducts.value)
    
    isTyping.value = false
    messages.value.push({
      role: 'ai',
      content: response,
      time: getCurrentTime()
    })
    scrollToBottom()
  } catch (error) {
    isTyping.value = false
    messages.value.push({
      role: 'ai',
      content: '抱歉，AI服务暂时不可用，请稍后再试。',
      time: getCurrentTime()
    })
    scrollToBottom()
  }
}

const openApiKeyModal = () => {
  apiKeyInput.value = getStoredApiKey()
  showApiKeyModal.value = true
}

const saveApiKey = () => {
  setApiKey(apiKeyInput.value.trim())
  showApiKeyModal.value = false
  messages.value.push({
    role: 'ai',
    content: 'API密钥已保存，现在可以开始对话了！',
    time: getCurrentTime()
  })
}

const sendQuickQuestion = (question: string) => {
  inputText.value = question
  sendMessage()
}

onMounted(async () => {
  const greeting = userStore.isLoggedIn 
    ? `您好，${userStore.userInfo?.nickname || userStore.userInfo?.username}！我是雅集商城的AI购物助手小雅，有什么可以帮您的吗？\n\n您可以问我：\n• 商品推荐\n• 优惠活动\n• 订单查询\n• 售后问题`
    : '您好！我是雅集商城的AI购物助手小雅，很高兴为您服务！\n\n您可以问我：\n• 商品推荐\n• 优惠活动\n• 购物流程\n• 常见问题'
  
  messages.value.push({
    role: 'ai',
    content: greeting,
    time: getCurrentTime()
  })

  // 并行加载所有数据
  try {
    const [productsRes, categoriesRes, couponsRes] = await Promise.all([
      productApi.getProducts(1, 100),
      adminApi.getCategories().catch(() => ({ data: [] })),
      couponApi.getAvailableCoupons().catch(() => ({ data: [] }))
    ])

    // 商品数据
    if ((productsRes as any)?.code === 200) {
      const data = (productsRes as any).data
      allProducts.value = data?.content || data?.records || data || []
    }

    // 设置额外数据给AI
    setExtraData({
      categories: (categoriesRes as any)?.data || [],
      coupons: (couponsRes as any)?.data || []
    })

    console.log('AI数据加载完成:', {
      products: allProducts.value.length,
      categories: ((categoriesRes as any)?.data || []).length,
      coupons: ((couponsRes as any)?.data || []).length
    })
  } catch (e) {
    console.error('获取数据失败:', e)
  }
})
</script>


<style scoped>
.ai-recommend-page {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at 20% 0%, rgba(183, 212, 255, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(160, 200, 255, 0.3) 0%, transparent 40%),
    radial-gradient(ellipse at 40% 80%, rgba(200, 220, 255, 0.35) 0%, transparent 45%),
    linear-gradient(180deg, #FBFCFF 0%, #F5F8FF 30%, #FAFCFF 60%, #FFFFFF 100%);
}

.main-content {
  padding: 70px 0 12px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页面标题 - 更紧凑 */
.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(252, 254, 255, 0.92) 0%, rgba(248, 252, 255, 0.88) 100%);
  backdrop-filter: blur(24px);
  border-radius: 12px;
  border: 2px solid rgba(183, 212, 255, 0.4);
  box-shadow: 0 4px 16px rgba(90, 143, 212, 0.1);
}

.header-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #9EC5FF 0%, #5A8FD4 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(90, 143, 212, 0.3);
}

.header-icon svg {
  width: 20px;
  height: 20px;
}

.header-text h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-title);
}

.header-text p {
  display: none;
}

.ai-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  height: calc(100vh - 115px);
  min-height: 700px;
}

/* 聊天面板 */
.chat-panel {
  background: linear-gradient(135deg, rgba(252, 254, 255, 0.95) 0%, rgba(248, 252, 255, 0.92) 100%);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid rgba(183, 212, 255, 0.4);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.12);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #9EC5FF 0%, #5A8FD4 100%);
}

.chat-header .ai-avatar {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  backdrop-filter: blur(10px);
}

.chat-header .ai-avatar.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
}

.header-info h3 {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.status-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #51cf66;
  border-radius: 50%;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-info .status {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.settings-btn {
  margin-left: auto;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(45deg);
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, #f8f9ff 0%, #fff 100%);
}

.message {
  display: flex;
  gap: 14px;
  max-width: 80%;
}

.message.fade-in {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.ai .message-avatar {
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  color: #fff;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.3);
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #B7D4FF, #7BA3D9);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.3);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-text {
  padding: 16px 20px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.7;
}

.message.ai .message-text {
  background: #fff;
  color: #333;
  border: 1px solid #eee;
  border-bottom-left-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.message.user .message-text {
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  color: #fff;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.3);
}

.message-time {
  font-size: 12px;
  color: #999;
  padding: 0 6px;
}

.message.user .message-time {
  text-align: right;
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 20px;
  border-bottom-left-radius: 6px;
}

.typing-indicator span:not(.typing-text) {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

.typing-text {
  margin-left: 8px;
  font-size: 13px;
  color: #999;
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

/* 快捷问题 */
.quick-questions {
  padding: 12px 20px;
  background: #f8f9ff;
  border-top: 1px solid #eef0f5;
}

.quick-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #5A8FD4;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e0e5f0;
  border-radius: 18px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  border-color: transparent;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(90, 143, 212, 0.3);
}

/* 输入框 */
.chat-input {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #eef0f5;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-input input {
  flex: 1;
  padding: 12px 18px;
  border: 2px solid #eef0f5;
  border-radius: 22px;
  font-size: 14px;
  background: #f8f9ff;
  transition: all 0.3s;
}

.chat-input input:focus {
  border-color: #5A8FD4;
  background: #fff;
  outline: none;
  box-shadow: 0 0 0 4px rgba(90, 143, 212, 0.1);
}

.send-btn {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.4);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(90, 143, 212, 0.5);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  display: none;
}

/* 推荐面板 */
.recommend-panel {
  background: linear-gradient(135deg, rgba(252, 254, 255, 0.95) 0%, rgba(248, 252, 255, 0.92) 100%);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid rgba(183, 212, 255, 0.4);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.12);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(135deg, #B7D4FF 0%, #5A8FD4 100%);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.panel-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(180deg);
}

.products-grid {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-content: start;
}

.product-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.product-card .product-image {
  position: relative;
  height: 100px;
  background: #f8f9fa;
  overflow: hidden;
}

.product-card .product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.08);
}

.product-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #5A8FD4, #9EC5FF);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
}

.product-card .product-info {
  padding: 10px 12px;
}

.product-card h4 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-bottom .price {
  font-size: 16px;
  font-weight: 700;
  color: #5A8FD4;
}

.product-bottom .price small {
  font-size: 11px;
}

.product-bottom .sales {
  font-size: 10px;
  color: #999;
}

.panel-footer {
  padding: 12px 16px;
  background: #f8f9ff;
  border-top: 1px solid #eef0f5;
}

.view-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
}

.view-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(90, 143, 212, 0.4);
}

/* 弹窗动画 */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content, .modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.modal-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.modal-content h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.modal-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.modal-steps {
  background: linear-gradient(135deg, rgba(183, 212, 255, 0.15), rgba(90, 143, 212, 0.1));
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 20px;
}

.step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
}

.step-num {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step a {
  color: #5A8FD4;
  text-decoration: none;
  font-weight: 500;
}

.step a:hover {
  text-decoration: underline;
}

.api-key-input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #eef0f5;
  border-radius: 14px;
  font-size: 14px;
  margin-bottom: 24px;
  box-sizing: border-box;
  transition: all 0.3s;
}

.api-key-input:focus {
  border-color: #5A8FD4;
  outline: none;
  box-shadow: 0 0 0 4px rgba(90, 143, 212, 0.1);
}

.modal-actions {
  display: flex;
  gap: 14px;
  justify-content: flex-end;
}

.btn-cancel, .btn-save {
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #f5f5f5;
  border: none;
  color: #666;
}

.btn-cancel:hover {
  background: #eee;
}

.btn-save {
  background: linear-gradient(135deg, #9EC5FF, #5A8FD4);
  border: none;
  color: #fff;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.4);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(90, 143, 212, 0.5);
}

/* 响应式 */
@media (max-width: 1000px) {
  .ai-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .chat-panel {
    height: 65vh;
    min-height: 500px;
  }
  
  .recommend-panel {
    height: auto;
  }
  
  .products-grid {
    max-height: 400px;
  }
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .header-text h1 {
    font-size: 22px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
