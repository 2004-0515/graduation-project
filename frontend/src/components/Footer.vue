<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <!-- 关于我们 -->
        <div class="footer-section">
          <h3>关于我们</h3>
          <p>我们是一家专业的在线购物商城，致力于为客户提供优质的商品和服务。自成立以来，我们始终坚持以客户为中心，不断提升购物体验。</p>
          <div class="contact-info">
            <p><i class="el-icon-map-location"></i> 北京市朝阳区科技园区88号</p>
            <p><i class="el-icon-phone"></i> 400-888-8888</p>
            <p><i class="el-icon-message"></i> service@shoppingmall.com</p>
          </div>
        </div>
        
        <!-- 快速导航 -->
        <div class="footer-section">
          <h3>快速导航</h3>
          <ul>
            <li><a href="#" @click.prevent="$router.push('/')"><i class="el-icon-house"></i> 首页</a></li>
            <li><a href="#" @click.prevent="$router.push('/category/1')"><i class="el-icon-menu"></i> 商品分类</a></li>
            <li><a href="#" @click.prevent="$router.push('/hot-products')"><i class="el-icon-medal"></i> 热销商品</a></li>
            <li><a href="#" @click.prevent="$router.push('/promotions')"><i class="el-icon-ticket"></i> 促销活动</a></li>
            <li><a href="#" @click.prevent="$router.push('/cart')"><i class="el-icon-shopping-cart-full"></i> 购物车</a></li>
          </ul>
        </div>
        
        <!-- 客户服务 -->
        <div class="footer-section">
          <h3>客户服务</h3>
          <ul>
            <li><a href="#"><i class="el-icon-phone"></i> 联系我们</a></li>
            <li><a href="#"><i class="el-icon-goods"></i> 售后服务</a></li>
            <li><a href="#"><i class="el-icon-info"></i> 常见问题</a></li>
            <li><a href="#"><i class="el-icon-document"></i> 配送政策</a></li>
            <li><a href="#"><i class="el-icon-refresh"></i> 退换货政策</a></li>
          </ul>
        </div>
        
        <!-- 支付方式 -->
        <div class="footer-section">
          <h3>支付方式</h3>
          <div class="payment-methods">
            <div class="payment-item">
              <i class="el-icon-credit-card"></i>
              <span>微信支付</span>
            </div>
            <div class="payment-item">
              <i class="el-icon-credit-card"></i>
              <span>支付宝</span>
            </div>
            <div class="payment-item">
              <i class="el-icon-credit-card"></i>
              <span>银行卡支付</span>
            </div>
            <div class="payment-item">
              <i class="el-icon-credit-card"></i>
              <span>PayPal</span>
            </div>
          </div>
          
          <!-- 关注我们 -->
          <h3 style="margin-top: 20px;">关注我们</h3>
          <div class="social-icons">
            <a href="#" class="social-icon"><i class="el-icon-chat-line-round"></i></a>
            <a href="#" class="social-icon"><i class="el-icon-message"></i></a>
            <a href="#" class="social-icon"><i class="el-icon-phone"></i></a>
            <a href="#" class="social-icon"><i class="el-icon-video-camera"></i></a>
          </div>
        </div>
      </div>
      
      <!-- 版权信息 -->
      <div class="footer-bottom">
        <div class="footer-links">
          <a href="#">隐私政策</a>
          <a href="#">用户协议</a>
          <a href="#">网站地图</a>
        </div>
        <div class="copyright">
          <p>© 2025 购物商城. All rights reserved. 京ICP备12345678号</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 无需额外的脚本逻辑，使用Vue Router的$router实例进行导航
</script>

<style scoped>
/* 页脚基础样式 */
.footer {
  background-color: #333;
  color: #fff;
  padding: 40px 0;
  margin-top: 60px;
}

/* 容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页脚内容 */
.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 30px;
}

/* 页脚区块 */
.footer-section h3 {
  margin: 0 0 20px;
  font-size: 18px;
  color: #fff;
  position: relative;
  padding-bottom: 10px;
}

.footer-section h3::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 50px;
  height: 2px;
  background-color: #409eff;
}

/* 关于我们 */
.footer-section p {
  margin: 0 0 15px;
  color: #ccc;
  line-height: 1.6;
}

.contact-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.contact-info i {
  color: #409eff;
  font-size: 16px;
}

/* 链接列表 */
.footer-section ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-section li {
  margin-bottom: 12px;
}

.footer-section a {
  color: #ccc;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}

.footer-section a:hover {
  color: #409eff;
  transform: translateX(5px);
}

.footer-section i {
  font-size: 14px;
}

/* 支付方式 */
.payment-methods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.payment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.payment-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.payment-item i {
  font-size: 20px;
  color: #409eff;
}

/* 社交图标 */
.social-icons {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.social-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #ccc;
  font-size: 18px;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background-color: #409eff;
  color: #fff;
  transform: translateY(-3px);
}

/* 页脚底部 */
.footer-bottom {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

/* 页脚链接 */
.footer-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-links a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.3s ease;
  font-size: 14px;
}

.footer-links a:hover {
  color: #409eff;
}

/* 版权信息 */
.copyright {
  font-size: 14px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .footer-links {
    gap: 15px;
  }
  
  .payment-methods {
    grid-template-columns: 1fr;
  }
}
</style>