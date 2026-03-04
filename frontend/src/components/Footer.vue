<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="brand-text">紫苑风鸢</span>
        <p class="brand-slogan">让心愿随风而起，理性消费每一刻</p>
      </div>
      
      <div class="footer-links">
        <div class="link-col">
          <h4>购物指南</h4>
          <div class="link-list">
            <router-link to="/category">全部商品</router-link>
            <router-link to="/hot">热销排行</router-link>
            <router-link to="/promotions">促销活动</router-link>
          </div>
        </div>
        <div class="link-col">
          <h4>我的账户</h4>
          <div class="link-list">
            <router-link to="/profile">个人中心</router-link>
            <router-link to="/orders">我的订单</router-link>
            <router-link to="/cart">购物车</router-link>
          </div>
        </div>
        <div class="link-col">
          <h4>客户服务</h4>
          <div class="link-list">
            <router-link to="/help">帮助中心</router-link>
            <router-link to="/contact">联系客服</router-link>
            <router-link to="/terms">服务条款</router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>© 2025 紫苑风鸢 · 用心服务每一位顾客</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 80px;
  background: var(--white);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--gray-200);
  box-shadow: 0 -4px 30px rgba(155, 135, 245, 0.08);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 40px 36px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.footer-brand {
  flex-shrink: 0;
}

.brand-text {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 3px;
}

.brand-slogan {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--text-tertiary);
}

.footer-links {
  display: flex;
  gap: 64px;
}

.link-col {
  min-width: 100px;
}

.link-col h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary);
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-list a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.link-list a:hover {
  color: var(--primary);
}

.footer-bottom {
  border-top: 1px solid var(--gray-200);
  padding: 20px 32px;
  text-align: center;
  background: var(--gray-50);
}

.footer-bottom p {
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .footer-inner {
    flex-direction: column;
    gap: 32px;
    padding: 36px 24px 28px;
    align-items: center;
    text-align: center;
  }
  .footer-links {
    flex-wrap: wrap;
    gap: 40px;
    justify-content: center;
  }
  .link-col h4 {
    border-bottom: none;
    padding-bottom: 0;
  }
}
</style>
