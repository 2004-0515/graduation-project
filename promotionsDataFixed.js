// 促销活动列表
const promotions = reactive([
  // 模拟数据
  {
    id: 1,
    title: '618清凉特卖',
    description: '618新品首发，全场新品8.0折，限时一周',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-02-01',
    endTime: '2024-05-29',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=31',
    relatedProducts: [
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' }
    ]
  },
  {
    id: 2,
    title: '满减超值购',
    description: '满减满减活动，满1000减100，满2000减200，满3000减300',
    tag: '满减',
    tagType: 'primary',
    startTime: '2025-01-29',
    endTime: '2025-09-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=32',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 3,
    title: '特惠全球狂欢节',
    description: '特惠周年庆，全场商品5.0折，购物满2000送精美礼品',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-04-19',
    endTime: '2025-05-19',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=33',
    relatedProducts: [
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 4,
    title: '特惠清凉特卖',
    description: '特惠满减活动，满2000减200，满4000减400，满6000减600',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-05-21',
    endTime: '2025-04-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=34',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' }
    ]
  },
  {
    id: 5,
    title: '618新品上市',
    description: '618满减活动，满3000减300，满6000减600，满9000减900',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-03-16',
    endTime: '2025-06-12',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=35',
    relatedProducts: [
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' }
    ]
  },
  {
    id: 6,
    title: '新年特惠',
    description: '新年限时特惠，爆款商品9.0折，数量有限，先到先得',
    tag: '新年',
    tagType: 'success',
    startTime: '2024-03-23',
    endTime: '2025-02-25',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=36',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 7,
    title: '新品新品上市',
    description: '新品超值购，精选商品低至9.0折，限时抢购',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-09-21',
    endTime: '2025-03-12',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=37',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 8,
    title: '双11周年庆',
    description: '双11新品首发，全场新品8.0折，限时一周',
    tag: '双11',
    tagType: 'danger',
    startTime: '2025-05-27',
    endTime: '2025-10-13',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=38',
    relatedProducts: [
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' }
    ]
  },
  {
    id: 9,
    title: '夏日全球狂欢节',
    description: '夏日专享8.0折优惠，新用户注册即送129元优惠券',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-02-12',
    endTime: '2024-10-11',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=39',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 10,
    title: '新品年中盛典',
    description: '新品新品首发，全场新品9.0折，限时一周',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-07-17',
    endTime: '2025-10-25',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=40',
    relatedProducts: [
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' }
    ]
  },
  {
    id: 11,
    title: '双11全球狂欢节',
    description: '双11清凉商品大促销，家电类商品满1000减100',
    tag: '双11',
    tagType: 'danger',
    startTime: '2025-04-24',
    endTime: '2025-06-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=41',
    relatedProducts: [
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' }
    ]
  },
  {
    id: 12,
    title: '会员周年庆',
    description: '会员限时特惠，爆款商品7.0折，数量有限，先到先得',
    tag: '会员',
    tagType: 'success',
    startTime: '2024-11-28',
    endTime: '2025-11-30',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=42',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' }
    ]
  },
  {
    id: 13,
    title: '会员年中盛典',
    description: '会员满减活动，满2000减200，满4000减400，满6000减600',
    tag: '会员',
    tagType: 'success',
    startTime: '2024-08-09',
    endTime: '2024-10-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=43',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 14,
    title: '限时特惠',
    description: '限时新气象，全场商品满2000减200，满4000减400',
    tag: '限时',
    tagType: 'danger',
    startTime: '2024-02-03',
    endTime: '2024-07-06',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=44',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 15,
    title: '618限时特惠',
    description: '618满减活动，满2000减200，满4000减400，满6000减600',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-05-26',
    endTime: '2025-09-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=45',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 16,
    title: '特惠超值购',
    description: '特惠新气象，全场商品满500减50，满1000减100',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-02-10',
    endTime: '2024-09-12',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=46',
    relatedProducts: [
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 17,
    title: '新品周年庆',
    description: '新品满减活动，满500减50，满1000减100，满1500减150',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-03-22',
    endTime: '2025-09-08',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=47',
    relatedProducts: [
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' }
    ]
  },
  {
    id: 18,
    title: '特惠满减活动',
    description: '全场商品低至8.0折，满2000减200，上不封顶',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-06-12',
    endTime: '2025-08-26',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=48',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 19,
    title: '限时新品上市',
    description: '限时专享6.0折优惠，新用户注册即送212元优惠券',
    tag: '限时',
    tagType: 'danger',
    startTime: '2024-11-19',
    endTime: '2025-03-25',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=49',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 20,
    title: '满减限时特惠',
    description: '满减专享8.0折优惠，新用户注册即送50元优惠券',
    tag: '满减',
    tagType: 'primary',
    startTime: '2024-01-23',
    endTime: '2024-09-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=50',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' }
    ]
  },
  {
    id: 21,
    title: '618专享日',
    description: '618清凉商品大促销，家电类商品满300减30',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-05-20',
    endTime: '2025-08-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=51',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' }
    ]
  },
  {
    id: 22,
    title: '夏日专享日',
    description: '夏日周年庆，全场商品7.0折，购物满2000送精美礼品',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-07-12',
    endTime: '2025-12-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=52',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' }
    ]
  },
  {
    id: 23,
    title: '夏日年中盛典',
    description: '夏日超值购，精选商品低至9.0折，限时抢购',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-02-08',
    endTime: '2025-10-27',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=53',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 24,
    title: '夏日全球狂欢节',
    description: '全场商品低至9.0折，满2000减200，上不封顶',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-06-24',
    endTime: '2025-11-08',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=54',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 25,
    title: '周年庆特惠',
    description: '全场商品低至9.0折，满1000减100，上不封顶',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2025-02-04',
    endTime: '2025-08-21',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=55',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' }
    ]
  },
  {
    id: 26,
    title: '夏日专享日',
    description: '夏日满减活动，满2000减200，满4000减400，满6000减600',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-03-23',
    endTime: '2024-08-10',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=56',
    relatedProducts: [
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 27,
    title: '双11超值购',
    description: '双11专享9.0折优惠，新用户注册即送200元优惠券',
    tag: '双11',
    tagType: 'danger',
    startTime: '2024-12-21',
    endTime: '2025-06-01',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=57',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 28,
    title: '新品全球狂欢节',
    description: '新品新气象，全场商品满1000减100，满2000减200',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-09-05',
    endTime: '2025-10-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=58',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 29,
    title: '会员全球狂欢节',
    description: '会员专享6.0折优惠，新用户注册即送52元优惠券',
    tag: '会员',
    tagType: 'success',
    startTime: '2024-09-06',
    endTime: '2025-10-11',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=59',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' }
    ]
  },
  {
    id: 30,
    title: '新品年中盛典',
    description: '新品清凉商品大促销，家电类商品满3000减300',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-05-19',
    endTime: '2025-08-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=60',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 31,
    title: '新年超值购',
    description: '新年超值购，精选商品低至5.0折，限时抢购',
    tag: '新年',
    tagType: 'success',
    startTime: '2024-06-27',
    endTime: '2025-01-14',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=61',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' }
    ]
  },
  {
    id: 32,
    title: '限时清凉特卖',
    description: '全场商品低至8.0折，满3000减300，上不封顶',
    tag: '限时',
    tagType: 'danger',
    startTime: '2024-11-22',
    endTime: '2025-08-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=62',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' }
    ]
  },
  {
    id: 33,
    title: '限时专享日',
    description: '限时限时特惠，爆款商品6.0折，数量有限，先到先得',
    tag: '限时',
    tagType: 'danger',
    startTime: '2025-05-21',
    endTime: '2025-11-12',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=63',
    relatedProducts: [
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' }
    ]
  },
  {
    id: 34,
    title: '夏日限时特惠',
    description: '夏日周年庆，全场商品9.0折，购物满2000送精美礼品',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-01-19',
    endTime: '2025-12-13',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=64',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' }
    ]
  },
  {
    id: 35,
    title: '限时专享日',
    description: '限时周年庆，全场商品6.0折，购物满2000送精美礼品',
    tag: '限时',
    tagType: 'danger',
    startTime: '2024-12-09',
    endTime: '2025-01-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=65',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 36,
    title: '新年全球狂欢节',
    description: '新年专享6.0折优惠，新用户注册即送60元优惠券',
    tag: '新年',
    tagType: 'success',
    startTime: '2024-12-26',
    endTime: '2025-05-09',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=66',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 37,
    title: '会员超值购',
    description: '会员满减活动，满500减50，满1000减100，满1500减150',
    tag: '会员',
    tagType: 'success',
    startTime: '2024-12-28',
    endTime: '2025-05-29',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=67',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 38,
    title: '特惠年中盛典',
    description: '特惠专享8.0折优惠，新用户注册即送96元优惠券',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-11-15',
    endTime: '2025-03-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=68',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' }
    ]
  },
  {
    id: 39,
    title: '特惠年中盛典',
    description: '特惠清凉商品大促销，家电类商品满3000减300',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2025-08-14',
    endTime: '2025-09-09',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=69',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 40,
    title: '满减新品上市',
    description: '满减清凉商品大促销，家电类商品满2000减200',
    tag: '满减',
    tagType: 'primary',
    startTime: '2024-04-10',
    endTime: '2025-05-16',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=70',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  {
    id: 41,
    title: '618周年庆',
    description: '618清凉商品大促销，家电类商品满2000减200',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-09-05',
    endTime: '2025-10-13',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=71',
    relatedProducts: [
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 42,
    title: '限时专享日',
    description: '限时超值购，精选商品低至8.0折，限时抢购',
    tag: '限时',
    tagType: 'danger',
    startTime: '2025-03-24',
    endTime: '2025-09-30',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=72',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 43,
    title: '夏日专享日',
    description: '夏日满减活动，满2000减200，满4000减400，满6000减600',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-04-30',
    endTime: '2025-05-22',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=73',
    relatedProducts: [
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 44,
    title: '限时清凉特卖',
    description: '限时周年庆，全场商品9.0折，购物满2000送精美礼品',
    tag: '限时',
    tagType: 'danger',
    startTime: '2025-06-17',
    endTime: '2025-12-28',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=74',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 45,
    title: '周年庆新品上市',
    description: '周年庆满减活动，满1000减100，满2000减200，满3000减300',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2024-02-23',
    endTime: '2024-03-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=75',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' }
    ]
  },
  {
    id: 46,
    title: '新年特惠',
    description: '新年专享5.0折优惠，新用户注册即送92元优惠券',
    tag: '新年',
    tagType: 'success',
    startTime: '2025-07-13',
    endTime: '2025-11-01',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=76',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 47,
    title: '新品满减活动',
    description: '新品新品首发，全场新品7.0折，限时一周',
    tag: '新品',
    tagType: 'warning',
    startTime: '2025-07-17',
    endTime: '2025-11-10',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=77',
    relatedProducts: [
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 48,
    title: '周年庆限时特惠',
    description: '周年庆满减活动，满2000减200，满4000减400，满6000减600',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2024-06-15',
    endTime: '2025-03-21',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=78',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' }
    ]
  },
  {
    id: 49,
    title: '周年庆周年庆',
    description: '周年庆周年庆，全场商品7.0折，购物满500送精美礼品',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2024-03-19',
    endTime: '2024-06-10',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=79',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' }
    ]
  },
  {
    id: 50,
    title: '双11周年庆',
    description: '双11大促，全场商品6.0折起，满300减30',
    tag: '双11',
    tagType: 'danger',
    startTime: '2024-03-13',
    endTime: '2024-06-19',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=80',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' }
    ]
  },
  {
    id: 51,
    title: '夏日满减活动',
    description: '夏日周年庆，全场商品8.0折，购物满1000送精美礼品',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-09-13',
    endTime: '2024-12-10',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=81',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  {
    id: 52,
    title: '618超值购',
    description: '618清凉商品大促销，家电类商品满3000减300',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-11-22',
    endTime: '2025-08-14',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=82',
    relatedProducts: [
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 53,
    title: '新品专享日',
    description: '全场商品低至9.0折，满1000减100，上不封顶',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-03-12',
    endTime: '2024-10-08',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=83',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 54,
    title: '满减周年庆',
    description: '满减专享7.0折优惠，新用户注册即送200元优惠券',
    tag: '满减',
    tagType: 'primary',
    startTime: '2024-02-28',
    endTime: '2025-01-24',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=84',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 55,
    title: '双11清凉特卖',
    description: '双11超值购，精选商品低至5.0折，限时抢购',
    tag: '双11',
    tagType: 'danger',
    startTime: '2025-05-12',
    endTime: '2025-12-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=85',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' }
    ]
  },
  {
    id: 56,
    title: '618超值购',
    description: '618清凉商品大促销，家电类商品满300减30',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-07-25',
    endTime: '2024-12-16',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=86',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' }
    ]
  },
  {
    id: 57,
    title: '新年超值购',
    description: '新年清凉商品大促销，家电类商品满2000减200',
    tag: '新年',
    tagType: 'success',
    startTime: '2024-05-13',
    endTime: '2024-07-09',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=87',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' }
    ]
  },
  {
    id: 58,
    title: '夏日满减活动',
    description: '夏日周年庆，全场商品8.0折，购物满1000送精美礼品',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-07-26',
    endTime: '2025-01-12',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=88',
    relatedProducts: [
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' }
    ]
  },
  {
    id: 59,
    title: '特惠年中盛典',
    description: '特惠周年庆，全场商品5.0折，购物满2000送精美礼品',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-05-30',
    endTime: '2025-07-18',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=89',
    relatedProducts: [
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  {
    id: 60,
    title: '新年周年庆',
    description: '新年限时特惠，爆款商品9.0折，数量有限，先到先得',
    tag: '新年',
    tagType: 'success',
    startTime: '2024-09-19',
    endTime: '2024-10-25',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=90',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' }
    ]
  },
  {
    id: 61,
    title: '周年庆全球狂欢节',
    description: '周年庆新气象，全场商品满2000减200，满4000减400',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2024-10-17',
    endTime: '2025-10-16',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=91',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' }
    ]
  },
  {
    id: 62,
    title: '会员超值购',
    description: '会员周年庆，全场商品8.0折，购物满500送精美礼品',
    tag: '会员',
    tagType: 'success',
    startTime: '2024-09-11',
    endTime: '2025-12-30',
    status: '进行中',
    bannerImage: 'https://picsum.photos/800/300?random=92',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' }
    ]
  },
  {
    id: 63,
    title: '满减年中盛典',
    description: '满减超值购，精选商品低至5.0折，限时抢购',
    tag: '满减',
    tagType: 'primary',
    startTime: '2024-01-24',
    endTime: '2024-03-23',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=93',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 64,
    title: '新品超值购',
    description: '新品超值购，精选商品低至5.0折，限时抢购',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-02-04',
    endTime: '2025-07-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=94',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 65,
    title: '新年特惠',
    description: '新年大促，全场商品8.0折起，满2000减200',
    tag: '新年',
    tagType: 'success',
    startTime: '2025-06-18',
    endTime: '2025-10-10',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=95',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 66,
    title: '新品年中盛典',
    description: '新品周年庆，全场商品7.0折，购物满3000送精美礼品',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-02-25',
    endTime: '2025-08-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=96',
    relatedProducts: [
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 67,
    title: '夏日全球狂欢节',
    description: '全场商品低至9.0折，满500减50，上不封顶',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-02-28',
    endTime: '2025-04-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=97',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 68,
    title: '特惠周年庆',
    description: '特惠超值购，精选商品低至7.0折，限时抢购',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-01-10',
    endTime: '2025-06-05',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=98',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 69,
    title: '特惠满减活动',
    description: '特惠清凉商品大促销，家电类商品满3000减300',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-05-26',
    endTime: '2024-12-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=99',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 70,
    title: '特惠清凉特卖',
    description: '特惠专享7.0折优惠，新用户注册即送211元优惠券',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-06-01',
    endTime: '2025-08-29',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=100',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' }
    ]
  },
  {
    id: 71,
    title: '会员特惠',
    description: '会员大促，全场商品6.0折起，满3000减300',
    tag: '会员',
    tagType: 'success',
    startTime: '2025-06-26',
    endTime: '2025-08-13',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=101',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' }
    ]
  },
  {
    id: 72,
    title: '新品满减活动',
    description: '新品清凉商品大促销，家电类商品满3000减300',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-02-29',
    endTime: '2024-08-01',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=102',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 73,
    title: '满减周年庆',
    description: '满减新品首发，全场新品5.0折，限时一周',
    tag: '满减',
    tagType: 'primary',
    startTime: '2025-02-28',
    endTime: '2025-03-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=103',
    relatedProducts: [
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' }
    ]
  },
  {
    id: 74,
    title: '夏日满减活动',
    description: '夏日周年庆，全场商品7.0折，购物满3000送精美礼品',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-05-22',
    endTime: '2025-08-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=104',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' }
    ]
  },
  {
    id: 75,
    title: '限时限时特惠',
    description: '限时满减活动，满1000减100，满2000减200，满3000减300',
    tag: '限时',
    tagType: 'danger',
    startTime: '2024-11-15',
    endTime: '2025-11-13',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=105',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' }
    ]
  },
  {
    id: 76,
    title: '618特惠',
    description: '618满减活动，满500减50，满1000减100，满1500减150',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-08-23',
    endTime: '2025-03-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=106',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' }
    ]
  },
  {
    id: 77,
    title: '夏日超值购',
    description: '夏日满减活动，满500减50，满1000减100，满1500减150',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-07-24',
    endTime: '2024-08-18',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=107',
    relatedProducts: [
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 78,
    title: '满减年中盛典',
    description: '满减满减活动，满3000减300，满6000减600，满9000减900',
    tag: '满减',
    tagType: 'primary',
    startTime: '2024-09-21',
    endTime: '2025-01-05',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=108',
    relatedProducts: [
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' }
    ]
  },
  {
    id: 79,
    title: '新年特惠',
    description: '新年周年庆，全场商品9.0折，购物满3000送精美礼品',
    tag: '新年',
    tagType: 'success',
    startTime: '2024-06-16',
    endTime: '2024-09-14',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=109',
    relatedProducts: [
      { id: 9, name: '联想 ThinkPad X1 Carbon', price: '12999', originalPrice: '13999', mainImage: 'https://picsum.photos/300/300?random=19' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 80,
    title: '特惠限时特惠',
    description: '全场商品低至9.0折，满2000减200，上不封顶',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-05-23',
    endTime: '2025-12-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=110',
    relatedProducts: [
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 81,
    title: '周年庆全球狂欢节',
    description: '周年庆大促，全场商品7.0折起，满500减50',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2024-05-04',
    endTime: '2025-03-07',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=111',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 82,
    title: '618专享日',
    description: '618大促，全场商品9.0折起，满300减30',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-01-16',
    endTime: '2024-08-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=112',
    relatedProducts: [
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 83,
    title: '特惠清凉特卖',
    description: '特惠限时特惠，爆款商品8.0折，数量有限，先到先得',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-01-30',
    endTime: '2024-07-29',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=113',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' }
    ]
  },
  {
    id: 84,
    title: '618满减活动',
    description: '全场商品低至6.0折，满500减50，上不封顶',
    tag: '618',
    tagType: 'primary',
    startTime: '2024-01-03',
    endTime: '2024-11-14',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=114',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' },
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' }
    ]
  },
  {
    id: 85,
    title: '满减新品上市',
    description: '满减限时特惠，爆款商品7.0折，数量有限，先到先得',
    tag: '满减',
    tagType: 'primary',
    startTime: '2025-07-02',
    endTime: '2025-10-21',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=115',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' }
    ]
  },
  {
    id: 86,
    title: '周年庆年中盛典',
    description: '周年庆超值购，精选商品低至9.0折，限时抢购',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2025-02-07',
    endTime: '2025-08-20',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=116',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 16, name: 'TCL Q10H  Mini LED', price: '7999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=26' }
    ]
  },
  {
    id: 87,
    title: '会员满减活动',
    description: '会员专享7.0折优惠，新用户注册即送158元优惠券',
    tag: '会员',
    tagType: 'success',
    startTime: '2024-04-10',
    endTime: '2024-06-19',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=117',
    relatedProducts: [
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 88,
    title: '双11专享日',
    description: '双11新品首发，全场新品8.0折，限时一周',
    tag: '双11',
    tagType: 'danger',
    startTime: '2024-01-29',
    endTime: '2024-02-29',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=118',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 18, name: '努比亚 Z60 Ultra', price: '4699', originalPrice: '5199', mainImage: 'https://picsum.photos/300/300?random=28' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  },
  {
    id: 89,
    title: '周年庆满减活动',
    description: '周年庆新品首发，全场新品6.0折，限时一周',
    tag: '周年庆',
    tagType: 'info',
    startTime: '2024-12-21',
    endTime: '2025-06-13',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=119',
    relatedProducts: [
      { id: 2, name: '华为 Mate 60 Pro', price: '6999', originalPrice: '7999', mainImage: 'https://picsum.photos/300/300?random=12' },
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' }
    ]
  },
  {
    id: 90,
    title: '新品清凉特卖',
    description: '新品清凉商品大促销，家电类商品满500减50',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-03-24',
    endTime: '2024-04-03',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=120',
    relatedProducts: [
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 91,
    title: '新品限时特惠',
    description: '新品新气象，全场商品满1000减100，满2000减200',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-01-11',
    endTime: '2024-07-05',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=121',
    relatedProducts: [
      { id: 15, name: '创维 OLED电视 A5D', price: '8999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=25' },
      { id: 17, name: '魅族 21 Pro', price: '4599', originalPrice: '4999', mainImage: 'https://picsum.photos/300/300?random=27' },
      { id: 5, name: 'OPPO Find X7 Pro', price: '5499', originalPrice: '5999', mainImage: 'https://picsum.photos/300/300?random=15' }
    ]
  },
  {
    id: 92,
    title: '新品专享日',
    description: '新品新品首发，全场新品9.0折，限时一周',
    tag: '新品',
    tagType: 'warning',
    startTime: '2024-01-18',
    endTime: '2025-08-31',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=122',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 93,
    title: '夏日清凉特卖',
    description: '夏日满减活动，满3000减300，满6000减600，满9000减900',
    tag: '夏日',
    tagType: 'info',
    startTime: '2025-03-02',
    endTime: '2025-08-09',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=123',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' }
    ]
  },
  {
    id: 94,
    title: '618超值购',
    description: '618满减活动，满1000减100，满2000减200，满3000减300',
    tag: '618',
    tagType: 'primary',
    startTime: '2025-01-12',
    endTime: '2025-05-19',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=124',
    relatedProducts: [
      { id: 3, name: '小米 14 Ultra', price: '5999', originalPrice: '6499', mainImage: 'https://picsum.photos/300/300?random=13' },
      { id: 6, name: 'vivo X100 Pro', price: '5299', originalPrice: '5799', mainImage: 'https://picsum.photos/300/300?random=16' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 95,
    title: '夏日周年庆',
    description: '夏日限时特惠，爆款商品9.0折，数量有限，先到先得',
    tag: '夏日',
    tagType: 'info',
    startTime: '2024-07-07',
    endTime: '2025-10-15',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=125',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 7, name: '荣耀 Magic6 Pro', price: '5699', originalPrice: '6199', mainImage: 'https://picsum.photos/300/300?random=17' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' }
    ]
  },
  {
    id: 96,
    title: '特惠限时特惠',
    description: '特惠新气象，全场商品满300减30，满600减60',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-05-07',
    endTime: '2024-12-30',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=126',
    relatedProducts: [
      { id: 8, name: '一加 12', price: '4999', originalPrice: '5499', mainImage: 'https://picsum.photos/300/300?random=18' },
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 19, name: '坚果 R2', price: '3999', originalPrice: '4499', mainImage: 'https://picsum.photos/300/300?random=29' }
    ]
  },
  {
    id: 97,
    title: '特惠专享日',
    description: '特惠清凉商品大促销，家电类商品满3000减300',
    tag: '特惠',
    tagType: 'warning',
    startTime: '2024-12-18',
    endTime: '2025-08-17',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=127',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' },
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' }
    ]
  },
  {
    id: 98,
    title: '限时特惠',
    description: '限时周年庆，全场商品7.0折，购物满3000送精美礼品',
    tag: '限时',
    tagType: 'danger',
    startTime: '2024-04-16',
    endTime: '2025-08-04',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=128',
    relatedProducts: [
      { id: 4, name: '三星 Galaxy S24 Ultra', price: '7999', originalPrice: '8999', mainImage: 'https://picsum.photos/300/300?random=14' },
      { id: 20, name: '摩托罗拉 edge 50 Pro', price: '3599', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=30' },
      { id: 13, name: '小米 电视 EA75', price: '3299', originalPrice: '3999', mainImage: 'https://picsum.photos/300/300?random=23' }
    ]
  },
  {
    id: 99,
    title: '双11专享日',
    description: '双11大促，全场商品7.0折起，满500减50',
    tag: '双11',
    tagType: 'danger',
    startTime: '2024-11-05',
    endTime: '2025-06-18',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=129',
    relatedProducts: [
      { id: 12, name: '惠普 Spectre x360', price: '11999', originalPrice: '12999', mainImage: 'https://picsum.photos/300/300?random=22' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 10, name: '戴尔 XPS 13', price: '9999', originalPrice: '10999', mainImage: 'https://picsum.photos/300/300?random=20' }
    ]
  },
  {
    id: 100,
    title: '新年年中盛典',
    description: '新年清凉商品大促销，家电类商品满2000减200',
    tag: '新年',
    tagType: 'success',
    startTime: '2025-05-01',
    endTime: '2025-12-05',
    status: '已结束',
    bannerImage: 'https://picsum.photos/800/300?random=130',
    relatedProducts: [
      { id: 1, name: 'iPhone 15 Pro', price: '8999', originalPrice: '9999', mainImage: 'https://picsum.photos/300/300?random=11' },
      { id: 14, name: '海信 激光电视 80L5G', price: '19999', originalPrice: '24999', mainImage: 'https://picsum.photos/300/300?random=24' },
      { id: 11, name: 'MacBook Pro 14', price: '15999', originalPrice: '16999', mainImage: 'https://picsum.photos/300/300?random=21' }
    ]
  }
])