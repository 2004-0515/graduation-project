package com.shopping.controller;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.repository.SecuritySettingsRepository;
import com.shopping.repository.UserRepository;
import com.shopping.service.SecuritySettingsService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 安全设置控制器集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 添加事务注解，测试结束后自动回滚
class SecuritySettingsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecuritySettingsRepository securitySettingsRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SecuritySettingsService securitySettingsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        // 创建测试用户，使用唯一的用户名和邮箱地址，避免与现有数据冲突
        long timestamp = System.currentTimeMillis();
        String uniqueUsername = "testuser-" + timestamp;
        String uniqueEmail = "test-" + timestamp + "@example.com";
        
        testUser = new User();
        testUser.setUsername(uniqueUsername);
        testUser.setPassword("password123");
        testUser.setEmail(uniqueEmail);
        testUser.setPhone("13800138000");
        testUser.setStatus(1); // 设置用户状态为正常
        testUser = userService.saveUser(testUser);

        // 初始化安全设置
        SecuritySettings securitySettings = securitySettingsService.getSecuritySettings(testUser);
    }

    @Test
    void testGetCurrentUserSecuritySettings() throws Exception {
        // 先登录获取JWT token
        String loginResponse = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + testUser.getUsername() + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        // 提取JWT token - 使用更可靠的方式
        int tokenStart = loginResponse.indexOf("\"token\":\"" ) + 9;
        int tokenEnd = loginResponse.indexOf("\"", tokenStart);
        String token = loginResponse.substring(tokenStart, tokenEnd);
        
        // 使用JWT token执行GET请求获取安全设置
        mockMvc.perform(get("/security-settings/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("获取安全设置成功"))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.passwordExpireDays").value(90)); // 默认值
    }

    @Test
    void testUpdateCurrentUserSecuritySettings() throws Exception {
        // 先登录获取JWT token
        String loginResponse = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + testUser.getUsername() + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        // 提取JWT token - 使用更可靠的方式
        int tokenStart = loginResponse.indexOf("\"token\":\"" ) + 9;
        int tokenEnd = loginResponse.indexOf("\"", tokenStart);
        String token = loginResponse.substring(tokenStart, tokenEnd);
        
        // 构建更新请求体
        String updateRequest = "{\"passwordExpireDays\": 180, \"twoFactorEnabled\": true, \"sessionTimeout\": 60}";

        // 执行PUT请求更新安全设置
        mockMvc.perform(put("/security-settings/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("更新安全设置成功"))
                .andExpect(jsonPath("$.data.passwordExpireDays").value(180))
                .andExpect(jsonPath("$.data.twoFactorEnabled").value(true))
                .andExpect(jsonPath("$.data.sessionTimeout").value(60));
    }

    @Test
    void testResetLoginAttempts() throws Exception {
        // 先获取当前安全设置
        SecuritySettings currentSettings = securitySettingsService.getSecuritySettings(testUser);
        currentSettings.setLoginAttempts(5);
        securitySettingsRepository.save(currentSettings);
        
        // 先登录获取JWT token
        String loginResponse = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + testUser.getUsername() + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        // 提取JWT token - 使用更可靠的方式
        int tokenStart = loginResponse.indexOf("\"token\":\"" ) + 9;
        int tokenEnd = loginResponse.indexOf("\"", tokenStart);
        String token = loginResponse.substring(tokenStart, tokenEnd);

        // 执行POST请求重置登录失败次数
        mockMvc.perform(post("/security-settings/reset-login-attempts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("重置登录失败次数成功"));

        // 验证登录失败次数已重置
        SecuritySettings updatedSettings = securitySettingsService.getSecuritySettings(testUser);
        assertEquals(0, updatedSettings.getLoginAttempts());
    }
}
