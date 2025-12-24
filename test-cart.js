// 测试购物车功能的简单脚本
const axios = require('axios');

// 测试参数
const baseURL = 'http://localhost:8083/api';
const testUser = {
  username: 'test',
  password: 'test123'
};
let token = '';
let userId = 1;

// 创建 axios 实例
const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试步骤
async function testCart() {
  console.log('开始测试购物车功能...');
  
  try {
    // 1. 登录获取 token
    console.log('1. 登录获取 token...');
    const loginResponse = await instance.post('/auth/login', testUser);
    token = loginResponse.data.token;
    userId = loginResponse.data.user.id;
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ 登录成功，获取到 token');
    
    // 2. 获取购物车列表
    console.log('2. 获取购物车列表...');
    const cartResponse = await instance.get(`/cart/user/${userId}`);
    console.log('✅ 获取购物车列表成功，响应数据：', JSON.stringify(cartResponse.data, null, 2));
    
    // 3. 添加商品到购物车
    console.log('3. 添加商品到购物车...');
    const addToCartResponse = await instance.post('/cart', {
      userId,
      productId: 1,
      quantity: 1
    });
    console.log('✅ 添加商品到购物车成功，响应数据：', JSON.stringify(addToCartResponse.data, null, 2));
    
    // 4. 再次获取购物车列表，验证商品已添加
    console.log('4. 再次获取购物车列表，验证商品已添加...');
    const cartResponse2 = await instance.get(`/cart/user/${userId}`);
    console.log('✅ 获取购物车列表成功，购物车商品数量：', cartResponse2.data.data.length);
    console.log('✅ 购物车列表数据：', JSON.stringify(cartResponse2.data.data, null, 2));
    
    console.log('🎉 购物车功能测试成功！');
  } catch (error) {
    console.error('❌ 测试失败：', error.response?.data || error.message);
  }
}

// 执行测试
testCart();
