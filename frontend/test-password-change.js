import axios from 'axios';

// 测试密码修改功能
async function testPasswordChange() {
  // 使用 testuser3 登录获取新的 token
  const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
    username: 'testuser3',
    password: '123456'
  });
  
  console.log('登录成功:', loginResponse.data);
  const token = loginResponse.data.data.token;
  
  // 测试场景 1: 正常流程 - 正确的当前密码
  console.log('\n=== 测试场景 1: 正常流程 - 正确的当前密码 ===');
  try {
    const response = await axios.post(
      'http://localhost:8080/api/auth/change-password',
      { currentPassword: '123456', newPassword: 'password123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', response.data);
    
    // 验证新密码是否生效
    const loginWithNewPassword = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'testuser3',
      password: 'password123'
    });
    console.log('使用新密码登录成功:', loginWithNewPassword.data);
    
    // 使用旧密码登录应该失败
    try {
      const loginWithOldPassword = await axios.post('http://localhost:8080/api/auth/login', {
        username: 'testuser3',
        password: '123456'
      });
      console.log('使用旧密码登录成功 - 这是一个错误:', loginWithOldPassword.data);
    } catch (error) {
      console.log('使用旧密码登录失败 - 这是预期结果:', error.response.data);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 2: 异常场景 - 错误的当前密码
  console.log('\n=== 测试场景 2: 异常场景 - 错误的当前密码 ===');
  try {
    const response = await axios.post(
      'http://localhost:8080/api/auth/change-password',
      { currentPassword: 'wrongpassword', newPassword: 'password123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', response.data);
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 3: 边界条件 - 新密码长度过短
  console.log('\n=== 测试场景 3: 边界条件 - 新密码长度过短 ===');
  try {
    const response = await axios.post(
      'http://localhost:8080/api/auth/change-password',
      { currentPassword: '123456', newPassword: '123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', response.data);
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
}

testPasswordChange();
