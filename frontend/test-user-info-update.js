import axios from 'axios';

// 测试个人信息编辑功能
async function testUserInfoUpdate() {
  // 使用 testuser3 登录获取 token
  const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
    username: 'testuser3',
    password: 'password123'
  });
  
  console.log('登录成功:', loginResponse.data);
  const token = loginResponse.data.data.token;
  const userId = loginResponse.data.data.user.id;
  
  // 测试场景 1: 正常流程 - 修改所有字段
  console.log('\n=== 测试场景 1: 正常流程 - 修改所有字段 ===');
  try {
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      {
        email: 'updated-testuser3@example.com',
        phone: '13800138000',
        nickname: '更新后的测试用户3',
        bio: '这是更新后的个性签名'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', updateResponse.data);
    
    // 验证更新是否生效
    const meResponse = await axios.get(
      'http://localhost:8080/api/auth/me',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('获取更新后的用户信息:', meResponse.data);
    
    // 验证字段是否正确更新
    const updatedUser = meResponse.data.data;
    if (updatedUser.email === 'updated-testuser3@example.com') {
      console.log('✓ 邮箱更新成功');
    } else {
      console.log('✗ 邮箱更新失败');
    }
    
    if (updatedUser.phone === '13800138000') {
      console.log('✓ 手机号更新成功');
    } else {
      console.log('✗ 手机号更新失败');
    }
    
    if (updatedUser.nickname === '更新后的测试用户3') {
      console.log('✓ 昵称更新成功');
    } else {
      console.log('✗ 昵称更新失败');
    }
    
    if (updatedUser.bio === '这是更新后的个性签名') {
      console.log('✓ 个性签名更新成功');
    } else {
      console.log('✗ 个性签名更新失败');
    }
    
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
  
  // 测试场景 2: 边界条件 - 邮箱格式错误
  console.log('\n=== 测试场景 2: 边界条件 - 邮箱格式错误 ===');
  try {
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      {
        email: 'invalid-email-format'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', updateResponse.data);
    console.log('✗ 预期应该失败，但更新成功了');
  } catch (error) {
    console.error('测试结果:', error.response ? error.response.data : error.message);
    console.log('✓ 预期失败，符合预期');
  }
  
  // 测试场景 3: 边界条件 - 手机号格式错误
  console.log('\n=== 测试场景 3: 边界条件 - 手机号格式错误 ===');
  try {
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      {
        phone: 'invalid-phone-format'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', updateResponse.data);
    console.log('✗ 预期应该失败，但更新成功了');
  } catch (error) {
    console.error('测试结果:', error.response ? error.response.data : error.message);
    console.log('✓ 预期失败，符合预期');
  }
  
  // 测试场景 4: 边界条件 - 昵称长度过长
  console.log('\n=== 测试场景 4: 边界条件 - 昵称长度过长 ===');
  try {
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      {
        nickname: '这是一个非常长的昵称，超过了20个字符的限制，用于测试边界条件'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('测试结果:', updateResponse.data);
    console.log('✗ 预期应该失败，但更新成功了');
  } catch (error) {
    console.error('测试结果:', error.response ? error.response.data : error.message);
    console.log('✓ 预期失败，符合预期');
  }
  
  // 测试场景 5: 异常场景 - 未登录状态下修改个人信息
  console.log('\n=== 测试场景 5: 异常场景 - 未登录状态下修改个人信息 ===');
  try {
    const updateResponse = await axios.post(
      'http://localhost:8080/api/auth/me',
      {
        email: 'test@example.com'
      }
      // 不传递 Authorization header
    );
    console.log('测试结果:', updateResponse.data);
    console.log('✗ 预期应该失败，但更新成功了');
  } catch (error) {
    console.error('测试结果:', error.response ? error.response.data : error.message);
    console.log('✓ 预期失败，符合预期');
  }
}

testUserInfoUpdate();
