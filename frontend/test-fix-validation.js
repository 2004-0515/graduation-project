import axios from 'axios';

// 测试修复后的功能
async function testFixValidation() {
  // 测试场景 1: 密码修改 - 新密码长度过短（BUG-001）
  console.log('=== 测试场景 1: 密码修改 - 新密码长度过短（BUG-001） ===');
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'testuser3',
      password: 'password123'
    });
    const token = loginResponse.data.data.token;
    
    // 测试新密码长度过短
    const response = await axios.post(
      'http://localhost:8080/api/auth/change-password',
      { currentPassword: 'password123', newPassword: '123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✗ 测试失败:', response.data);
  } catch (error) {
    console.log('✓ 测试成功:', error.response.data);
  }
  
  // 测试场景 2: 个人信息编辑 - 邮箱格式错误（BUG-002）
  console.log('\n=== 测试场景 2: 个人信息编辑 - 邮箱格式错误（BUG-002） ===');
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'testuser3',
      password: 'password123'
    });
    const token = loginResponse.data.data.token;
    
    // 测试邮箱格式错误
    const response = await axios.post(
      'http://localhost:8080/api/auth/me',
      { email: 'invalid-email' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✗ 测试失败:', response.data);
  } catch (error) {
    console.log('✓ 测试成功:', error.response.data);
  }
  
  // 测试场景 3: 个人信息编辑 - 手机号格式错误（BUG-005）
  console.log('\n=== 测试场景 3: 个人信息编辑 - 手机号格式错误（BUG-005） ===');
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'testuser3',
      password: 'password123'
    });
    const token = loginResponse.data.data.token;
    
    // 测试手机号格式错误
    const response = await axios.post(
      'http://localhost:8080/api/auth/me',
      { phone: 'invalid-phone' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✗ 测试失败:', response.data);
  } catch (error) {
    console.log('✓ 测试成功:', error.response.data);
  }
  
  // 测试场景 4: 个人信息编辑 - 昵称长度过长（BUG-006）
  console.log('\n=== 测试场景 4: 个人信息编辑 - 昵称长度过长（BUG-006） ===');
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'testuser3',
      password: 'password123'
    });
    const token = loginResponse.data.data.token;
    
    // 测试昵称长度过长
    const response = await axios.post(
      'http://localhost:8080/api/auth/me',
      { nickname: '这是一个非常长的昵称，超过了20个字符的限制，用于测试边界条件' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✗ 测试失败:', response.data);
  } catch (error) {
    console.log('✓ 测试成功:', error.response.data);
  }
  
  // 测试场景 5: 未登录用户访问受限接口（BUG-003）
  console.log('\n=== 测试场景 5: 未登录用户访问受限接口（BUG-003） ===');
  try {
    // 不登录直接访问/auth/me接口
    const response = await axios.get('http://localhost:8080/api/auth/me');
    console.log('✗ 测试失败:', response.data);
  } catch (error) {
    console.log('✓ 测试成功:', error.response.data);
  }
  
  // 测试场景 6: 账号注销功能（BUG-004）
  console.log('\n=== 测试场景 6: 账号注销功能（BUG-004） ===');
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'testuser3',
      password: 'password123'
    });
    const token = loginResponse.data.data.token;
    
    // 测试logout接口
    const response = await axios.post(
      'http://localhost:8080/api/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ 测试成功:', response.data);
  } catch (error) {
    console.log('✗ 测试失败:', error.response.data);
  }
}

testFixValidation();
