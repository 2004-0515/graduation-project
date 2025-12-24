<template>
  <div class="promotions-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 促销活动内容 -->
    <main class="promotions-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>促销活动</h2>
          <p>最新促销活动，限时特惠</p>
        </div>

        <!-- 活动分类标签 -->
        <div class="promotion-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange" type="card">
            <el-tab-pane label="全部活动" name="all">
              <!-- 全部活动内容 -->
            </el-tab-pane>
            <el-tab-pane label="限时特惠" name="flash-sale">
              <!-- 限时特惠内容 -->
            </el-tab-pane>
            <el-tab-pane label="满减活动" name="discount">
              <!-- 满减活动内容 -->
            </el-tab-pane>
            <el-tab-pane label="新品上市" name="new-arrival">
              <!-- 新品上市内容 -->
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 促销活动列表 -->
        <div class="promotions-list">
          <div class="promotion-card" v-for="promotion in paginatedPromotions" :key="promotion.id">
            <el-card shadow="hover" class="promotion-item">
              <div class="promotion-content">
                <div class="promotion-banner">
                  <el-image 
                    :src="promotion.bannerImage" 
                    fit="cover" 
                    class="promotion-image"
                  ></el-image>
                </div>
                <div class="promotion-info">
                  <div class="promotion-header">
                    <h3>{{ promotion.title }}</h3>
                    <el-tag :type="promotion.tagType" size="large">{{ promotion.tag }}</el-tag>
                  </div>
                  <p class="promotion-description">{{ promotion.description }}</p>
                  <div class="promotion-details">
                    <div class="promotion-time">
                      <el-icon class="time-icon"><Timer /></el-icon>
                      <span>{{ promotion.startTime }} - {{ promotion.endTime }}</span>
                    </div>
                    <div class="promotion-status">
                      <el-badge :value="promotion.status" :type="promotion.status === '进行中' ? 'success' : 'warning'">
                        {{ promotion.status }}
                      </el-badge>
                    </div>
                  </div>
                  <div class="promotion-actions">
                    <el-button type="primary" size="large" @click="viewPromotionDetails(promotion)">查看详情</el-button>
                  </div>
                </div>
              </div>
              
              <!-- 关联商品 -->
              <div class="related-products">
                <h4>关联商品</h4>
                <div class="product-list">
                  <div class="related-product" v-for="product in promotion.relatedProducts" :key="product.id">
                    <el-image 
                      :src="product.mainImage" 
                      fit="cover" 
                      @click="$router.push(`/product/${product.id}`)" 
                      preview-teleported
                      class="related-product-image"
                    ></el-image>
                    <p class="related-product-name">{{ product.name }}</p>
                    <div class="related-product-price">
                      <span class="price">{{ product.price }}</span>
                      <span class="original-price" v-if="product.originalPrice">{{ product.originalPrice }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            v-model:current-page="currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            total-text="共 {total} 个活动"
          ></el-pagination>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell, Timer } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()

// 活动分类标签
const activeTab = ref('all')

// 分页信息
const currentPage = ref(1)
const pageSize = ref(10)

