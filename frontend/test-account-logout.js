import axios from 'axios';

// 测试账号注销功能
async function testAccountLogout() {
  // 先注册一个新用户用于测试
  const testUsername = 'logout-test-user';
  const testPassword = 'testpassword123';
  
  try {
    await axios.post('http://localhost:8080/api/auth/register', {
      username: testUsername,
      password: testPassword,
      email: `${testUsername}@example.com`,
      nickname: '注销测试用户'
    });
    console.log('注册测试用户成功');
  } catch (error) {
    console.error('注册测试用户失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 1: 正常流程 - 登录后注销
  console.log('\n=== 测试场景 1: 正常流程 - 登录后注销 ===');
  try {
    // 登录
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      username: testUsername,
      password: testPassword
    });
    console.log('登录成功:', loginResponse.data);
    
    const token = loginResponse.data.data.token;
    
    // 测试 logout API
    const logoutResponse = await axios.post(
      'http://localhost:8080/api/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('注销成功:', logoutResponse.data);
    
    // 验证 token 失效 - 使用已注销的 token 获取用户信息应该失败
    try {
      const meResponse = await axios.get(
        'http://localhost:8080/api/auth/me',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✗ 使用已注销的 token 获取用户信息成功 - 这是一个错误:', meResponse.data);
    } catch (error) {
      console.log('✓ 使用已注销的 token 获取用户信息失败 - 符合预期:', error.response ? error.response.data : error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 2: 异常场景 - 未登录状态下注销
  console.log('\n=== 测试场景 2: 异常场景 - 未登录状态下注销 ===');
  try {
    const logoutResponse = await axios.post('http://localhost:8080/api/auth/logout');
    console.log('测试结果:', logoutResponse.data);
    console.log('✗ 未登录状态下注销成功 - 这可能是一个问题，因为没有认证信息');
  } catch (error) {
    console.error('测试结果:', error.response ? error.response.data : error.message);
    console.log('✓ 未登录状态下注销失败 - 符合预期');
  }
  
  // 测试场景 3: 异常场景 - 使用无效 token 注销
  console.log('\n=== 测试场景 3: 异常场景 - 使用无效 token 注销 ===');
  try {
    const logoutResponse = await axios.post(
      'http://localhost:8080/api/auth/logout',
      {},
      { headers: { Authorization: 'Bearer invalid-token-123456' } }
    );
    console.log('测试结果:', logoutResponse.data);
    console.log('✗ 使用无效 token 注销成功 - 这可能是一个问题');
  } catch (error) {
    console.error('测试结果:', error.response ? error.response.data : error.message);
    console.log('✓ 使用无效 token 注销失败 - 符合预期');
  }
}

testAccountLogout();
