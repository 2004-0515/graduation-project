<template>
  <div class="help-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>帮助中心</h1>
          <p>常见问题解答，帮助您更好地使用雅集商城</p>
        </div>

        <div class="help-layout">
          <aside class="help-sidebar">
            <div class="sidebar-card glass-card">
              <h3>问题分类</h3>
              <ul class="category-list">
                <li v-for="cat in categories" :key="cat.id" :class="{ active: activeCategory === cat.id }" @click="activeCategory = cat.id">
                  {{ cat.name }}
                </li>
              </ul>
            </div>
          </aside>

          <div class="help-main">
            <div class="faq-list">
              <div v-for="faq in filteredFaqs" :key="faq.id" class="faq-item glass-card" @click="faq.expanded = !faq.expanded">
                <div class="faq-question">
                  <h4>{{ faq.question }}</h4>
                  <span class="arrow" :class="{ expanded: faq.expanded }">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </div>
                <transition name="slide">
                  <div v-if="faq.expanded" class="faq-answer">
                    <p>{{ faq.answer }}</p>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const activeCategory = ref('all')

const categories = [
  { id: 'all', name: '全部问题' },
  { id: 'account', name: '账户相关' },
  { id: 'order', name: '订单相关' },
  { id: 'payment', name: '支付相关' },
  { id: 'shipping', name: '配送相关' },
  { id: 'return', name: '退换货' }
]

const faqs = ref([
  { id: 1, category: 'account', question: '如何注册账号？', answer: '点击页面右上角的"登录"按钮，然后选择"注册"，填写用户名、邮箱和密码即可完成注册。', expanded: false },
  { id: 2, category: 'account', question: '忘记密码怎么办？', answer: '在登录页面点击"忘记密码"，输入注册时使用的邮箱，我们会发送重置密码的链接到您的邮箱。', expanded: false },
  { id: 3, category: 'order', question: '如何查看我的订单？', answer: '登录后，点击右上角头像进入个人中心，选择"我的订单"即可查看所有订单记录。', expanded: false },
  { id: 4, category: 'order', question: '订单可以取消吗？', answer: '未发货的订单可以取消，在订单详情页点击"取消订单"按钮即可。已发货的订单需要等收到货后申请退货。', expanded: false },
  { id: 5, category: 'payment', question: '支持哪些支付方式？', answer: '目前支持微信支付和支付宝两种支付方式，后续会增加更多支付渠道。', expanded: false },
  { id: 6, category: 'payment', question: '支付失败怎么办？', answer: '请检查网络连接和支付账户余额，如果问题持续存在，请联系客服处理。', expanded: false },
  { id: 7, category: 'shipping', question: '配送需要多长时间？', answer: '一般情况下，订单会在1-3个工作日内发货，配送时间根据地区不同约2-7天。', expanded: false },
  { id: 8, category: 'shipping', question: '可以修改收货地址吗？', answer: '未发货的订单可以修改收货地址，请在订单详情页操作或联系客服修改。', expanded: false },
  { id: 9, category: 'return', question: '如何申请退货？', answer: '收到商品后7天内可申请退货，在订单详情页点击"申请退货"，填写退货原因后等待审核。', expanded: false },
  { id: 10, category: 'return', question: '退款多久到账？', answer: '退货审核通过后，退款会在3-7个工作日内原路返回到您的支付账户。', expanded: false }
])

const filteredFaqs = computed(() => {
  if (activeCategory.value === 'all') return faqs.value
  return faqs.value.filter(f => f.category === activeCategory.value)
})
</script>

<style scoped>
.help-page { min-height: 100vh; background: var(--white); position: relative; }
.help-page::before { content: ''; position: fixed; top: 5%; right: -10%; width: 600px; height: 600px; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }
.help-page::after { content: ''; position: fixed; bottom: 5%; left: -10%; width: 500px; height: 500px; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }
.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 8px; }
.page-header p { font-size: 15px; color: var(--text-muted); margin: 0; }
.help-layout { display: grid; grid-template-columns: 240px 1fr; gap: 32px; }
.sidebar-card { padding: 24px; position: sticky; top: 100px; }
.sidebar-card h3 { font-size: 16px; font-weight: 600; color: var(--text-title); margin: 0 0 20px; }
.category-list { list-style: none; margin: 0; padding: 0; }
.category-list li { padding: 14px 16px; font-size: 15px; color: var(--text-body); cursor: pointer; border-radius: var(--radius-md); transition: all 0.3s; margin-bottom: 4px; }
.category-list li:hover { background: rgba(90, 143, 212, 0.1); }
.category-list li.active { background: rgba(90, 143, 212, 0.2); color: var(--text-title); font-weight: 500; }
.faq-item { margin-bottom: 16px; overflow: hidden; cursor: pointer; }
.faq-question { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
.faq-question h4 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-title); }
.arrow { transition: transform 0.3s; color: var(--text-muted); }
.arrow.expanded { transform: rotate(180deg); }
.faq-answer { padding: 0 24px 20px; }
.faq-answer p { margin: 0; font-size: 15px; color: var(--text-body); line-height: 1.8; }
.slide-enter-active, .slide-leave-active { transition: all 0.3s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
@media (max-width: 768px) { .help-layout { grid-template-columns: 1fr; } .sidebar-card { position: static; } }
</style>