// 促销活动列表
const promotions = reactive([
  // 模拟数据
  {
    id: 1,
    title: '双11全球狂欢节',
    description: '全场商品低至5折，满1000减200，上不封顶',
    tag: '双11',
    tagType: 'danger',
    startTime: '2025-11-01',
    endTime: '2025-11-11',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=31',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  {
    id: 2,
    title: '618年中盛典',
    description: '年中大促，全场商品8折起，满300减50',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-06-01',
    endTime: '2025-06-18',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=32',
    relatedProducts: [
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' }
    ]
  },
  {
    id: 3,
    title: '新年特惠',
    description: '新年新气象，全场商品满500减100，满1000减250',
    tag: '新年',
    tagType: 'success',
    startTime: '2025-01-01',
    endTime: '2025-01-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=33',
    relatedProducts: [
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' }
    ]
  },
  {
    id: 4,
    title: '春季新品上市',
    description: '春季新品首发，全场新品8.5折，限时一周',
    tag: '新品',
    tagType: 'warning',
    startTime: '2025-03-01',
    endTime: '2025-03-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=34',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 5,
    title: '夏日清凉特卖',
    description: '夏日清凉商品大促销，家电类商品满2000减300',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-07-01',
    endTime: '2025-07-31',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=35',
    relatedProducts: [
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 6,
    title: '会员专享日',
    description: '会员专享8折优惠，新用户注册即送100元优惠券',
    tag: '会员',
    tagType: 'success',
    startTime: '2025-05-15',
    endTime: '2025-05-16',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=36',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  // 新增20条促销活动
  {
    id: 7,
    title: '黑色星期五',
    description: '黑色星期五全场商品低至4折，限时抢购',
    tag: '黑五',
    tagType: 'danger',
    startTime: '2025-11-28',
    endTime: '2025-11-30',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=37',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 8,
    title: '双12年终盛典',
    description: '年终大促，全场商品满500减150，满1000减350',
    tag: '双12',
    tagType: 'primary',
    startTime: '2025-12-01',
    endTime: '2025-12-12',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=38',
    relatedProducts: [
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 9,
    title: '圣诞特惠',
    description: '圣诞快乐，全场商品满300减100，满600减250',
    tag: '圣诞',
    tagType: 'success',
    startTime: '2025-12-20',
    endTime: '2025-12-26',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=39',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 10,
    title: '元旦迎新活动',
    description: '迎接新年，全场商品8折起，新用户注册送200元优惠券',
    tag: '元旦',
    tagType: 'warning',
    startTime: '2025-12-30',
    endTime: '2026-01-03',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=40',
    relatedProducts: [
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 11,
    title: '春季焕新季',
    description: '春季焕新，服饰类商品满200减80，满400减180',
    tag: '春季',
    tagType: 'success',
    startTime: '2025-03-15',
    endTime: '2025-03-31',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=41',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 12,
    title: '家电节',
    description: '家电节全场家电满3000减500，满5000减1000',
    tag: '家电节',
    tagType: 'info',
    startTime: '2025-04-01',
    endTime: '2025-04-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=42',
    relatedProducts: [
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' }
    ]
  },
  {
    id: 13,
    title: '五一劳动节',
    description: '五一劳动节全场商品满600减200，满1200减500',
    tag: '五一',
    tagType: 'primary',
    startTime: '2025-04-28',
    endTime: '2025-05-05',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=43',
    relatedProducts: [
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 14,
    title: '母亲节特惠',
    description: '母亲节感恩回馈，全场美妆商品满300减120',
    tag: '母亲节',
    tagType: 'success',
    startTime: '2025-05-08',
    endTime: '2025-05-14',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=44',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' }
    ]
  },
  {
    id: 15,
    title: '618预售',
    description: '618预售开启，预付定金立减50-500元',
    tag: '预售',
    tagType: 'primary',
    startTime: '2025-05-25',
    endTime: '2025-05-31',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=45',
    relatedProducts: [
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' }
    ]
  },
  {
    id: 16,
    title: '父亲节特惠',
    description: '父亲节感恩季，男装、数码产品满500减150',
    tag: '父亲节',
    tagType: 'info',
    startTime: '2025-06-10',
    endTime: '2025-06-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=46',
    relatedProducts: [
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' }
    ]
  },
  {
    id: 17,
    title: '暑假狂欢',
    description: '暑假来了，学生专享7折优惠，凭学生证购买',
    tag: '暑假',
    tagType: 'warning',
    startTime: '2025-07-01',
    endTime: '2025-08-31',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=47',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 18,
    title: '开学季',
    description: '开学季数码产品满3000减500，满5000减1000',
    tag: '开学季',
    tagType: 'primary',
    startTime: '2025-08-15',
    endTime: '2025-09-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=48',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 19,
    title: '中秋团圆节',
    description: '中秋团圆节，全场商品满800减280，满1500减600',
    tag: '中秋',
    tagType: 'success',
    startTime: '2025-09-15',
    endTime: '2025-09-22',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=49',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' }
    ]
  },
  {
    id: 20,
    title: '国庆黄金周',
    description: '国庆黄金周全场商品满1000减300，满2000减700',
    tag: '国庆',
    tagType: 'primary',
    startTime: '2025-09-28',
    endTime: '2025-10-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=50',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 21,
    title: '万圣节狂欢',
    description: '万圣节狂欢夜，全场商品满300减100，满600减250',
    tag: '万圣节',
    tagType: 'warning',
    startTime: '2025-10-28',
    endTime: '2025-11-01',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=51',
    relatedProducts: [
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 22,
    title: '双十一预售',
    description: '双十一预售开启，预付定金翻倍抵扣',
    tag: '预售',
    tagType: 'danger',
    startTime: '2025-10-20',
    endTime: '2025-10-31',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=52',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 23,
    title: '感恩节特惠',
    description: '感恩节全场商品8.5折，满1000减200',
    tag: '感恩',
    tagType: 'success',
    startTime: '2025-11-20',
    endTime: '2025-11-26',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=53',
    relatedProducts: [
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 24,
    title: '冬季保暖节',
    description: '冬季保暖节，保暖用品满300减120，满600减300',
    tag: '冬季',
    tagType: 'info',
    startTime: '2025-12-01',
    endTime: '2025-12-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=54',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 25,
    title: '年终清仓',
    description: '年终清仓大甩卖，全场商品低至3折，清完即止',
    tag: '清仓',
    tagType: 'warning',
    startTime: '2025-12-20',
    endTime: '2025-12-31',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=55',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' }
    ]
  },
  {
    id: 26,
    title: '新年焕新',
    description: '新年焕新季，全场商品满500减150，满1000减350',
    tag: '新年',
    tagType: 'success',
    startTime: '2026-01-01',
    endTime: '2026-01-10',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=56',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' }
    ]
  }
])

