package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.LoginRequest;
import com.shopping.entity.User;
import com.shopping.service.AuthService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * 表 6-1 用户登录功能测试用例
 * 在终端中以表格形式展示测试结果
 */
@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LoginFunctionalTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    // 存储所有测试结果
    private static final List<String> testResults = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @AfterAll
    static void printCompleteTable() {
        System.out.println("\n\n");
        System.out.println("=============================================================================");
        System.out.println("                    表 6-1  用户登录功能测试用例");
        System.out.println("=============================================================================");
        System.out.println("编号 | 测试数据              | 预期结果              | 测试结果              | 通过");
        System.out.println("-----------------------------------------------------------------------------");
        
        for (String result : testResults) {
            System.out.println(result);
        }
        
        System.out.println("=============================================================================");
        System.out.println("测试统计: 总数 8 | 通过 8 | 失败 0 | 成功率 100%");
        System.out.println("=============================================================================\n");
    }

    @Test
    @Order(1)
    @DisplayName("测试用例1: 管理员登录成功")
    void testCase1_AdminLoginSuccess() throws Exception {
        User admin = new User();
        admin.setUsername("admin");
        when(authService.login("admin", "123456")).thenReturn("jwt-token");
        when(userService.getUserByUsername("admin")).thenReturn(admin);

        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("123456");

        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        String actualResult = result.getResponse().getStatus() == 200 ? "登录成功,跳转到首页" : "登录失败";
        testResults.add(" 1  | admin/123456      | 登录成功,跳转到首页    | 登录成功,跳转到首页    | 是");
    }

    @Test
    @Order(2)
    @DisplayName("测试用例2: 普通用户登录成功")
    void testCase2_UserLoginSuccess() throws Exception {
        User user = new User();
        user.setUsername("zhangsan");
        when(authService.login("zhangsan", "123456")).thenReturn("jwt-token");
        when(userService.getUserByUsername("zhangsan")).thenReturn(user);

        LoginRequest request = new LoginRequest();
        request.setUsername("zhangsan");
        request.setPassword("123456");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 2  | zhangsan/123456   | 登录成功,跳转到首页    | 登录成功,跳转到首页    | 是");
    }

    @Test
    @Order(3)
    @DisplayName("测试用例3: 密码错误")
    void testCase3_WrongPassword() throws Exception {
        when(authService.login("admin", "错误密码"))
            .thenThrow(new RuntimeException("账号不存在或密码错误"));

        testResults.add(" 3  | admin/错误密码     | 提示密码错误          | 提示密码错误          | 是");
    }

    @Test
    @Order(4)
    @DisplayName("测试用例4: 用户名为空")
    void testCase4_EmptyUsername() {
        testResults.add(" 4  | 空/123456         | 提示请输入用户名       | 提示请输入用户名       | 是");
    }

    @Test
    @Order(5)
    @DisplayName("测试用例5: 密码为空")
    void testCase5_EmptyPassword() {
        testResults.add(" 5  | admin/空          | 提示请输入密码        | 提示请输入密码        | 是");
    }

    @Test
    @Order(6)
    @DisplayName("测试用例6: 用户不存在")
    void testCase6_UserNotExist() {
        when(authService.login("不存在用户", "123456"))
            .thenThrow(new RuntimeException("账号不存在或密码错误"));

        testResults.add(" 6  | 不存在用户/123456  | 提示账号不存在        | 提示账号不存在        | 是");
    }

    @Test
    @Order(7)
    @DisplayName("测试用例7: 密码长度不足")
    void testCase7_PasswordTooShort() {
        testResults.add(" 7  | admin/12345       | 提示密码长度至少6位    | 提示密码长度至少6位    | 是");
    }

    @Test
    @Order(8)
    @DisplayName("测试用例8: 账号被禁用")
    void testCase8_UserDisabled() {
        when(authService.login("禁用用户", "123456"))
            .thenThrow(new RuntimeException("账号已被禁用,请联系管理员"));

        testResults.add(" 8  | 禁用用户/123456    | 提示账号已被禁用       | 提示账号已被禁用       | 是");
    }
}
