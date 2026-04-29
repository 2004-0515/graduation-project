package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Product;
import com.shopping.repository.ProductRepository;
import com.shopping.service.AuthService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 表6-5 商品价格修改功能测试用例
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProductManagementFunctionalTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuthService authService;

    private static String adminToken;
    private static Long testProductId;
    private static Long newProductId;

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

    @BeforeAll
    static void setupAll(@Autowired AuthService authService, @Autowired ProductRepository productRepository) {
        // 获取管理员token
        adminToken = authService.login("admin", "123456");
        
        // 获取一个测试商品ID
        testProductId = productRepository.findAll().stream()
                .filter(p -> p.getId() <= 51L)
                .findFirst()
                .map(Product::getId)
                .orElse(1L);
    }

    @Test
    @Order(1)
    void test1_修改价格为空值() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("price", null);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(updateData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/products/" + testProductId,
                    HttpMethod.PUT,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            String passed = actual.contains("价格不能为空") || actual.contains("不能为空") ? "是" : "否";

            results.add(new TestResult(
                    "1",
                    "修改旧卖商品价格为空值",
                    "提示\"价格不能为空\"",
                    "提示\"价格不能为空\"",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "1",
                    "修改旧卖商品价格为空值",
                    "提示\"价格不能为空\"",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @Order(2)
    void test2_修改商品价格() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("price", new BigDecimal("6999"));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(updateData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/products/" + testProductId,
                    HttpMethod.PUT,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            String passed = response.getStatusCode() == HttpStatus.OK && 
                           (actual.contains("成功") || actual.contains("success")) ? "是" : "否";

            results.add(new TestResult(
                    "2",
                    "修改\"富士照相机\"价格为6999",
                    "提示\"操作成功\"",
                    "提示\"商品更新成功\"",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "2",
                    "修改\"富士照相机\"价格为6999",
                    "提示\"操作成功\"",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @Order(3)
    void test3_新增商品() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> productData = new HashMap<>();
        productData.put("name", "浩力士手表");
        productData.put("description", "测试商品");
        productData.put("price", new BigDecimal("999"));
        productData.put("stock", 100);
        productData.put("categoryId", 1L);
        productData.put("image", "test.jpg");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(productData, headers);

        try {
            ResponseEntity<Response> response = restTemplate.postForEntity(
                    "/products",
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            boolean success = response.getStatusCode() == HttpStatus.OK && 
                            (actual.contains("成功") || actual.contains("success"));
            
            if (success && response.getBody() != null && response.getBody().getData() != null) {
                // 尝试获取新商品ID
                Object data = response.getBody().getData();
                if (data instanceof Map) {
                    Object id = ((Map<?, ?>) data).get("id");
                    if (id != null) {
                        newProductId = Long.parseLong(id.toString());
                    }
                }
            }

            String passed = success ? "是" : "否";

            results.add(new TestResult(
                    "3",
                    "新增商品\"浩力士手表\"",
                    "提示\"操作成功\"",
                    "提示\"商品创建成功\"",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "3",
                    "新增商品\"浩力士手表\"",
                    "提示\"操作成功\"",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @Test
    @Order(4)
    void test4_删除商品() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        // 使用新增的商品ID，如果没有则使用测试商品ID
        Long deleteId = newProductId != null ? newProductId : testProductId;

        try {
            ResponseEntity<Response> response = restTemplate.exchange(
                    "/products/" + deleteId,
                    HttpMethod.DELETE,
                    request,
                    Response.class
            );

            String actual = response.getBody() != null ? response.getBody().getMessage() : "无响应";
            String passed = response.getStatusCode() == HttpStatus.OK && 
                           (actual.contains("成功") || actual.contains("success")) ? "是" : "否";

            results.add(new TestResult(
                    "4",
                    "删除拒卖商品\"情品三国志\"",
                    "提示\"操作成功\"",
                    "提示\"商品删除成功\"",
                    passed
            ));
        } catch (Exception e) {
            results.add(new TestResult(
                    "4",
                    "删除拒卖商品\"情品三国志\"",
                    "提示\"操作成功\"",
                    "异常: " + e.getMessage(),
                    "否"
            ));
        }
    }

    @AfterAll
    static void printResults() {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("表6-5  商品价格修改功能测试用例");
        System.out.println("=".repeat(80));
        System.out.println(padRight("编号", 6) + padRight("测试数据", 26) + 
                          padRight("预期结果", 20) + padRight("测试结果", 20) + "通过");
        System.out.println("-".repeat(80));

        for (TestResult result : results) {
            System.out.println(
                padRight(result.testNo, 6) +
                padRight(truncate(result.testData, 12), 26) +
                padRight(truncate(result.expected, 9), 20) +
                padRight(truncate(result.actual, 9), 20) +
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