// 计算总活动数
const total = computed(() => {
  return promotions.length
})

// 分页数据 - 根据当前页码和每页条数计算
const paginatedPromotions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return promotions.slice(startIndex, endIndex)
})

// 监听分页状态变化，滚动到顶部
watch([currentPage, pageSize], () => {
  nextTick(() => {
    // 兼容各种浏览器的滚动到顶部方法
    if (window.scrollTo) {
      // 现代浏览器支持的平滑滚动
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // 兼容旧版浏览器
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  })
})

// 标签页切换
const handleTabChange = (tab) => {
  currentPage.value = 1
  // 实际项目中这里应该根据标签页类型重新调用API获取数据
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  // 实际项目中这里应该重新调用API获取数据
}

// 当前页码变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  // 实际项目中这里应该重新调用API获取数据
}

// 查看活动详情
const viewPromotionDetails = (promotion) => {
  ElMessage.info(`查看活动详情: ${promotion.title}`)
  // 实际项目中这里应该跳转到活动详情页
}
</script>

<style scoped>
/* 全局样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 导航栏 */
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #409eff;
}

.nav-menu ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu li {
  margin: 0 15px;
}

.nav-menu a {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.3s;
  cursor: pointer;
}

.nav-menu a:hover, .nav-menu a.active {
  color: #409eff;
  font-weight: bold;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.nav-actions .el-button {
  margin: 0 10px;
}

.icon-nav {
  font-size: 20px;
  margin-left: 20px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.icon-nav:hover {
  color: #409eff;
}

.nav-badge {
  cursor: pointer;
}

/* 促销活动内容 */
.promotions-content {
  margin: 40px 0;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h2 {
  margin: 0 0 10px;
  font-size: 32px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

/* 活动分类标签 */
.promotion-tabs {
  margin-bottom: 30px;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 促销活动列表 */
.promotions-list {
  margin-bottom: 30px;
}

.promotion-card {
  margin-bottom: 20px;
}

.promotion-item {
  transition: transform 0.3s;
}

.promotion-item:hover {
  transform: translateY(-5px);
}

.promotion-content {
  display: flex;
  flex-direction: column;
}

.promotion-banner {
  margin-bottom: 20px;
}

.promotion-image {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  transition: transform 0.3s;
}

.promotion-image:hover {
  transform: scale(1.01);
}

.promotion-info {
  padding: 0 10px;
}

.promotion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.promotion-header h3 {
  margin: 0;
  font-size: 24px;
  color: #333;
  flex: 1;
}

.promotion-description {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.promotion-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.promotion-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.time-icon {
  color: #409eff;
}

.promotion-status {
  display: flex;
  align-items: center;
}

.promotion-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

/* 关联商品 */
.related-products {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.related-products h4 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #333;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.related-product {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.related-product:hover {
  transform: translateY(-3px);
}

.related-product-image {
  width: 100%;
  height: 150px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.related-product-name {
  margin: 0 0 8px;
  font-size: 14px;
  color: #333;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.related-product-price {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.related-product-price .price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.related-product-price .original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

/* 分页 */
.pagination {
  text-align: center;
  margin-top: 30px;
}

/* 页脚 */
.footer {
  background-color: #333;
  color: #fff;
  padding: 40px 0;
  margin-top: 60px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 30px;
}

.footer-section h3 {
  margin: 0 0 20px;
  font-size: 18px;
}

.footer-section p {
  margin: 0 0 15px;
  color: #ccc;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-section li {
  margin-bottom: 10px;
}

.footer-section a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: #409eff;
}

.social-icons {
  display: flex;
  gap: 20px;
}

.icon-social {
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.icon-social:hover {
  color: #409eff;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #444;
  color: #999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-actions {
    justify-content: flex-end;
  }
  
  .promotion-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .promotion-details {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-list {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .related-product-image {
    height: 120px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>