<template>
  <div class="terms-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>服务条款</h1>
          <p>最后更新：2025年1月1日</p>
        </div>

        <div class="terms-card glass-card">
          <section class="terms-section">
            <h2>1. 服务协议的确认</h2>
            <p>欢迎使用雅集商城。在使用本平台服务之前，请您仔细阅读本服务条款。当您注册成为本平台用户或使用本平台服务时，即表示您已阅读、理解并同意接受本服务条款的全部内容。</p>
          </section>

          <section class="terms-section">
            <h2>2. 用户注册</h2>
            <p>2.1 用户在注册时应提供真实、准确、完整的个人信息，并在信息发生变化时及时更新。</p>
            <p>2.2 用户应妥善保管账号和密码，因用户原因导致的账号安全问题由用户自行承担。</p>
            <p>2.3 用户不得将账号转让、出借给他人使用。</p>
          </section>

          <section class="terms-section">
            <h2>3. 商品与服务</h2>
            <p>3.1 本平台展示的商品信息仅供参考，实际商品以收到的实物为准。</p>
            <p>3.2 商品价格可能会根据市场情况进行调整，以下单时的价格为准。</p>
            <p>3.3 本平台有权对商品的库存、价格、促销活动等进行调整。</p>
          </section>

          <section class="terms-section">
            <h2>4. 订单与支付</h2>
            <p>4.1 用户下单后应及时完成支付，超时未支付的订单将自动取消。</p>
            <p>4.2 支付成功后，订单状态将更新为待发货。</p>
            <p>4.3 如因不可抗力或其他原因导致无法发货，本平台将及时通知用户并办理退款。</p>
          </section>

          <section class="terms-section">
            <h2>5. 配送服务</h2>
            <p>5.1 本平台将在订单支付成功后尽快安排发货。</p>
            <p>5.2 配送时间受物流公司、天气、节假日等因素影响，仅供参考。</p>
            <p>5.3 用户应确保收货地址准确，因地址错误导致的配送问题由用户承担。</p>
          </section>

          <section class="terms-section">
            <h2>6. 退换货政策</h2>
            <p>6.1 用户收到商品后7天内可申请无理由退货（特殊商品除外）。</p>
            <p>6.2 退货商品应保持原包装完好，不影响二次销售。</p>
            <p>6.3 退款将在审核通过后3-7个工作日内原路返回。</p>
          </section>

          <section class="terms-section">
            <h2>7. 用户行为规范</h2>
            <p>7.1 用户不得利用本平台从事违法违规活动。</p>
            <p>7.2 用户不得发布虚假信息、恶意评价或侵犯他人权益的内容。</p>
            <p>7.3 违反规定的用户，本平台有权采取警告、限制功能、封禁账号等措施。</p>
          </section>

          <section class="terms-section">
            <h2>8. 隐私保护</h2>
            <p>8.1 本平台重视用户隐私保护，将按照隐私政策收集、使用和保护用户信息。</p>
            <p>8.2 未经用户同意，本平台不会向第三方披露用户个人信息。</p>
          </section>

          <section class="terms-section">
            <h2>9. 免责声明</h2>
            <p>9.1 因不可抗力导致的服务中断或损失，本平台不承担责任。</p>
            <p>9.2 用户因自身原因造成的损失，本平台不承担责任。</p>
          </section>

          <section class="terms-section">
            <h2>10. 条款修改</h2>
            <p>本平台有权根据需要修改本服务条款，修改后的条款将在平台公布。继续使用本平台服务即表示接受修改后的条款。</p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
</script>

<style scoped>
.terms-page { min-height: 100vh; background: var(--white); position: relative; }
.terms-page::before { content: ''; position: fixed; top: 5%; right: -10%; width: 600px; height: 600px; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }
.terms-page::after { content: ''; position: fixed; bottom: 5%; left: -10%; width: 500px; height: 500px; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; }
.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 8px; }
.page-header p { font-size: 15px; color: var(--text-muted); margin: 0; }
.terms-card { padding: 48px; max-width: 900px; }
.terms-section { margin-bottom: 36px; }
.terms-section:last-child { margin-bottom: 0; }
.terms-section h2 { font-size: 18px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.terms-section p { font-size: 15px; color: var(--text-body); line-height: 1.8; margin: 0 0 12px; }
.terms-section p:last-child { margin-bottom: 0; }
</style>
