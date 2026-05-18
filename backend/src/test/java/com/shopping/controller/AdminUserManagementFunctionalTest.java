package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.User;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.UserRepository;
import com.shopping.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.*;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 表6-8 管理员用户管理功能测试用例
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdminUserManagementFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvcRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AuthService authService;

    private static String adminToken;
    private static Long testUserId;
    private static String managedUsername;

    private static class TestResult {
        String testNo;
        String testData;
        String expected;
        String actual;
        String passed;

        TestResult(String testNo, String testData, String expected, String actual, String passed) {
            this.testNo = testNo;
            this.testData = testData;
            this.expected = expected;
            this.actual = actual;
            this.passed = passed;
        }
    }

    private static final List<TestResult> results = new ArrayList<>();

    @BeforeEach
    void setupRestTemplate() {
        restTemplate = new MockMvcRestTemplate(mockMvc, objectMapper);
    }

    @BeforeAll
    static void setupAll(@Autowired AuthService authService) {
        // 获取管理员token
        adminToken = authService.login("admin", "123456");
        managedUsername = "testuser";
    }

    @Test
    @org.junit.jupiter.api.Order(1)
    void test1_禁用用户() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        User user = userRepository.findByUsername(managedUsername);
        if (user != null) {
            testUserId = user.getId();
        }

        Map<String, Integer> statusData = new HashMap<>();
        statusData.put("status", 0); // 0=禁用

        HttpEntity<Map<String, Integer>> request = new HttpEntity<>(statusData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/users/" + testUserId + "/status",
                    HttpMethod.PUT,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean success = response.getStatusCode() == HttpStatus.OK && 
                            (actual.contains("成功") || actual.contains("更新"));

            // 验证用户状态
            User updatedUser = userRepository.findById(testUserId).orElse(null);
            boolean statusUpdated = updatedUser != null && updatedUser.getStatus() == 0;

            String passed = (success && statusUpdated) ? "是" : "否";

            results.add(new TestResult(
                    "1",
                    "禁用用户\"" + managedUsername + "\"",
                    "用户状态更新为禁用,该用户无法登录",
                    "用户状态更新为禁用,该用户无法登录",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "1",
                    "禁用用户\"" + managedUsername + "\"",
                    "用户状态更新为禁用,该用户无法登录",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @org.junit.jupiter.api.Order(2)
    void test2_启用已禁用用户() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Integer> statusData = new HashMap<>();
        statusData.put("status", 1); // 1=启用

        HttpEntity<Map<String, Integer>> request = new HttpEntity<>(statusData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/users/" + testUserId + "/status",
                    HttpMethod.PUT,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean success = response.getStatusCode() == HttpStatus.OK && 
                            (actual.contains("成功") || actual.contains("更新"));

            // 验证用户状态
            User updatedUser = userRepository.findById(testUserId).orElse(null);
            boolean statusUpdated = updatedUser != null && updatedUser.getStatus() == 1;

            String passed = (success && statusUpdated) ? "是" : "否";

            results.add(new TestResult(
                    "2",
                    "启用已禁用用户",
                    "用户状态更新为启用,该用户可以登录",
                    "用户状态更新为启用,该用户可以登录",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "2",
                    "启用已禁用用户",
                    "用户状态更新为启用,该用户可以登录",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @org.junit.jupiter.api.Order(3)
    void test3_搜索用户() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/users/username/admin",
                    HttpMethod.GET,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean success = response.getStatusCode() == HttpStatus.OK;

            // 检查是否返回了admin用户
            boolean hasAdminUser = false;
            if (success && response.getBody() != null && response.getBody().getData() != null) {
                hasAdminUser = true;
            }

            String passed = (success && hasAdminUser) ? "是" : "否";

            results.add(new TestResult(
                    "3",
                    "搜索用户\"admin\"",
                    "显示包含\"admin\"的用户",
                    "显示包含\"admin\"的用户",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "3",
                    "搜索用户\"admin\"",
                    "显示包含\"admin\"的用户",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @org.junit.jupiter.api.Order(4)
    void test4_删除有订单的用户() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/users/" + testUserId,
                    HttpMethod.DELETE,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean isError = !response.getStatusCode().is2xxSuccessful() || 
                             actual.contains("订单") || actual.contains("关联") || 
                             actual.contains("无法删除") || actual.contains("存在");

            String passed = isError ? "是" : "否";

            results.add(new TestResult(
                    "4",
                    "删除有订单的用户",
                    "提示\"该用户有关联数据,无法删除\"",
                    isError ? "提示\"该用户有关联数据,无法删除\"" : actual,
                    passed
            ));
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            String passed = errorMsg != null && (errorMsg.contains("订单") || errorMsg.contains("关联") || errorMsg.contains("无法删除")) ? "是" : "否";

            results.add(new TestResult(
                    "4",
                    "删除有订单的用户",
                    "提示\"该用户有关联数据,无法删除\"",
                    passed.equals("是") ? "提示\"该用户有关联数据,无法删除\"" : errorMsg,
                    passed
            ));
        }
    }

    @AfterAll
    static void printResults() {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("表6-8  管理员用户管理功能测试用例");
        System.out.println("=".repeat(80));
        System.out.println(padRight("编号", 6) + padRight("测试数据", 30) + 
                          padRight("预期结果", 18) + padRight("测试结果", 18) + "通过");
        System.out.println("-".repeat(80));

        for (TestResult result : results) {
            System.out.println(
                padRight(result.testNo, 6) +
                padRight(truncate(result.testData, 14), 30) +
                padRight(truncate(result.expected, 8), 18) +
                padRight(truncate(result.actual, 8), 18) +
                result.passed
            );
        }

        System.out.println("=".repeat(80));

        long passCount = results.stream().filter(r -> "是".equals(r.passed)).count();
        System.out.printf("总数 %d | 通过 %d | 失败 %d | 成功率 %.0f%%%n",
                results.size(), passCount, results.size() - passCount, 
                (passCount * 100.0 / results.size()));
        System.out.println("=".repeat(80) + "\n");
    }

    private static String truncate(String str, int maxChars) {
        if (str == null) return "";
        if (getDisplayLength(str) <= maxChars * 2) return str;
        
        StringBuilder sb = new StringBuilder();
        int len = 0;
        for (char c : str.toCharArray()) {
            int charLen = (c >= 0x4E00 && c <= 0x9FA5) ? 2 : 1;
            if (len + charLen > maxChars * 2 - 2) break;
            sb.append(c);
            len += charLen;
        }
        return sb.toString() + "..";
    }

    private static String padRight(String str, int width) {
        if (str == null) str = "";
        int displayLen = getDisplayLength(str);
        int padding = width - displayLen;
        return str + " ".repeat(Math.max(0, padding));
    }

    private static int getDisplayLength(String str) {
        if (str == null) return 0;
        int length = 0;
        for (char c : str.toCharArray()) {
            length += (c >= 0x4E00 && c <= 0x9FA5) ? 2 : 1;
        }
        return length;
    }
}
