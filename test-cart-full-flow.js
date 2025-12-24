// 测试购物车功能完整流程的脚本
const axios = require('axios');

// 测试参数
const baseURL = 'http://localhost:8083/api';
const testUser = {
  username: 'admin',
  password: 'admin123'
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
async function testCartFullFlow() {
  console.log('开始测试购物车功能完整流程...');
  
  try {
    // 1. 登录获取 token
    console.log('1. 登录获取 token...');
    const loginResponse = await instance.post('/auth/login', testUser);
    token = loginResponse.data.token;
    userId = loginResponse.data.user.id;
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ 登录成功，获取到 token，用户ID:', userId);
    
    // 2. 获取初始购物车列表
    console.log('2. 获取初始购物车列表...');
    const cartResponse1 = await instance.get(`/cart/user/${userId}`);
    console.log('✅ 获取初始购物车列表成功，购物车商品数量：', cartResponse1.data.data.length);
    
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
    if (cartResponse2.data.data.length === 1) {
      console.log('✅ 商品已成功添加到购物车');
    } else {
      console.error('❌ 商品未添加到购物车');
    }
    
    // 5. 更新购物车商品数量
    console.log('5. 更新购物车商品数量...');
    const cartItemId = cartResponse2.data.data[0].id;
    const updateCartResponse = await instance.put(`/cart/${cartItemId}`, { quantity: 2 });
    console.log('✅ 更新购物车商品数量成功，响应数据：', JSON.stringify(updateCartResponse.data, null, 2));
    
    // 6. 再次获取购物车列表，验证商品数量已更新
    console.log('6. 再次获取购物车列表，验证商品数量已更新...');
    const cartResponse3 = await instance.get(`/cart/user/${userId}`);
    console.log('✅ 获取购物车列表成功，购物车商品数量：', cartResponse3.data.data.length);
    if (cartResponse3.data.data[0].quantity === 2) {
      console.log('✅ 商品数量已成功更新');
    } else {
      console.error('❌ 商品数量未更新，当前数量：', cartResponse3.data.data[0].quantity);
    }
    
    // 7. 删除购物车商品
    console.log('7. 删除购物车商品...');
    const deleteCartResponse = await instance.delete(`/cart/${cartItemId}`);
    console.log('✅ 删除购物车商品成功，响应数据：', JSON.stringify(deleteCartResponse.data, null, 2));
    
    // 8. 再次获取购物车列表，验证商品已删除
    console.log('8. 再次获取购物车列表，验证商品已删除...');
    const cartResponse4 = await instance.get(`/cart/user/${userId}`);
    console.log('✅ 获取购物车列表成功，购物车商品数量：', cartResponse4.data.data.length);
    if (cartResponse4.data.data.length === 0) {
      console.log('✅ 商品已成功从购物车中删除');
    } else {
      console.error('❌ 商品未从购物车中删除');
    }
    
    // 9. 再次添加商品到购物车（用于测试清空购物车功能）
    console.log('9. 再次添加商品到购物车...');
    const addToCartResponse2 = await instance.post('/cart', {
      userId,
      productId: 1,
      quantity: 1
    });
    console.log('✅ 再次添加商品到购物车成功');
    
    // 10. 清空购物车
    console.log('10. 清空购物车...');
    const clearCartResponse = await instance.delete(`/cart/user/${userId}`);
    console.log('✅ 清空购物车成功，响应数据：', JSON.stringify(clearCartResponse.data, null, 2));
    
    // 11. 最后获取购物车列表，验证购物车已清空
    console.log('11. 最后获取购物车列表，验证购物车已清空...');
    const cartResponse5 = await instance.get(`/cart/user/${userId}`);
    console.log('✅ 获取购物车列表成功，购物车商品数量：', cartResponse5.data.data.length);
    if (cartResponse5.data.data.length === 0) {
      console.log('✅ 购物车已成功清空');
    } else {
      console.error('❌ 购物车未清空');
    }
    
    console.log('🎉 购物车功能完整流程测试成功！');
  } catch (error) {
    console.error('❌ 测试失败：', error.response?.data || error.message);
    console.error('❌ 错误详情：', error);
  }
}

// 执行测试
testCartFullFlow();
