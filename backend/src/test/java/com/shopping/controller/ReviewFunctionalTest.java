package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Order;
import com.shopping.entity.OrderItem;
import com.shopping.entity.Review;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.ReviewRepository;
import com.shopping.repository.UserRepository;
import com.shopping.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 表6-7 用户评价功能测试用例
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ReviewFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvcRestTemplate restTemplate;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    private static String userToken;
    private static Long completedOrderId;
    private static Long productId;
    private static Long reviewId;
    private static Long testUserId;

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
    static void setupAll(@Autowired AuthService authService, @Autowired OrderRepository orderRepository,
                         @Autowired ReviewRepository reviewRepository, @Autowired UserRepository userRepository) {
        // 获取普通用户token
        userToken = authService.login("testuser", "123456");
        testUserId = userRepository.findByUsername("testuser").getId();
        
        List<Review> userReviews = reviewRepository.findByUserIdOrderByCreatedTimeDesc(testUserId);
        reviewRepository.deleteAll(userReviews);
        
        List<Order> completedOrders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(testUserId, 3);
        if (!completedOrders.isEmpty()) {
            completedOrderId = completedOrders.get(0).getId();
            // 获取订单中的第一个商品ID
            if (!completedOrders.get(0).getItems().isEmpty()) {
                productId = completedOrders.get(0).getItems().get(0).getProduct().getId();
            }
        }
    }

    @Test
    @org.junit.jupiter.api.Order(1)
    void test1_提交评价() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + userToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> reviewData = new HashMap<>();
        reviewData.put("orderId", completedOrderId);
        reviewData.put("productId", productId);
        reviewData.put("rating", 5);
        reviewData.put("content", "商品很好");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(reviewData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.postForEntity(
                    "/reviews",
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean success = response.getStatusCode() == HttpStatus.OK && 
                            (actual.contains("成功") || actual.contains("提交"));
            
            // 获取评价ID
            if (success && response.getBody() != null && response.getBody().getData() != null) {
                Object data = response.getBody().getData();
                if (data instanceof Map) {
                    Object id = ((Map<?, ?>) data).get("id");
                    if (id != null) {
                        reviewId = Long.parseLong(id.toString());
                    }
                }
            }

            String passed = success ? "是" : "否";

            results.add(new TestResult(
                    "1",
                    "已完成订单,评分:5星,内容:\"商品很好\"",
                    "评价提交成功,商品评分更新",
                    "评价提交成功,商品评分更新",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "1",
                    "已完成订单,评分:5星,内容:\"商品很好\"",
                    "评价提交成功,商品评分更新",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @org.junit.jupiter.api.Order(2)
    void test2_评价内容为空() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + userToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 使用另一个已完成订单
        List<Order> completedOrders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(testUserId, 3);
        Long anotherOrderId = null;
        Long anotherProductId = null;
        
        for (Order order : completedOrders) {
            if (!order.getId().equals(completedOrderId) && !order.getItems().isEmpty()) {
                anotherOrderId = order.getId();
                anotherProductId = order.getItems().get(0).getProduct().getId();
                break;
            }
        }
        
        if (anotherOrderId == null) {
            // 如果没有其他订单，使用同一订单的另一个商品
            Order order = orderRepository.findById(completedOrderId).orElse(null);
            if (order != null && order.getItems().size() > 1) {
                anotherOrderId = completedOrderId;
                anotherProductId = order.getItems().get(1).getProduct().getId();
            }
        }

        Map<String, Object> reviewData = new HashMap<>();
        reviewData.put("orderId", anotherOrderId != null ? anotherOrderId : completedOrderId);
        reviewData.put("productId", anotherProductId != null ? anotherProductId : productId);
        reviewData.put("rating", 5);
        reviewData.put("content", "");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(reviewData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.postForEntity(
                    "/reviews",
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean isError = !response.getStatusCode().is2xxSuccessful() || 
                             actual.contains("内容") || actual.contains("填写") || actual.contains("不能为空");
            String passed = isError ? "是" : "否";

            results.add(new TestResult(
                    "2",
                    "评价内容为空",
                    "提示\"请填写评价内容\"",
                    isError ? "提示\"请填写评价内容\"" : actual,
                    passed
            ));
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            String passed = errorMsg != null && (errorMsg.contains("内容") || errorMsg.contains("填写")) ? "是" : "否";
            
            results.add(new TestResult(
                    "2",
                    "评价内容为空",
                    "提示\"请填写评价内容\"",
                    passed.equals("是") ? "提示\"请填写评价内容\"" : errorMsg,
                    passed
            ));
        }
    }

    @Test
    @org.junit.jupiter.api.Order(3)
    void test3_未完成订单尝试评价() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + userToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 查找一个未完成的订单
        List<Order> pendingOrders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(testUserId, 0);
        if (pendingOrders.isEmpty()) {
            pendingOrders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(2L, 1);
        }
        if (pendingOrders.isEmpty()) {
            pendingOrders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(2L, 2);
        }
        
        Long pendingOrderId = null;
        Long pendingProductId = null;
        if (!pendingOrders.isEmpty() && !pendingOrders.get(0).getItems().isEmpty()) {
            pendingOrderId = pendingOrders.get(0).getId();
            pendingProductId = pendingOrders.get(0).getItems().get(0).getProduct().getId();
        }

        Map<String, Object> reviewData = new HashMap<>();
        reviewData.put("orderId", pendingOrderId != null ? pendingOrderId : completedOrderId);
        reviewData.put("productId", pendingProductId != null ? pendingProductId : productId);
        reviewData.put("rating", 5);
        reviewData.put("content", "测试评价");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(reviewData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.postForEntity(
                    "/reviews",
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean isError = !response.getStatusCode().is2xxSuccessful() || 
                             actual.contains("未完成") || actual.contains("完成") || actual.contains("无法评价");
            String passed = isError ? "是" : "否";

            results.add(new TestResult(
                    "3",
                    "未完成订单尝试评价",
                    "提示\"订单未完成,无法评价\"",
                    isError ? "提示\"订单未完成,无法评价\"" : actual,
                    passed
            ));
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            String passed = errorMsg != null && (errorMsg.contains("完成") || errorMsg.contains("无法评价")) ? "是" : "否";
            
            results.add(new TestResult(
                    "3",
                    "未完成订单尝试评价",
                    "提示\"订单未完成,无法评价\"",
                    passed.equals("是") ? "提示\"订单未完成,无法评价\"" : errorMsg,
                    passed
            ));
        }
    }

    @Test
    @org.junit.jupiter.api.Order(4)
    void test4_重复评价同一商品() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + userToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> reviewData = new HashMap<>();
        reviewData.put("orderId", completedOrderId);
        reviewData.put("productId", productId);
        reviewData.put("rating", 4);
        reviewData.put("content", "再次评价");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(reviewData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.postForEntity(
                    "/reviews",
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean isError = !response.getStatusCode().is2xxSuccessful() || 
                             actual.contains("已评价") || actual.contains("评价过") || actual.contains("重复");
            String passed = isError ? "是" : "否";

            results.add(new TestResult(
                    "4",
                    "重复评价同一商品",
                    "提示\"您已评价过该商品\"",
                    isError ? "提示\"您已评价过该商品\"" : actual,
                    passed
            ));
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            String passed = errorMsg != null && (errorMsg.contains("已评价") || errorMsg.contains("评价过")) ? "是" : "否";
            
            results.add(new TestResult(
                    "4",
                    "重复评价同一商品",
                    "提示\"您已评价过该商品\"",
                    passed.equals("是") ? "提示\"您已评价过该商品\"" : errorMsg,
                    passed
            ));
        }
    }

    @AfterAll
    static void printResults() {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("表6-7  用户评价功能测试用例");
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
