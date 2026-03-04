package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.LoginRequest;
import com.shopping.dto.RegisterRequest;
import com.shopping.entity.User;
import com.shopping.service.AuthService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 单元测试
 * 使用 Mockito 独立测试，不加载 Spring 上下文
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setStatus(1);
        testUser.setPoints(0);
        testUser.setGrowthValue(0);
        testUser.setMemberDays(0);

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setPassword("Test123456");
        registerRequest.setEmail("newuser@example.com");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("Test123456");
    }

    @AfterEach
    void tearDown() {
        // 清理 SecurityContext
        SecurityContextHolder.clearContext();
    }

    /**
     * 设置模拟的认证用户
     */
    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("注册成功")
    void register_WithValidData_ShouldSucceed() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(testUser);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("用户注册成功"));
    }

    @Test
    @DisplayName("登录成功")
    void login_WithValidCredentials_ShouldReturnToken() throws Exception {
        when(authService.login(anyString(), anyString())).thenReturn("jwt-token");
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("jwt-token"));
    }

    @Test
    @DisplayName("获取当前用户信息 - 已认证")
    void getCurrentUser_WhenAuthenticated_ShouldReturnUser() throws Exception {
        // 设置认证用户
        setAuthenticatedUser("testuser");
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("testuser"));
    }

    @Test
    @DisplayName("退出登录")
    void logout_ShouldSucceed() throws Exception {
        // 设置认证用户
        setAuthenticatedUser("testuser");

        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("退出登录成功"));
    }
}
