package com.shopping.controller;

import com.shopping.entity.User;
import com.shopping.repository.UserRepository;
import com.shopping.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UserController 集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 添加事务注解，测试结束后自动回滚
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

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
    }

    @Test
    @WithMockUser(username = "testuser", authorities = {"USER"})
    void testDeleteCurrentUser() throws Exception {
        // 执行DELETE请求删除当前用户
        mockMvc.perform(delete("/users/me")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("账号删除成功"));

        // 验证用户是否已被删除
        User deletedUser = userRepository.findByUsername("testuser");
        assertNull(deletedUser, "用户应该已被删除");
    }
}
