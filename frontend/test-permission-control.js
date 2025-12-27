import axios from 'axios';

// 测试权限控制功能
async function testPermissionControl() {
  // 先注册两个用户用于测试
  const user1 = { username: 'permission-test-user1', password: 'testpassword123', email: 'user1@example.com', nickname: '权限测试用户1' };
  const user2 = { username: 'permission-test-user2', password: 'testpassword123', email: 'user2@example.com', nickname: '权限测试用户2' };
  
  // 注册用户
  try {
    await axios.post('http://localhost:8080/api/auth/register', user1);
    await axios.post('http://localhost:8080/api/auth/register', user2);
    console.log('注册测试用户成功');
  } catch (error) {
    console.error('注册测试用户失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 1: 未登录用户访问需要认证的接口
  console.log('\n=== 测试场景 1: 未登录用户访问需要认证的接口 ===');
  try {
    // 尝试访问 /auth/me 接口，需要认证
    const meResponse = await axios.get('http://localhost:8080/api/auth/me');
    console.log('✗ 未登录用户访问 /auth/me 成功 - 这是一个错误:', meResponse.data);
  } catch (error) {
    console.log('✓ 未登录用户访问 /auth/me 失败 - 符合预期:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 2: 已登录用户修改个人信息 - 正常流程
  console.log('\n=== 测试场景 2: 已登录用户修改个人信息 - 正常流程 ===');
  try {
    const loginResponse1 = await axios.post('http://localhost:8080/api/auth/login', {
      username: user1.username,
      password: user1.password
    });
    const token1 = loginResponse1.data.data.token;
    
    // 修改用户1的个人信息
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      { email: 'updated-user1@example.com' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    console.log('✓ 用户1修改自己的信息成功 - 符合预期:', updateResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 3: 验证token过期或无效时的处理
  console.log('\n=== 测试场景 3: 验证token过期或无效时的处理 ===');
  try {
    const invalidToken = 'invalid-token-123456';
    
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      { email: 'updated@example.com' },
      { headers: { Authorization: `Bearer ${invalidToken}` } }
    );
    console.log('✗ 使用无效token修改信息成功 - 这是一个错误:', updateResponse.data);
  } catch (error) {
    console.log('✓ 使用无效token修改信息失败 - 符合预期:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 4: 检查密码修改功能的权限控制
  console.log('\n=== 测试场景 4: 检查密码修改功能的权限控制 ===');
  try {
    // 登录获取token
    const loginResponse1 = await axios.post('http://localhost:8080/api/auth/login', {
      username: user1.username,
      password: user1.password
    });
    const token1 = loginResponse1.data.data.token;
    
    // 尝试修改密码
    const changePasswordResponse = await axios.post(
      'http://localhost:8080/api/auth/change-password',
      { currentPassword: user1.password, newPassword: 'newpassword123' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    console.log('✓ 用户1修改自己的密码成功 - 符合预期:', changePasswordResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 5: 未登录用户尝试修改密码
  console.log('\n=== 测试场景 5: 未登录用户尝试修改密码 ===');
  try {
    const changePasswordResponse = await axios.post(
      'http://localhost:8080/api/auth/change-password',
      { currentPassword: 'wrongpassword', newPassword: 'newpassword123' }
    );
    console.log('✗ 未登录用户修改密码成功 - 这是一个错误:', changePasswordResponse.data);
  } catch (error) {
    console.log('✓ 未登录用户修改密码失败 - 符合预期:', error.response ? error.response.data : error.message);
  }
}

testPermissionControl();
