const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const config = {
  baseURL: 'http://localhost:8080/api',
  username: 'testuser',
  password: 'testpassword',
  newPassword: 'newtestpassword'
};

// 创建axios实例
const api = axios.create({
  baseURL: config.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let token = '';
let userId = '';

async function login() {
  console.log('=== 登录测试 ===');
  try {
    const response = await api.post('/auth/login', {
      username: config.username,
      password: config.password
    });
    console.log('  登录响应:', response);
    if (response.data && response.data.success) {
      token = response.data.data.token;
      userId = response.data.data.user.id;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✓ 登录成功');
      return true;
    } else {
      console.error('✗ 登录失败:', response.data ? response.data.message : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('✗ 登录请求失败:', error.message);
    if (error.response) {
      console.error('  响应状态:', error.response.status);
      console.error('  响应数据:', error.response.data);
    }
    return false;
  }
}

async function testGetSecuritySettings() {
  console.log('\n=== 获取安全设置测试 ===');
  try {
    const response = await api.get('/security-settings/me');
    if (response.data.success) {
      console.log('✓ 获取安全设置成功');
      console.log('  安全设置:', response.data.data);
      return true;
    } else {
      console.error('✗ 获取安全设置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 获取安全设置请求失败:', error.message);
    return false;
  }
}

async function testUpdateSecuritySettings() {
  console.log('\n=== 更新安全设置测试 ===');
  try {
    const updateData = {
      passwordExpireDays: 30,
      twoFactorEnabled: true,
      sessionTimeout: 60,
      enableLoginDetection: false,
      enableSensitiveVerify: false
    };
    const response = await api.put('/security-settings/me', updateData);
    if (response.data.success) {
      console.log('✓ 更新安全设置成功');
      console.log('  更新后安全设置:', response.data.data);
      return true;
    } else {
      console.error('✗ 更新安全设置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 更新安全设置请求失败:', error.message);
    return false;
  }
}

async function testGetPrivacySettings() {
  console.log('\n=== 获取隐私设置测试 ===');
  try {
    const response = await api.get('/privacy-settings/me');
    if (response.data.success) {
      console.log('✓ 获取隐私设置成功');
      console.log('  隐私设置:', response.data.data);
      return true;
    } else {
      console.error('✗ 获取隐私设置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 获取隐私设置请求失败:', error.message);
    return false;
  }
}

async function testUpdatePrivacySettings() {
  console.log('\n=== 更新隐私设置测试 ===');
  try {
    const updateData = {
      profileVisibility: 'friends',
      allowStrangerMessages: false,
      allowRecommend: false,
      allowDataCollection: false,
      allowThirdPartyShare: true,
      receivePrivacyUpdates: false,
      dataRetentionDays: 90
    };
    const response = await api.put('/privacy-settings/me', updateData);
    if (response.data.success) {
      console.log('✓ 更新隐私设置成功');
      console.log('  更新后隐私设置:', response.data.data);
      return true;
    } else {
      console.error('✗ 更新隐私设置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 更新隐私设置请求失败:', error.message);
    return false;
  }
}

async function testGetNotificationSettings() {
  console.log('\n=== 获取通知设置测试 ===');
  try {
    const response = await api.get('/notification-settings/me');
    if (response.data.success) {
      console.log('✓ 获取通知设置成功');
      console.log('  通知设置:', response.data.data);
      return true;
    } else {
      console.error('✗ 获取通知设置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 获取通知设置请求失败:', error.message);
    return false;
  }
}

async function testUpdateNotificationSettings() {
  console.log('\n=== 更新通知设置测试 ===');
  try {
    const updateData = {
      orderStatusEnabled: false,
      deliveryEnabled: false,
      promotionsEnabled: false,
      newProductsEnabled: false,
      systemEnabled: true,
      inAppEnabled: true,
      emailEnabled: false,
      smsEnabled: true,
      notificationFrequency: 'daily',
      notifyStartTime: 9,
      notifyEndTime: 21
    };
    const response = await api.put('/notification-settings/me', updateData);
    if (response.data.success) {
      console.log('✓ 更新通知设置成功');
      console.log('  更新后通知设置:', response.data.data);
      return true;
    } else {
      console.error('✗ 更新通知设置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 更新通知设置请求失败:', error.message);
    return false;
  }
}

async function testChangePassword() {
  console.log('\n=== 修改密码测试 ===');
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword: config.password,
      newPassword: config.newPassword,
      confirmPassword: config.newPassword
    });
    if (response.data.success) {
      console.log('✓ 修改密码成功');
      // 改回原密码，以便后续测试
      await api.post('/auth/change-password', {
        currentPassword: config.newPassword,
        newPassword: config.password,
        confirmPassword: config.password
      });
      return true;
    } else {
      console.error('✗ 修改密码失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 修改密码请求失败:', error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n=== 退出登录测试 ===');
  try {
    const response = await api.post('/auth/logout');
    if (response.data.success) {
      console.log('✓ 退出登录成功');
      return true;
    } else {
      console.error('✗ 退出登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 退出登录请求失败:', error.message);
    return false;
  }
}

async function testCreateTestUser() {
  console.log('\n=== 创建测试用户 ===');
  try {
    console.log('  尝试创建测试用户:', config.username);
    const response = await api.post('/auth/register', {
      username: config.username,
      password: config.password,
      email: 'testuser@example.com',
      nickname: 'Test User'
    });
    console.log('  注册响应:', response.data);
    if (response.data && response.data.success) {
      console.log('✓ 测试用户创建成功');
      return true;
    } else {
      console.log('  测试用户可能已存在，继续测试');
      return true;
    }
  } catch (error) {
    console.error('✗ 创建测试用户失败:', error.message);
    if (error.response) {
      console.error('  响应状态:', error.response.status);
      console.error('  响应数据:', error.response.data);
    }
    return false;
  }
}

async function testDeleteAccount() {
  console.log('\n=== 删除账号测试 ===');
  try {
    // 先登录一个新的测试账号进行删除测试
    const testDeleteUsername = 'testdeleteuser';
    const testDeletePassword = 'testdeletepassword';
    
    // 创建测试账号
    await api.post('/auth/register', {
      username: testDeleteUsername,
      password: testDeletePassword,
      email: 'testdeleteuser@example.com',
      nickname: 'Test Delete User'
    });
    
    // 登录测试账号
    const loginResponse = await api.post('/auth/login', {
      username: testDeleteUsername,
      password: testDeletePassword
    });
    
    if (loginResponse.data.success) {
      const deleteToken = loginResponse.data.data.token;
      const deleteUserId = loginResponse.data.data.user.id;
      
      // 创建新的axios实例用于删除测试
      const deleteApi = axios.create({
        baseURL: config.baseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deleteToken}`
        }
      });
      
      // 调用删除账号API
      const deleteResponse = await deleteApi.delete('/users/me');
      
      if (deleteResponse.data.success) {
        console.log('✓ 删除账号成功');
        return true;
      } else {
        console.error('✗ 删除账号失败:', deleteResponse.data.message);
        return false;
      }
    } else {
      console.error('✗ 登录测试账号失败:', loginResponse.data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ 删除账号请求失败:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('开始运行所有设置相关测试...\n');
  
  // 先创建测试用户
  const isUserCreated = await testCreateTestUser();
  if (!isUserCreated) {
    console.log('\n❌ 创建测试用户失败，无法继续测试');
    return;
  }
  
  // 登录
  const isLoggedIn = await login();
  if (!isLoggedIn) {
    console.log('\n❌ 登录失败，无法继续测试');
    return;
  }
  
  // 运行所有测试
  const tests = [
    testGetSecuritySettings,
    testUpdateSecuritySettings,
    testGetPrivacySettings,
    testUpdatePrivacySettings,
    testGetNotificationSettings,
    testUpdateNotificationSettings,
    testChangePassword
  ];
  
  let passedTests = 0;
  for (const test of tests) {
    const result = await test();
    if (result) {
      passedTests++;
    }
  }
  
  // 退出登录
  await testLogout();
  
  // 测试删除账号（需要单独登录）
  const deleteResult = await testDeleteAccount();
  if (deleteResult) {
    passedTests++;
  }
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50));
  console.log(`测试完成: ${passedTests}/${tests.length + 1} 个测试通过`);
  if (passedTests === tests.length + 1) {
    console.log('🎉 所有测试都通过了！');
  } else {
    console.log('❌ 有测试失败，请检查错误信息');
  }
  console.log('='.repeat(50));
}

// 运行测试
runAllTests();
