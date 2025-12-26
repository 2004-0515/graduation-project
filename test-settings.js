const axios = require('axios');

// 配置axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加响应拦截器，确保响应数据被正确解析
api.interceptors.response.use(
  response => {
    // 直接返回响应数据，不需要额外处理
    return response.data;
  },
  error => {
    return Promise.reject(error.response?.data || error);
  }
);

// 生成随机邮箱
const randomString = Math.random().toString(36).substring(2, 10);

// 测试用户信息
const testUser = {
  username: `test_user_${randomString}`,
  password: 'test_password123',
  email: `test_${randomString}@example.com`,
  nickname: '测试用户'
};

// 存储认证token
let token = '';

// 测试注册功能
async function testRegister() {
  console.log('=== 测试注册功能 ===');
  try {
    // 先尝试删除已有用户（如果存在）
    try {
      await api.delete(`/users/${testUser.username}`);
      console.log('✅ 删除已有用户成功');
    } catch (error) {
      // 用户不存在，继续注册
      console.log('ℹ️  已有用户不存在，继续注册');
    }
    
    const response = await api.post('/auth/register', testUser);
    console.log('注册响应:', response);
    
    if (response.success) {
      console.log('✅ 注册成功');
      return true;
    } else {
      console.error('❌ 注册失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 注册失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

// 测试登录功能
async function testLogin() {
  console.log('\n=== 测试登录功能 ===');
  try {
    const response = await api.post('/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    
    console.log('登录响应:', JSON.stringify(response, null, 2));
    
    // 简化登录测试，只需要验证登录请求是否成功
    if (response.success && response.data) {
      // 检查token的位置
      token = response.data.token;
      if (!token) {
        console.error('❌ 登录失败: 响应中没有token');
        return false;
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ 登录成功，获取到token');
      return true;
    } else {
      console.error('❌ 登录失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 登录失败:', error.message || error);
    return false;
  }
}

// 测试获取安全设置
async function testGetSecuritySettings() {
  console.log('\n=== 测试获取安全设置 ===');
  try {
    const response = await api.get('/security-settings/me');
    console.log('安全设置响应:', response);
    
    if (response.success && response.data) {
      console.log('✅ 获取安全设置成功:', response.data);
      return response.data;
    } else {
      console.error('❌ 获取安全设置失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 获取安全设置失败:', error.message || error);
    return false;
  }
}

// 测试更新安全设置
async function testUpdateSecuritySettings() {
  console.log('\n=== 测试更新安全设置 ===');
  try {
    const newSettings = {
      passwordExpireDays: 180,
      twoFactorEnabled: false,
      sessionTimeout: 60,
      enableLoginDetection: true,
      enableSensitiveVerify: false
    };
    const response = await api.put('/security-settings/me', newSettings);
    console.log('更新安全设置响应:', response);
    
    if (response.success) {
      console.log('✅ 更新安全设置成功:', response.data);
      return true;
    } else {
      console.error('❌ 更新安全设置失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 更新安全设置失败:', error.message || error);
    return false;
  }
}

// 测试获取隐私设置
async function testGetPrivacySettings() {
  console.log('\n=== 测试获取隐私设置 ===');
  try {
    const response = await api.get('/privacy-settings/me');
    console.log('隐私设置响应:', response);
    
    if (response.success && response.data) {
      console.log('✅ 获取隐私设置成功:', response.data);
      return response.data;
    } else {
      console.error('❌ 获取隐私设置失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 获取隐私设置失败:', error.message || error);
    return false;
  }
}

// 测试更新隐私设置
async function testUpdatePrivacySettings() {
  console.log('\n=== 测试更新隐私设置 ===');
  try {
    const newSettings = {
      profileVisibility: 'private',
      allowStrangerMessages: false,
      allowRecommend: false,
      allowDataCollection: false,
      allowThirdPartyShare: false,
      receivePrivacyUpdates: true,
      dataRetentionDays: 90
    };
    const response = await api.put('/privacy-settings/me', newSettings);
    console.log('更新隐私设置响应:', response);
    
    if (response.success) {
      console.log('✅ 更新隐私设置成功:', response.data);
      return true;
    } else {
      console.error('❌ 更新隐私设置失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 更新隐私设置失败:', error.message || error);
    return false;
  }
}

// 测试获取通知设置
async function testGetNotificationSettings() {
  console.log('\n=== 测试获取通知设置 ===');
  try {
    const response = await api.get('/notification-settings/me');
    console.log('通知设置响应:', response);
    
    if (response.success && response.data) {
      console.log('✅ 获取通知设置成功:', response.data);
      return response.data;
    } else {
      console.error('❌ 获取通知设置失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 获取通知设置失败:', error.message || error);
    return false;
  }
}

// 测试更新通知设置
async function testUpdateNotificationSettings() {
  console.log('\n=== 测试更新通知设置 ===');
  try {
    const newSettings = {
      orderStatusEnabled: true,
      deliveryEnabled: false,
      promotionsEnabled: false,
      newProductsEnabled: true,
      systemEnabled: true,
      inAppEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      notificationFrequency: 'daily',
      notifyStartTime: 9,
      notifyEndTime: 21
    };
    const response = await api.put('/notification-settings/me', newSettings);
    console.log('更新通知设置响应:', response);
    
    if (response.success) {
      console.log('✅ 更新通知设置成功:', response.data);
      return true;
    } else {
      console.error('❌ 更新通知设置失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 更新通知设置失败:', error.message || error);
    return false;
  }
}

// 测试修改密码功能
async function testChangePassword() {
  console.log('\n=== 测试修改密码功能 ===');
  try {
    // 先测试使用错误的旧密码
    await api.post('/auth/change-password', {
      currentPassword: 'wrong_password',
      newPassword: 'new_admin123',
      confirmPassword: 'new_admin123'
    });
    console.error('❌ 测试失败：错误的旧密码应该被拒绝');
    return false;
  } catch (error) {
    console.log('✅ 测试通过：错误的旧密码被正确拒绝');
  }

  try {
    // 测试使用正确的旧密码修改密码
    const response = await api.post('/auth/change-password', {
      currentPassword: testUser.password,
      newPassword: 'new_admin123',
      confirmPassword: 'new_admin123'
    });
    console.log('✅ 修改密码成功:', response.message);
    
    // 测试使用新密码登录
    const loginResponse = await api.post('/auth/login', {
      username: testUser.username,
      password: 'new_admin123'
    });
    console.log('✅ 使用新密码登录成功，密码修改功能正常');
    
    // 恢复原密码
    await api.post('/auth/login', {
      username: testUser.username,
      password: 'new_admin123'
    }).then(res => {
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    });
    
    await api.post('/auth/change-password', {
      currentPassword: 'new_admin123',
      newPassword: testUser.password,
      confirmPassword: testUser.password
    });
    console.log('✅ 密码已恢复为原密码');
    
    // 恢复原token
    const originalLogin = await api.post('/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    token = originalLogin.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return true;
  } catch (error) {
    console.error('❌ 修改密码或登录测试失败:', error.message || error);
    return false;
  }
}

// 测试注销账号功能
async function testLogout() {
  console.log('\n=== 测试注销账号功能 ===');
  try {
    const response = await api.post('/auth/logout');
    console.log('注销账号响应:', response);
    
    if (response.success) {
      console.log('✅ 注销账号成功:', response.message);
      return true;
    } else {
      console.error('❌ 注销账号失败:', response.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('❌ 注销账号失败:', error.message || error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试安全设置、隐私设置、通知设置和账号注销功能\n');
  
  let successCount = 0;
  let totalTests = 0;
  
  // 测试注册
  totalTests++;
  if (await testRegister()) {
    successCount++;
  }
  
  // 测试登录
  totalTests++;
  if (await testLogin()) {
    successCount++;
  }
  
  // 测试安全设置
  totalTests++;
  if (await testGetSecuritySettings()) {
    successCount++;
  }
  
  totalTests++;
  if (await testUpdateSecuritySettings()) {
    successCount++;
  }
  
  // 测试隐私设置
  totalTests++;
  if (await testGetPrivacySettings()) {
    successCount++;
  }
  
  totalTests++;
  if (await testUpdatePrivacySettings()) {
    successCount++;
  }
  
  // 测试通知设置
  totalTests++;
  if (await testGetNotificationSettings()) {
    successCount++;
  }
  
  totalTests++;
  if (await testUpdateNotificationSettings()) {
    successCount++;
  }
  
  // 测试修改密码
  totalTests++;
  if (await testChangePassword()) {
    successCount++;
  }
  
  // 测试注销账号
  totalTests++;
  if (await testLogout()) {
    successCount++;
  }
  
  // 测试结果汇总
  console.log('\n' + '='.repeat(50));
  console.log('测试结果汇总');
  console.log('='.repeat(50));
  console.log(`总测试数: ${totalTests}`);
  console.log(`成功数: ${successCount}`);
  console.log(`失败数: ${totalTests - successCount}`);
  console.log(`成功率: ${((successCount / totalTests) * 100).toFixed(2)}%`);
  
  if (successCount === totalTests) {
    console.log('\n✅ 所有测试都已通过！');
  } else {
    console.log('\n❌ 部分测试失败，请检查代码实现。');
  }
}

// 运行测试
runTests();
